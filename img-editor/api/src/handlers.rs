use axum::{
    extract::{Multipart, State},
    response::Response,
};
use hex;
use image;
use sp1_sdk::SP1Stdin;
use tracing::{info, error};
use alloy_sol_types::SolType;

use crate::types::{AppState, ProofData, ProofResponse, HexSignatureData};

pub async fn health_check() -> &'static str {
    "OK"
}

pub async fn generate_proof(
    State(state): State<AppState>,
    mut multipart: Multipart
) -> Response {
    let mut image_data = Vec::new();
    let mut transformations = None;
    let mut signature_data = None;
    let mut found_fields = vec![];

    // Process multipart form data
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
                    if let Err(response) = process_transformations(&mut transformations, field).await {
                        return response;
                    }
                },
                "signature_data" => {
                    if let Err(response) = process_signature_data(&mut signature_data, field).await {
                        return response;
                    }
                },
                _ => {
                    info!("Unexpected field in request: {}", name);
                }
            }
        }
    }

    info!("Found fields: {:?}", found_fields);

    // Validate required fields
    if let Err(response) = validate_fields(&found_fields, &image_data, &transformations) {
        return response;
    }

    // Unwrap transformations (validation ensures it's Some)
    let transformations = transformations.unwrap();

    // Log transformation details
    log_transformation_details(&image_data, &transformations);

    // Generate proof
    generate_proof_and_response(state, image_data, transformations, signature_data).await
}

async fn process_transformations(
    transformations: &mut Option<Vec<img_editor_lib::Transformation>>,
    field: axum::extract::multipart::Field<'_>
) -> Result<(), Response> {
    let bytes = field.bytes().await.unwrap();
    info!("Received transformations data: {}", String::from_utf8_lossy(&bytes));
    
    match String::from_utf8(bytes.to_vec()) {
        Ok(json_str) => {
            match serde_json::from_str::<Vec<img_editor_lib::Transformation>>(&json_str) {
                Ok(trans) => {
                    *transformations = Some(trans);
                    Ok(())
                },
                Err(e) => {
                    error!("JSON parse error for transformations: {}", e);
                    Err(ProofResponse::error(format!("Invalid transformations JSON format: {}", e)))
                }
            }
        },
        Err(e) => Err(ProofResponse::error(format!("Invalid UTF-8 in transformations field: {}", e)))
    }
}

async fn process_signature_data(
    signature_data: &mut Option<img_editor_lib::SignatureData>,
    field: axum::extract::multipart::Field<'_>
) -> Result<(), Response> {
    let bytes = field.bytes().await.unwrap();
    info!("Received signature data: {}", String::from_utf8_lossy(&bytes));
    
    match String::from_utf8(bytes.to_vec()) {
        Ok(json_str) => {
            match serde_json::from_str::<HexSignatureData>(&json_str) {
                Ok(hex_sig) => {
                    // Convert hex strings to Vec<u8>
                    let signature = match hex::decode(hex_sig.signature.trim_start_matches("0x")) {
                        Ok(s) => s,
                        Err(e) => {
                            error!("Invalid hex in signature: {}", e);
                            return Err(ProofResponse::error(format!("Invalid hex in signature: {}", e)));
                        }
                    };

                    let public_key = match hex::decode(hex_sig.public_key.trim_start_matches("0x")) {
                        Ok(pk) => pk,
                        Err(e) => {
                            error!("Invalid hex in public_key: {}", e);
                            return Err(ProofResponse::error(format!("Invalid hex in public_key: {}", e)));
                        }
                    };

                    *signature_data = Some(img_editor_lib::SignatureData {
                        signature,
                        public_key,
                    });
                    
                    Ok(())
                },
                Err(e) => {
                    error!("JSON parse error for signature_data: {}", e);
                    Err(ProofResponse::error(format!("Invalid signature_data JSON format: {}", e)))
                }
            }
        },
        Err(e) => Err(ProofResponse::error(format!("Invalid UTF-8 in signature_data field: {}", e)))
    }
}

fn validate_fields(
    found_fields: &[String],
    image_data: &[u8],
    transformations: &Option<Vec<img_editor_lib::Transformation>>
) -> Result<(), Response> {
    if found_fields.is_empty() {
        return Err(ProofResponse::error(
            "No fields found in request. Required fields: 'image' and 'transformations'"
        ));
    }

    if !found_fields.contains(&"image".to_string()) {
        return Err(ProofResponse::error("Missing 'image' field in multipart form data"));
    }

    if !found_fields.contains(&"transformations".to_string()) {
        return Err(ProofResponse::error("Missing 'transformations' field in multipart form data"));
    }

    // Check if transformations is Some
    if transformations.is_none() {
        return Err(ProofResponse::error("Missing transformations field"));
    }

    // Check if image data is empty
    if image_data.is_empty() {
        return Err(ProofResponse::error("Image field was found but contains no data"));
    }

    // Check if transformations is empty
    if let Some(trans) = transformations {
        if trans.is_empty() {
            return Err(ProofResponse::error("No transformations specified in request"));
        }
    }

    Ok(())
}

fn log_transformation_details(
    image_data: &[u8],
    transformations: &[img_editor_lib::Transformation]
) {
    info!("Image data size: {} bytes", image_data.len());
    info!("Number of transformations: {}", transformations.len());
    
    for (i, t) in transformations.iter().enumerate() {
        info!("Transformation {}: {:?}", i, t);
    }
}

async fn generate_proof_and_response(
    state: AppState,
    image_data: Vec<u8>,
    transformations: Vec<img_editor_lib::Transformation>,
    signature_data: Option<img_editor_lib::SignatureData>
) -> Response {
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

    // Generate the proof using preloaded proving key
    info!("Generating Groth16 proof...");
    
    // Create a new prover instance for this request
    let prover = sp1_sdk::ProverClient::from_env();
    let pk_ref = state.pk.as_ref();
    
    // Generate the proof
    let proof_builder = prover.prove(pk_ref, &stdin);
    let groth16_builder = proof_builder.groth16();
    
    match groth16_builder.run() {
        Ok(proof) => {
            info!("Groth16 proof generated successfully");

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
            let verification_key = state.vk.clone();

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