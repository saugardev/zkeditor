//! A simple program that takes a number `n` as input, and writes the `n-1`th and `n`th fibonacci
//! number as an output.

// These two lines are necessary for the program to properly compile.
//
// Under the hood, we wrap your main function with some extra code so that it behaves properly
// inside the zkVM.
#![no_main]
sp1_zkvm::entrypoint!(main);

use img_editor_lib::{ImageInput, Layer, ImageProofPublicValues};
use sp1_zkvm::{io, syscalls};
use image;
use alloy_sol_types::{SolType, private::FixedBytes};

fn hash_image(image_data: &[u8]) -> [u8; 32] {
    // Use SP1's SHA-256 precompile
    let mut state = [0u32; 8];
    let mut block = [0u32; 64];
    
    // Process each 64-byte block
    for chunk in image_data.chunks(64) {
        // Convert bytes to words
        for (i, word) in chunk.chunks(4).enumerate() {
            let mut value = 0u32;
            for (j, &byte) in word.iter().enumerate() {
                value |= (byte as u32) << (24 - j * 8);
            }
            block[i] = value;
        }
        
        // Use precompile for SHA-256 operations
        unsafe {
            syscalls::syscall_sha256_extend(&mut block);
            syscalls::syscall_sha256_compress(&mut block, &mut state);
        }
    }

    // Convert state back to bytes and ensure fixed length
    let mut result = [0u8; 32];
    for (i, word) in state.iter().enumerate() {
        result[i*4..(i+1)*4].copy_from_slice(&word.to_be_bytes());
    }
    result
}

pub fn main() {
    // Read the input (private)
    let input: ImageInput = io::read();
    
    let original_image_hash = hash_image(&input.image_data);
    
    let mut layer = Layer::new(&input.image_data)
        .expect("Failed to create layer");
    
    for transformation in input.transformations.clone().iter() {
        layer.apply_transformation(transformation.clone())
            .expect("Failed to apply transformation");
    }
    
    let final_image = layer.to_bytes(image::ImageFormat::Png, None)
        .expect("Failed to encode image");

    let transformed_image_hash = hash_image(&final_image);
    
    // Initialize these variables before the if block
    let mut public_key_bytes = [0u8; 32];
    let mut has_signature = false;

    if let Some(sig_data) = &input.signature_data {
        println!("Signature length: {}", sig_data.signature.len());
        println!("Ethereum address length: {}", sig_data.public_key.len());
        public_key_bytes[12..].copy_from_slice(&sig_data.public_key);
        has_signature = true;
    } else {
        println!("No signature data provided");
    }

    // Create and commit the public values
    let public_values = ImageProofPublicValues {
        original_image_hash: FixedBytes(original_image_hash),
        transformed_image_hash: FixedBytes(transformed_image_hash),
        signer_public_key: FixedBytes(public_key_bytes),
        has_signature,
    };
    
    let encoded_public_values = ImageProofPublicValues::abi_encode(&public_values);
    io::commit_slice(&encoded_public_values);
}
