//! An end-to-end example of using the SP1 SDK to generate a proof of a program that can be executed
//! or have a core proof generated.
//!
//! You can run this script using the following command:
//! ```shell
//! RUST_LOG=info cargo run --release -- --execute
//! ```
//! or
//! ```shell
//! RUST_LOG=info cargo run --release -- --prove
//! ```

use clap::Parser;
use sp1_sdk::{include_elf, ProverClient, SP1Stdin, HashableKey};
use img_editor_lib::{ImageInput, ImageOutput, Transformation};
use std::fs;
use bincode;
use std::env;
use serde_json;
use serde::{Serialize, Deserialize};
use hex;

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
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageProofOutput {
    transformed_image: Vec<u8>,
    proof: Option<String>,
    verification_key: Option<String>,
    success: bool,
    message: String,
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

    // Setup the prover client.
    let client = ProverClient::from_env();

    // Create input with rotate90 transformation
    let input = ImageInput {
        image_data,
        transformations,
        id: "".to_string(),
    };

    // Setup stdin with serialized input
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    let output = match args.execute {
        true => {
            let (output, report) = client.execute(IMG_EDITOR_ELF, &stdin).run().unwrap();
            let ImageOutput { final_image, .. } = bincode::deserialize(output.as_slice()).unwrap();
            
            // Write rotated image
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
                transformed_image: final_image,
                proof: None,
                verification_key: None,
                success: true,
                message: "Image transformed successfully".to_string(),
            }
        }
        false => {
            let (pk, vk) = client.setup(IMG_EDITOR_ELF);
            match client.prove(&pk, &stdin).groth16().run() {
                Ok(proof) => {
                    client.verify(&proof, &vk).expect("failed to verify proof");
                    let (output, _) = client.execute(IMG_EDITOR_ELF, &stdin).run().unwrap();
                    let ImageOutput { final_image, .. } = bincode::deserialize(output.as_slice()).unwrap();
                    
                    // Save proof and verification key to files
                    let proof_hex = hex::encode(proof.bytes());
                    let vk_hex = vk.bytes32().to_string();
                    
                    fs::write("proof.hex", &proof_hex)
                        .expect("Failed to write proof file");
                    fs::write("verification_key.hex", &vk_hex)
                        .expect("Failed to write verification key file");
                    
                    println!("Proof saved to proof.hex");
                    println!("Verification key saved to verification_key.hex");
                    
                    ImageProofOutput {
                        transformed_image: final_image,
                        proof: Some(proof_hex),
                        verification_key: Some(vk_hex),
                        success: true,
                        message: "Proof generated and verified successfully".to_string(),
                    }
                }
                Err(e) => ImageProofOutput {
                    transformed_image: vec![],
                    proof: None,
                    verification_key: None,
                    success: false,
                    message: format!("Failed to generate proof: {}", e),
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
