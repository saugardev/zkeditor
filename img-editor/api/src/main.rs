use axum::{
    routing::{get, post},
    Router,
    http::Method,
};
use std::{net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower_http::cors::{CorsLayer, Any};
use tracing::info;
use tracing_subscriber;
use sp1_sdk::HashableKey;

mod handlers;
mod types;
mod utils;

use types::AppState;

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

    // Load the ELF file once at startup
    info!("Loading ELF file...");
    let elf_data = utils::load_elf();
    info!("ELF data loaded, size: {} bytes", elf_data.len());

    // Setup the prover client
    info!("Setting up prover client...");
    let prover = sp1_sdk::ProverClient::from_env();
    
    // Setup the program once at startup
    info!("Setting up program...");
    let (pk, vk) = prover.setup(&elf_data);
    info!("Program setup complete");

    // Create the application state with preloaded components
    let state = AppState {
        prover: Arc::new(prover),
        elf_data: Arc::new(elf_data),
        pk: Arc::new(pk),
        vk: vk.bytes32(),
    };

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(handlers::health_check))
        .route("/prove", post(handlers::generate_proof))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("Server running on http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
