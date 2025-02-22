use clap::Parser;
use sp1_sdk::{include_elf, ProverClient, SP1Stdin, HashableKey};
use img_editor_lib::{ImageInput, ImageOutput, Transformation, SignatureData};
use std::fs;
use bincode;
use std::env;
use serde_json;
use serde::{Serialize, Deserialize};
use hex;
use sha2::{Sha256, Digest};

/// The ELF (executable and linkable format) file for the Succinct RISC-V zkVM.
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
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageProofOutput {
    final_image: Vec<u8>,
    original_image_hash: Vec<u8>,
    signer_public_key: Option<Vec<u8>>,
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
    let signature_data = match (args.signature, args.public_key) {
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

    // Calculate original image hash
    let mut hasher = Sha256::new();
    hasher.update(&image_data);
    let original_image_hash = hasher.finalize().to_vec();

    // Setup the prover client.
    let client = ProverClient::from_env();

    // Create input with transformations
    let input = ImageInput {
        image_data,
        transformations,
        signature_data,
    };

    // Setup stdin with serialized input
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    let output = match args.execute {
        true => {
            let (output, report) = client.execute(IMG_EDITOR_ELF, &stdin).run().unwrap();
            let ImageOutput { final_image, original_image_hash, signer_public_key } = bincode::deserialize(output.as_slice()).unwrap();
            
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
                proof_data: None,
                success: true,
                message: "Image transformed successfully".to_string(),
                original_image_hash,
                signer_public_key,
            }
        }
        false => {
            let (pk, vk) = client.setup(IMG_EDITOR_ELF);
            match client.prove(&pk, &stdin).groth16().run() {
                Ok(proof) => {
                    client.verify(&proof, &vk).expect("failed to verify proof");
                    let (output, _) = client.execute(IMG_EDITOR_ELF, &stdin).run().unwrap();
                    let ImageOutput { final_image, original_image_hash, signer_public_key } = bincode::deserialize(output.as_slice()).unwrap();
                    
                    // Get public values and proof bytes for Solidity verification
                    let public_values = proof.public_values.as_slice();
                    let solidity_proof = proof.bytes();
                    
                    // Save proof components
                    fs::write("proof.bin", &solidity_proof)
                        .expect("Failed to write proof file");
                    fs::write("public_values.bin", public_values)
                        .expect("Failed to write public values file");
                    fs::write("verification_key.bin", vk.bytes32().as_bytes())
                        .expect("Failed to write verification key file");
                    
                    println!("Proof components saved:");
                    println!("- Proof: 0x{}", hex::encode(&solidity_proof));
                    println!("- Public values: 0x{}", hex::encode(public_values));
                    println!("- Verification key: {}", vk.bytes32());
                    
                    ImageProofOutput {
                        transformed_image: final_image,
                        proof: Some(hex::encode(solidity_proof)),
                        verification_key: Some(vk.bytes32().to_string()),
                        success: true,
                        message: "Proof generated and verified successfully".to_string(),
                        original_image_hash,
                        signer_public_key,
                    }
                }
                Err(e) => ImageProofOutput {
                    final_image: vec![],
                    proof_data: None,
                    success: false,
                    message: format!("Failed to generate proof: {}", e),
                    original_image_hash,
                    signer_public_key: None,
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
