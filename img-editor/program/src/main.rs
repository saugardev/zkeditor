#![no_main]
sp1_zkvm::entrypoint!(main);

use img_editor_lib::{ImageInput, Layer, ImageProofPublicValues};
use sp1_zkvm::{io, syscalls};
use image;
use alloy_sol_types::{SolType, private::FixedBytes};

fn hash_image(image_data: &[u8]) -> [u8; 32] {
    let mut state = [0x6a09e667u32, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 
                    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

    // Process data in 64-byte blocks
    let mut i = 0;
    while i + 64 <= image_data.len() {
        let mut w = [0u32; 64];
        
        // Convert bytes to words
        for j in 0..16 {
            let idx = i + j * 4;
            w[j] = ((image_data[idx] as u32) << 24)
                 | ((image_data[idx + 1] as u32) << 16)
                 | ((image_data[idx + 2] as u32) << 8)
                 | (image_data[idx + 3] as u32);
        }

        // Extend and compress
        syscalls::syscall_sha256_extend(&mut w);
        syscalls::syscall_sha256_compress(&mut w, &mut state);
        i += 64;
    }

    // Handle remaining bytes and padding
    let mut final_block = [0u8; 64];
    let remaining = image_data.len() - i;
    final_block[..remaining].copy_from_slice(&image_data[i..]);
    final_block[remaining] = 0x80;

    let mut w = [0u32; 64];
    if remaining < 56 {
        // Length fits in this block
        for j in 0..14 {
            let idx = j * 4;
            w[j] = ((final_block[idx] as u32) << 24)
                 | ((final_block[idx + 1] as u32) << 16)
                 | ((final_block[idx + 2] as u32) << 8)
                 | (final_block[idx + 3] as u32);
        }
        let len_bits = (image_data.len() as u64) * 8;
        w[14] = (len_bits >> 32) as u32;
        w[15] = len_bits as u32;

        syscalls::syscall_sha256_extend(&mut w);
        syscalls::syscall_sha256_compress(&mut w, &mut state);
    } else {
        // Need an additional block for length
        for j in 0..16 {
            let idx = j * 4;
            w[j] = ((final_block[idx] as u32) << 24)
                 | ((final_block[idx + 1] as u32) << 16)
                 | ((final_block[idx + 2] as u32) << 8)
                 | (final_block[idx + 3] as u32);
        }

        syscalls::syscall_sha256_extend(&mut w);
        syscalls::syscall_sha256_compress(&mut w, &mut state);

        w = [0u32; 64];
        let len_bits = (image_data.len() as u64) * 8;
        w[14] = (len_bits >> 32) as u32;
        w[15] = len_bits as u32;

        syscalls::syscall_sha256_extend(&mut w);
        syscalls::syscall_sha256_compress(&mut w, &mut state);
    }

    // Convert state to bytes
    let mut result = [0u8; 32];
    for i in 0..8 {
        result[i*4] = (state[i] >> 24) as u8;
        result[i*4 + 1] = (state[i] >> 16) as u8;
        result[i*4 + 2] = (state[i] >> 8) as u8;
        result[i*4 + 3] = state[i] as u8;
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
