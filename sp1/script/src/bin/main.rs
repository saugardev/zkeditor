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
use sp1_sdk::{include_elf, ProverClient, SP1Stdin};
use img_editor_lib::{BlurParameters, ImageInput, ImageOutput, Transformation};
use std::fs;
use bincode;
use std::env;

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

    #[clap(long, default_value = "20")]
    n: u32,
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

    // Read the image file
    let image_data = fs::read("src/diamond.webp").expect("Failed to read image file");

    if args.execute == args.prove {
        eprintln!("Error: You must specify either --execute or --prove");
        std::process::exit(1);
    }

    // Setup the prover client.
    let client = ProverClient::from_env();

    // Create input with rotate90 transformation
    let input = ImageInput {
        image_data,
        transformations: vec![Transformation::Rotate90, Transformation::Blur(BlurParameters { sigma: 5.0 })],
    };

    // Setup stdin with serialized input
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    println!("n: {}", args.n);

    if args.execute {
        // Execute the program
        let (output, report) = client.execute(IMG_EDITOR_ELF, &stdin).run().unwrap();
        println!("Program executed successfully.");
        // Deserialize output
        let ImageOutput { final_image, .. } = bincode::deserialize(output.as_slice()).unwrap();

        // Write rotated image
        fs::write("src/diamond_rotated.png", final_image).expect("Failed to write output image");
        println!("Image rotated and saved as diamond_rotated.png");

        // Print cycle counts
        println!("\nCycle counts:");
        
        // Print individual transformation cycles
        for i in 0..report.cycle_tracker.len() {
            if let Some(cycles) = report.cycle_tracker.get(&format!("transform_{}", i)) {
                println!("Transform {}: {} cycles", i, cycles);
            }
        }
    } else {
        // Setup the program for proving.
        let (pk, vk) = client.setup(IMG_EDITOR_ELF);

        // Generate the proof
        let proof = client
            .prove(&pk, &stdin)
            .run()
            .expect("failed to generate proof");

        println!("Successfully generated proof!");

        // Verify the proof.
        client.verify(&proof, &vk).expect("failed to verify proof");
        println!("Successfully verified proof!");
    }
}
