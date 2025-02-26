use axum::{http::StatusCode, Json, response::{IntoResponse, Response}};
use std::path::PathBuf;
use tracing::info;

use crate::types::ProofResponse;

pub fn load_elf() -> Vec<u8> {
    info!("Loading ELF file...");
    let target_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("target/elf-compilation/riscv32im-succinct-zkvm-elf/release");
    
    info!("Looking for ELF file in: {}", target_dir.display());
    
    std::fs::read(target_dir.join("img-editor-program"))
        .expect("Failed to read ELF file. Did you run 'cargo prove build' in the program directory?")
}

impl ProofResponse {
    pub fn error(message: impl Into<String>) -> Response {
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

    pub fn success(
        final_image: Vec<u8>,
        original_hash: String,
        transformed_hash: String,
        signer_key: String,
        has_sig: bool,
        proof: Option<crate::types::ProofData>,
    ) -> Response {
        let response = Self {
            success: true,
            message: "Proof generated successfully".to_string(),
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