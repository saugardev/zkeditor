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
use reqwest;

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
    asset_uri: String,
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
    Json(request): Json<ProofRequest>,
) -> Json<ProofResponse> {
    // Fetch image from URI
    let image_data = match reqwest::get(&request.asset_uri).await {
        Ok(response) => response.bytes().await.unwrap().to_vec(),
        Err(e) => {
            return Json(ProofResponse {
                success: false,
                message: format!("Failed to fetch image: {}", e),
                proof: None,
                id: request.id,
            });
        }
    };

    // Setup the prover client
    let client = ProverClient::from_env();
    let elf_data = load_elf();

    // Setup the program
    let (pk, vk) = client.setup(&elf_data);

    // Create input with image data and transformations
    let input = img_editor_lib::ImageInput {
        image_data,
        transformations: request.transformations,
        id: request.id.clone(),
    };

    // Setup stdin with serialized input
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    // Generate the proof
    match client.prove(&pk, &stdin).run() {
        Ok(proof) => {
            if let Err(e) = client.verify(&proof, &vk) {
                return Json(ProofResponse {
                    success: false,
                    message: format!("Proof verification failed: {}", e),
                    proof: None,
                    id: request.id,
                });
            }

            Json(ProofResponse {
                success: true,
                message: "Proof generated and verified successfully".to_string(),
                proof: Some(hex::encode(proof.bytes())),
                id: request.id,
            })
        }
        Err(e) => Json(ProofResponse {
            success: false,
            message: format!("Failed to generate proof: {}", e),
            proof: None,
            id: request.id,
        }),
    }
}
