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
    println!("cycle-tracker-start: total");
    
    // Read input data and transformations
    println!("cycle-tracker-start: read_input");
    let input: ImageInput = io::read();
    println!("cycle-tracker-end: read_input");
    
    // Create initial layer
    println!("cycle-tracker-start: create_layer");
    let mut layer = Layer::new(&input.image_data)
        .expect("Failed to create layer");
    println!("cycle-tracker-end: create_layer");
    
    // Apply all transformations
    println!("cycle-tracker-start: transformations");
    for (i, transformation) in input.transformations.clone().iter().enumerate() {
        println!("cycle-tracker-report-start: transform_{}", i);
        layer.apply_transformation(transformation.clone())
            .expect("Failed to apply transformation");
        println!("cycle-tracker-report-end: transform_{}", i);
    }
    println!("cycle-tracker-end: transformations");
    
    // Get final image
    println!("cycle-tracker-start: encode");
    let final_image = layer.to_bytes(image::ImageFormat::Png, None)
        .expect("Failed to encode image");
    println!("cycle-tracker-end: encode");
    
    // Create and commit output
    let output = ImageOutput {
        final_image,
        transformation_count: input.transformations.len()
    };
    
    io::commit(&output);
    println!("cycle-tracker-end: total");
}
