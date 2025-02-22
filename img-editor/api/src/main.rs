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

fn load_elf() -> Vec<u8> {
    let target_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("target/riscv-guest");
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
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/prove", post(generate_proof))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("Server running on http://{}", addr);

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
    let client = ProverClient::from_env();
    let elf_data = load_elf();

    // Setup the program
    let (pk, vk) = client.setup(&elf_data);

    // Create input with image data and transformations
    let input = img_editor_lib::ImageInput {
        image_data,
        transformations: request.transformations,
        signature_data: request.signature_data,
    };

    // Setup stdin with serialized input
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    // Generate the proof
    match client.prove(&pk, &stdin).run() {
        Ok(proof) => {
            if let Err(e) = client.verify(&proof, &vk) {
                return ProofResponse::error(format!("Proof verification failed: {}", e));
            }

            let output = client.execute(&elf_data, &stdin).run().unwrap().0;
            let output: img_editor_lib::ImageOutput = bincode::deserialize(output.as_slice()).unwrap();

            Json(ProofResponse {
                success: true,
                message: "Proof generated and verified successfully".to_string(),
                public_output: PublicOutput {
                    final_image: output.final_image,
                    original_image_hash: output.original_image_hash,
                    signer_public_key: output.signer_public_key,
                },
                proof_data: Some(ProofData {
                    proof: hex::encode(proof.bytes()),
                    verification_key: vk.bytes32(),
                }),
            })
        }
        Err(e) => ProofResponse::error(format!("Failed to generate proof: {}", e)),
    }
}
