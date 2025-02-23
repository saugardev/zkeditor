use clap::Parser;
use sp1_sdk::{include_elf, ProverClient, SP1Stdin, HashableKey};
use img_editor_lib::{ImageInput, ImageProofPublicValues, Layer, SignatureData, Transformation};
use std::fs;
use std::env;
use serde_json;
use serde::{Serialize, Deserialize};
use hex;
use alloy_sol_types::SolType;
use image;

/// The ELF file for the Succinct RISC-V zkVM.
pub const IMG_EDITOR_ELF: &[u8] = include_elf!("img-editor-program");

/// The arguments for the command.
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    #[clap(long)]
    execute: bool,

    #[clap(long)]
    prove: bool,

    #[clap(long)]
    image: String,

    #[clap(long)]
    transformations: String,

    #[clap(long)]
    signature: Option<String>,

    #[clap(long)]
    public_key: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProofData {
    proof: String,
    verification_key: String,
    public_values: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageProofOutput {
    final_image: Vec<u8>,
    original_image_hash: String,
    transformed_image_hash: String,
    signer_public_key: String,
    has_signature: bool,
    success: bool,
    message: String,
    proof_data: Option<ProofData>,
}

fn main() {
    // Enable profiling
    env::set_var("TRACE_FILE", "image_editor_profile.json");
    env::set_var("TRACE_SAMPLE_RATE", "100");

    // Setup the logger.
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    // Parse the command line arguments.
    let args = Args::parse();

    if args.execute == args.prove {
        eprintln!("Error: You must specify either --execute or --prove");
        std::process::exit(1);
    }

    let image_data = fs::read(&args.image).expect("Failed to read image file");
    let transformations: Vec<Transformation> = serde_json::from_str(&args.transformations)
        .expect("Failed to parse transformations");

    // Convert hex strings to bytes if provided and create SignatureData if both are present
    let signature_data = match (args.signature.as_ref(), args.public_key.as_ref()) {
        (Some(sig), Some(pk)) => {
            let signature = hex::decode(sig).expect("Invalid signature hex");
            let public_key = hex::decode(pk).expect("Invalid public key hex");
            Some(SignatureData {
                signature,
                public_key,
            })
        },
        _ => None,
    };

    // Setup the prover client.
    let client = ProverClient::from_env();

    // Create input with transformations - clone the values before moving
    let input_image_data = image_data.clone();
    let input_transformations = transformations.clone();

    let input = ImageInput {
        image_data: input_image_data,
        transformations: input_transformations,
        signature_data,
    };

    // Setup stdin with serialized input
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    let output = match args.execute {
        true => {
            let (output, report) = client.execute(IMG_EDITOR_ELF, &stdin).run().unwrap();
            
            // Get the public values
            let public_values = output.as_slice();
            let decoded_values = ImageProofPublicValues::abi_decode(public_values, false)
                .expect("Failed to decode public values");
            
            // Regenerate the transformed image
            let mut layer = Layer::new(&image_data)
                .expect("Failed to create layer");
            
            for transformation in transformations.iter() {
                layer.apply_transformation(transformation.clone())
                    .expect("Failed to apply transformation");
            }
            
            let final_image = layer.to_bytes(image::ImageFormat::Png, None)
                .expect("Failed to encode image");
            
            // Write transformed image
            let output_path = format!("{}_transformed.png", args.image);
            fs::write(&output_path, &final_image).expect("Failed to write output image");
            println!("Image transformed and saved as {}", output_path);

            // Print cycle counts
            println!("\nCycle counts:");
            for i in 0..report.cycle_tracker.len() {
                if let Some(cycles) = report.cycle_tracker.get(&format!("transform_{}", i)) {
                    println!("Transform {}: {} cycles", i, cycles);
                }
            }

            ImageProofOutput {
                final_image,
                original_image_hash: format!("0x{}", hex::encode(decoded_values.original_image_hash.0)),
                transformed_image_hash: format!("0x{}", hex::encode(decoded_values.transformed_image_hash.0)),
                signer_public_key: format!("0x{}", hex::encode(decoded_values.signer_public_key.0)),
                has_signature: decoded_values.has_signature,
                success: true,
                message: "Image transformed successfully".to_string(),
                proof_data: None,
            }
        }
        false => {
            let (pk, vk) = client.setup(IMG_EDITOR_ELF);
            match client.prove(&pk, &stdin).groth16().run() {
                Ok(proof) => {
                    client.verify(&proof, &vk).expect("Failed to verify proof");
                    
                    // Get and decode the public values from the proof
                    let public_values = proof.public_values.as_slice();
                    println!("Debug - Public values length: {}", public_values.len());
                    let decoded_values = ImageProofPublicValues::abi_decode(public_values, false)
                        .expect("Failed to decode public values");
                    
                    // Regenerate the transformed image
                    let mut layer = Layer::new(&image_data)
                        .expect("Failed to create layer");
                    
                    for transformation in transformations.iter() {
                        layer.apply_transformation(transformation.clone())
                            .expect("Failed to apply transformation");
                    }
                    
                    let final_image = layer.to_bytes(image::ImageFormat::Png, None)
                        .expect("Failed to encode image");
                    
                    // Write transformed image
                    let output_path = format!("{}_transformed.png", args.image);
                    fs::write(&output_path, &final_image).expect("Failed to write output image");
                    println!("Image transformed and saved as {}", output_path);
                    
                    // Get proof components
                    let solidity_proof = proof.bytes();
                    let verification_key = vk.bytes32().to_string();
                    
                    // Save proof components
                    fs::write("proof.bin", &solidity_proof)
                        .expect("Failed to write proof file");
                    fs::write("public_values.bin", public_values)
                        .expect("Failed to write public values file");
                    fs::write("verification_key.bin", verification_key.as_bytes())
                        .expect("Failed to write verification key file");
                    
                    println!("Proof components saved:");
                    println!("- Proof: 0x{}", hex::encode(&solidity_proof));
                    println!("- Public values: 0x{}", hex::encode(public_values));
                    println!("- Verification key: {}", verification_key);
                    
                    ImageProofOutput {
                        final_image,
                        original_image_hash: format!("0x{}", hex::encode(decoded_values.original_image_hash.0)),
                        transformed_image_hash: format!("0x{}", hex::encode(decoded_values.transformed_image_hash.0)),
                        signer_public_key: format!("0x{}", hex::encode(decoded_values.signer_public_key.0)),
                        has_signature: decoded_values.has_signature,
                        success: true,
                        message: "Proof generated and verified successfully".to_string(),
                        proof_data: Some(ProofData {
                            proof: format!("0x{}", hex::encode(solidity_proof)),
                            verification_key,
                            public_values: format!("0x{}", hex::encode(public_values)),
                        }),
                    }
                }
                Err(e) => ImageProofOutput {
                    final_image: vec![],
                    original_image_hash: "0x".to_string(),
                    transformed_image_hash: "0x".to_string(),
                    signer_public_key: "0x".to_string(),
                    has_signature: false,
                    success: false,
                    message: format!("Failed to generate proof: {}", e),
                    proof_data: None,
                }
            }
        }
    };

    // Save the full output to a JSON file
    fs::write(
        "output.json",
        serde_json::to_string_pretty(&output).unwrap(),
    ).expect("Failed to write output file");

    println!("Full output saved to output.json");
    
    // Also print to stdout for API consumption
    println!("{}", serde_json::to_string(&output).unwrap());
}
