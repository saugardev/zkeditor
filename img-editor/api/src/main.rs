use axum::{
    Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sp1_sdk::{ProverClient, SP1Stdin};
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
}

#[derive(Serialize)]
struct ProofResponse {
    success: bool,
    message: String,
    proof: Option<String>,
    id: String,
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
    Json(request): Json<ProofRequest>,
) -> Json<ProofResponse> {
    info!("Received proof request for image with id: {}", request.id);
    info!("Image data size: {} bytes", request.image_data.len());
    info!("Number of transformations: {}", request.transformations.len());
    
    for (i, t) in request.transformations.iter().enumerate() {
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

    // Create input with image data and transformations
    info!("Creating program input...");
    let input = img_editor_lib::ImageInput {
        image_data: request.image_data,
        transformations: request.transformations,
        id: request.id.clone(),
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
