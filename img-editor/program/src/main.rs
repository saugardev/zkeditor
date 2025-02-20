//! A simple program that takes a number `n` as input, and writes the `n-1`th and `n`th fibonacci
//! number as an output.

// These two lines are necessary for the program to properly compile.
//
// Under the hood, we wrap your main function with some extra code so that it behaves properly
// inside the zkVM.
#![no_main]
sp1_zkvm::entrypoint!(main);

use img_editor_lib::{ImageInput, ImageOutput, Layer};
use sp1_zkvm::{io, syscalls};
use image;
use k256::{
    ecdsa::{signature::Verifier, Signature, VerifyingKey},
    EncodedPoint,
};

fn hash_image(image_data: &[u8]) -> Vec<u8> {
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
    
    // Convert state back to bytes
    let mut result = Vec::with_capacity(32);
    for word in state.iter() {
        result.extend_from_slice(&word.to_be_bytes());
    }
    result
}

fn verify_signature(image_data: &[u8], signature: &[u8], public_key: &[u8]) -> bool {
    // Use SP1's secp256k1 precompiles for point operations
    let point = match EncodedPoint::from_bytes(public_key) {
        Ok(p) => p,
        Err(_) => return false,
    };
    
    let verifying_key = match VerifyingKey::from_encoded_point(&point) {
        Ok(vk) => vk,
        Err(_) => return false,
    };
    
    let signature = match Signature::from_slice(signature) {
        Ok(s) => s,
        Err(_) => return false,
    };
    
    // Hash the image data using optimized hash function
    let message = hash_image(image_data);
    
    // Verify using secp256k1 precompiles
    verifying_key.verify(&message, &signature).is_ok()
}

pub fn main() {
    // Read input data and transformations
    let input: ImageInput = io::read();
    
    // Calculate original image hash using precompile
    let original_image_hash = hash_image(&input.image_data);
    
    // Extract public key if signature is present
    let signer_public_key = input.signature_data.as_ref().map(|sig| sig.public_key.clone());
    
    // Verify signature if present using precompiles
    if let Some(sig_data) = &input.signature_data {
        verify_signature(&input.image_data, &sig_data.signature, &sig_data.public_key)
    } else {
        false
    };
    
    // Create initial layer
    let mut layer = Layer::new(&input.image_data)
        .expect("Failed to create layer");
    
    // Apply all transformations
    for transformation in input.transformations.clone().iter() {
        layer.apply_transformation(transformation.clone())
            .expect("Failed to apply transformation");
    }
    
    // Get final image
    let final_image = layer.to_bytes(image::ImageFormat::Png, None)
        .expect("Failed to encode image");
    
    // Create and commit output
    let output = ImageOutput {
        final_image,
        original_image_hash,
        signer_public_key,
    };
    
    io::commit(&output);
}
