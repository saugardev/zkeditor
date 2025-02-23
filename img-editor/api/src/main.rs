use axum::{
    Json,
    routing::{get, post},
    Router,
    extract::Multipart,
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};
use sp1_sdk::{ProverClient, SP1Stdin, HashableKey};
use std::{net::SocketAddr, path::PathBuf};
use tokio::net::TcpListener;
use tower_http::cors::{CorsLayer, Any};
use tracing::{info, error};
use tracing_subscriber;
use alloy_sol_types::SolType;
use image;
use hex;

fn load_elf() -> Vec<u8> {
    info!("Loading ELF file...");
    let target_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("target/elf-compilation/riscv32im-succinct-zkvm-elf/release");
    
    info!("Looking for ELF file in: {}", target_dir.display());
    
    std::fs::read(target_dir.join("img-editor-program"))
        .expect("Failed to read ELF file. Did you run 'cargo prove build' in the program directory?")
}

#[derive(Deserialize)]
struct ProofRequest {
    transformations: Vec<img_editor_lib::Transformation>,
    signature_data: Option<img_editor_lib::SignatureData>,
}

#[derive(Serialize)]
struct ProofData {
    proof: String,
    verification_key: String,
    public_values: String,
}

#[derive(Serialize)]
struct ProofResponse {
    success: bool,
    message: String,
    final_image: Vec<u8>,
    original_image_hash: String,
    transformed_image_hash: String,
    signer_public_key: String,
    has_signature: bool,
    proof_data: Option<ProofData>,
}

impl ProofResponse {
    fn error(message: impl Into<String>) -> Response {
        let response = Self {
            success: false,
            message: message.into(),
            final_image: vec![],
            original_image_hash: "0x".to_string(),
            transformed_image_hash: "0x".to_string(),
            signer_public_key: "0x".to_string(),
            has_signature: false,
            proof_data: None,
        };
        
        (StatusCode::BAD_REQUEST, Json(response)).into_response()
    }

    fn success(
        final_image: Vec<u8>,
        original_hash: String,
        transformed_hash: String,
        signer_key: String,
        has_sig: bool,
        proof: Option<ProofData>,
    ) -> Response {
        let response = Self {
            success: true,
            message: "Proof generated and verified successfully".to_string(),
            final_image,
            original_image_hash: original_hash,
            transformed_image_hash: transformed_hash,
            signer_public_key: signer_key,
            has_signature: has_sig,
            proof_data: proof,
        };

        (StatusCode::OK, Json(response)).into_response()
    }
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .with_file(true)
        .with_line_number(true)
        .with_thread_ids(true)
        .with_target(false)
        .init();

    info!("Starting API server...");
    dotenv::dotenv().ok();

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/prove", post(generate_proof))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("Server running on http://{}", addr);

    axum::serve(listener, app.into_make_service())
        .await
        .unwrap();
}

async fn health_check() -> &'static str {
    "OK"
}

async fn generate_proof(mut multipart: Multipart) -> Response {
    let mut image_data = Vec::new();
    let mut transformations = None;
    let mut signature_data = None;
    let mut found_fields = vec![];

    while let Some(field) = multipart.next_field().await.unwrap() {
        if let Some(name) = field.name() {
            info!("Found field: {}", name);
            found_fields.push(name.to_string());
            match name {
                "image" => {
                    image_data = field.bytes().await.unwrap().to_vec();
                    info!("Received image data: {} bytes", image_data.len());
                },
                "transformations" => {
                    let bytes = field.bytes().await.unwrap();
                    info!("Received transformations data: {}", String::from_utf8_lossy(&bytes));
                    match String::from_utf8(bytes.to_vec()) {
                        Ok(json_str) => {
                            match serde_json::from_str::<Vec<img_editor_lib::Transformation>>(&json_str) {
                                Ok(trans) => transformations = Some(trans),
                                Err(e) => {
                                    error!("JSON parse error for transformations: {}", e);
                                    return ProofResponse::error(
                                        format!("Invalid transformations JSON format: {}", e)
                                    )
                                }
                            }
                        },
                        Err(e) => return ProofResponse::error(
                            format!("Invalid UTF-8 in transformations field: {}", e)
                        )
                    }
                },
                "signature_data" => {
                    let bytes = field.bytes().await.unwrap();
                    info!("Received signature data: {}", String::from_utf8_lossy(&bytes));
                    match String::from_utf8(bytes.to_vec()) {
                        Ok(json_str) => {
                            #[derive(Deserialize)]
                            struct HexSignatureData {
                                signature: String,
                                public_key: String,
                            }

                            match serde_json::from_str::<HexSignatureData>(&json_str) {
                                Ok(hex_sig) => {
                                    // Convert hex strings to Vec<u8>
                                    let signature = match hex::decode(hex_sig.signature.trim_start_matches("0x")) {
                                        Ok(s) => s,
                                        Err(e) => {
                                            error!("Invalid hex in signature: {}", e);
                                            return ProofResponse::error(
                                                format!("Invalid hex in signature: {}", e)
                                            )
                                        }
                                    };

                                    let public_key = match hex::decode(hex_sig.public_key.trim_start_matches("0x")) {
                                        Ok(pk) => pk,
                                        Err(e) => {
                                            error!("Invalid hex in public_key: {}", e);
                                            return ProofResponse::error(
                                                format!("Invalid hex in public_key: {}", e)
                                            )
                                        }
                                    };

                                    signature_data = Some(img_editor_lib::SignatureData {
                                        signature,
                                        public_key,
                                    });
                                },
                                Err(e) => {
                                    error!("JSON parse error for signature_data: {}", e);
                                    return ProofResponse::error(
                                        format!("Invalid signature_data JSON format: {}", e)
                                    )
                                }
                            }
                        },
                        Err(e) => return ProofResponse::error(
                            format!("Invalid UTF-8 in signature_data field: {}", e)
                        )
                    }
                },
                _ => {
                    info!("Unexpected field in request: {}", name);
                }
            }
        }
    }

    info!("Found fields: {:?}", found_fields);

    // Remove validation that requires signature_data
    if found_fields.is_empty() {
        return ProofResponse::error("No fields found in request. Required fields: 'image' and 'transformations'");
    }

    if !found_fields.contains(&"image".to_string()) {
        return ProofResponse::error("Missing 'image' field in multipart form data");
    }

    if !found_fields.contains(&"transformations".to_string()) {
        return ProofResponse::error("Missing 'transformations' field in multipart form data");
    }

    // Fix the transformations unwrapping
    let transformations = match transformations {
        Some(t) => t,
        None => return ProofResponse::error("Missing transformations field"),
    };

    // signature_data is optional, no need to validate
    if image_data.is_empty() {
        return ProofResponse::error("Image field was found but contains no data");
    }

    if transformations.is_empty() {
        return ProofResponse::error("No transformations specified in request");
    }

    info!("Image data size: {} bytes", image_data.len());
    info!("Number of transformations: {}", transformations.len());
    
    for (i, t) in transformations.iter().enumerate() {
        info!("Transformation {}: {:?}", i, t);
    }

    // Setup the prover client
    info!("Setting up prover client...");
    let client = ProverClient::from_env();
    let elf_data = load_elf();
    info!("ELF data loaded, size: {} bytes", elf_data.len());

    // Setup the program
    info!("Setting up program...");
    let (pk, vk) = client.setup(&elf_data);
    info!("Program setup complete");

    // Create input with optional signature_data
    let image_data_clone = image_data.clone();
    let input = img_editor_lib::ImageInput {
        image_data,
        transformations: transformations.clone(),
        signature_data,
    };

    // Setup stdin with serialized input
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);
    info!("Input written to stdin");

    // Generate the proof
    info!("Generating Groth16 proof...");
    match client.prove(&pk, &stdin).groth16().run() {
        Ok(proof) => {
            info!("Groth16 proof generated successfully, verifying...");
            if let Err(e) = client.verify(&proof, &vk) {
                error!("Proof verification failed: {}", e);
                return ProofResponse::error(format!("Proof verification failed: {}", e));
            }

            // Get and decode public values
            let public_values = proof.public_values.as_slice();
            let decoded_values = img_editor_lib::ImageProofPublicValues::abi_decode(public_values, false)
                .expect("Failed to decode public values");

            // Generate final image using the cloned data
            let mut layer = img_editor_lib::Layer::new(&image_data_clone)
                .expect("Failed to create layer");
            
            for transformation in transformations.iter() {
                layer.apply_transformation(transformation.clone())
                    .expect("Failed to apply transformation");
            }
            
            let final_image = layer.to_bytes(image::ImageFormat::Png, None)
                .expect("Failed to encode image");

            let solidity_proof = proof.bytes();
            let verification_key = vk.bytes32().to_string();

            ProofResponse::success(
                final_image,
                format!("0x{}", hex::encode(decoded_values.original_image_hash.0)),
                format!("0x{}", hex::encode(decoded_values.transformed_image_hash.0)),
                format!("0x{}", hex::encode(decoded_values.signer_public_key.0)),
                decoded_values.has_signature,
                Some(ProofData {
                    proof: format!("0x{}", hex::encode(solidity_proof)),
                    verification_key,
                    public_values: format!("0x{}", hex::encode(public_values)),
                }),
            )
        }
        Err(e) => {
            error!("Failed to generate proof: {}", e);
            ProofResponse::error(format!("Failed to generate proof: {}", e))
        }
    }
}
