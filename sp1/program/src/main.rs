//! A simple program that takes a number `n` as input, and writes the `n-1`th and `n`th fibonacci
//! number as an output.

// These two lines are necessary for the program to properly compile.
//
// Under the hood, we wrap your main function with some extra code so that it behaves properly
// inside the zkVM.
#![no_main]
sp1_zkvm::entrypoint!(main);

use img_editor_lib::{ImageInput, ImageOutput, Layer};
use sp1_zkvm::io;
use image;
pub fn main() {
    // Read input data and transformations
    let input: ImageInput = io::read();
    
    // Create initial layer
    let mut layer = Layer::new(&input.image_data)
        .expect("Failed to create layer");
    
    // Apply all transformations
    for transformation in input.transformations.clone() {
        layer.apply_transformation(transformation)
            .expect("Failed to apply transformation");
    }
    
    // Get final image
    let final_image = layer.to_bytes(image::ImageFormat::Png, None)
        .expect("Failed to encode image");
    
    // Create and commit output
    let output = ImageOutput {
        final_image,
        transformation_count: input.transformations.len()
    };
    
    io::commit(&output);
}
