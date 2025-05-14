use clap::Parser;
use img_editor_lib::{ImageProject, Transformation};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde_json;
use image::ImageFormat;
use std::fs;
use std::path::Path;

#[derive(Parser, Debug)]
#[clap(author, version, about = "Command-line tool for image transformations using base64")]
struct Args {
    /// Path to input image file
    #[clap(long)]
    image: String,

    /// Transformations to apply, as a JSON string
    #[clap(long, short = 't')]
    transformations: String,

    /// Output format (png, jpeg, webp)
    #[clap(long, short = 'f', default_value = "png")]
    format: String,
}

fn main() -> Result<(), String> {
    // Parse command-line arguments
    let args = Args::parse();

    // Read image file from path
    let image_path = Path::new(&args.image);
    let image_data = fs::read(image_path)
        .map_err(|e| format!("Failed to read image file '{}': {}", args.image, e))?;

    // Parse transformations
    let transformations: Vec<Transformation> = serde_json::from_str(&args.transformations)
        .map_err(|e| format!("Failed to parse transformations: {}", e))?;

    // Create project and add layer
    let mut project = ImageProject::new();
    project.add_layer(&image_data)?;

    // Apply each transformation
    for transformation in transformations {
        project.transform_layer(0, &transformation)?;
    }

    // Determine output format
    let format = match args.format.to_lowercase().as_str() {
        "jpeg" | "jpg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        _ => ImageFormat::Png,
    };

    // Get the transformed image
    let output_data = project.get_layer(0, Some(args.format.clone()))?;

    // Encode output as base64
    let encoded_output = BASE64.encode(&output_data);
    
    // Output as data URL
    let output = format!("data:image/{};base64,{}", args.format.to_lowercase(), encoded_output);
    
    // Print the result to stdout
    println!("{}", output);
    
    Ok(())
} 