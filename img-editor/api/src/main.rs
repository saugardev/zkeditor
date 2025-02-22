use axum::{
    Json,
    routing::{get, post},
    Router,
    extract::Multipart,
};
use serde::{Deserialize, Serialize};
use sp1_sdk::{ProverClient, SP1Stdin, HashableKey};
use std::{net::SocketAddr, path::PathBuf};
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tracing::{info, warn, error};
use tracing_subscriber;

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
    image_data: Vec<u8>,
    id: String,
    transformations: Vec<img_editor_lib::Transformation>,
    signature_data: Option<img_editor_lib::SignatureData>,
}

#[derive(Serialize)]
struct ProofData {
    proof: String,
    verification_key: String,
}

#[derive(Serialize)]
struct PublicOutput {
    final_image: Vec<u8>,
    original_image_hash: Vec<u8>,
    signer_public_key: Option<Vec<u8>>,
}

#[derive(Serialize)]
struct ProofResponse {
    success: bool,
    message: String,
    public_output: PublicOutput,
    proof_data: Option<ProofData>,
}

impl ProofResponse {
    fn error(message: impl Into<String>) -> Json<Self> {
        Json(Self {
            success: false,
            message: message.into(),
            public_output: PublicOutput {
                final_image: vec![],
                original_image_hash: vec![],
                signer_public_key: None,
            },
            proof_data: None,
        })
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

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/prove", post(generate_proof))
        .layer(CorsLayer::permissive());

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

async fn generate_proof(
    mut multipart: Multipart,
) -> Json<ProofResponse> {
    info!("Received proof request for image with id: {}", request.id);
    info!("Image data size: {} bytes", request.image_data.len());
    info!("Number of transformations: {}", request.transformations.len());
    
    for (i, t) in request.transformations.iter().enumerate() {
        info!("Transformation {}: {:?}", i, t);
    }
    // Get the image file from multipart form
    let mut image_data = Vec::new();
    let mut request = None;

    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        
        match name.as_str() {
            "image" => {
                image_data = field.bytes().await.unwrap().to_vec();
            },
            "request" => {
                let json_str = String::from_utf8(field.bytes().await.unwrap().to_vec()).unwrap();
                request = Some(serde_json::from_str::<ProofRequest>(&json_str).unwrap());
            },
            _ => {}
        }
    }

    let request = match request {
        Some(req) => req,
        None => return ProofResponse::error("Missing request data"),
    };

    if image_data.is_empty() {
        return ProofResponse::error("Missing image file");
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

    // Create input with image data and transformations
    info!("Creating program input...");
    let input = img_editor_lib::ImageInput {
        image_data: request.image_data,
        transformations: request.transformations,
        signature_data: request.signature_data,
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
                return Json(ProofResponse {
                    success: false,
                    message: format!("Proof verification failed: {}", e),
                    proof: None,
                    id: request.id,
                });
            }

            let proof_hex = hex::encode(proof.bytes());
            info!("Groth16 proof verified successfully! Length: {}", proof_hex.len());
            
            Json(ProofResponse {
                success: true,
                message: "Proof generated and verified successfully".to_string(),
                proof: Some(proof_hex),
                id: request.id,
            })
        }
        Err(e) => {
            error!("Failed to generate proof: {}", e);
            Json(ProofResponse {
                success: false,
                message: format!("Failed to generate proof: {}", e),
                proof: None,
                id: request.id,
            })
        }
    }
}
