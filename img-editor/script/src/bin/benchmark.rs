use sp1_sdk::{include_elf, ProverClient, SP1Stdin};
use img_editor_lib::{BlurParameters, ImageInput, ImageOutput, Transformation, TextOverlayParameters, BrightenParameters, ContrastParameters, CropParameters};
use std::fs;
use bincode;
use std::env;

pub const IMG_EDITOR_ELF: &[u8] = include_elf!("img-editor-program");

fn main() {
    // Enable profiling
    env::set_var("TRACE_FILE", "image_editor_benchmark.json");
    env::set_var("TRACE_SAMPLE_RATE", "100");

    // Setup the logger
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    // Read the image file
    let image_data = fs::read("src/diamond.webp").expect("Failed to read image file");
    
    // Setup the prover client
    let client = ProverClient::from_env();

    // Define all transformations to test
    let transformations = vec![
        Transformation::Grayscale,
        Transformation::Rotate90,
        Transformation::Rotate180,
        Transformation::Rotate270,
        Transformation::FlipVertical,
        Transformation::FlipHorizontal,
        Transformation::Brighten(BrightenParameters { value: 50 }),
        Transformation::Contrast(ContrastParameters { contrast: 1.5 }),
        Transformation::Blur(BlurParameters { sigma: 5.0 }),
        Transformation::Crop(CropParameters {
            x: 100,
            y: 100,
            width: 300,
            height: 300,
        }),
        Transformation::TextOverlay(TextOverlayParameters {
            text: "Benchmark".to_string(),
            x: 50,
            y: 50,
            size: 48,
            color: "FFFFFF".to_string(),
        }),
    ];

    println!("Starting benchmarks...\n");

    let mut all_reports = Vec::new();

    // Test each transformation individually
    for (i, transformation) in transformations.iter().enumerate() {
        let input = ImageInput {
            image_data: image_data.clone(),
            transformations: vec![transformation.clone()],
        };

        let mut stdin = SP1Stdin::new();
        stdin.write(&input);

        let (output, report) = client.execute(IMG_EDITOR_ELF, &stdin).run().unwrap();
        all_reports.push(report.clone());
        
        // Save the transformed image
        let ImageOutput { final_image, .. } = bincode::deserialize(output.as_slice()).unwrap();
        fs::write(
            format!("src/diamond_transform_{}.png", i),
            final_image
        ).expect("Failed to write output image");

        // Print benchmark results
        println!("Transformation {}: {:?}", i, transformation);
        if let Some(cycles) = report.cycle_tracker.get("transform_0") {
            println!("Cycles: {}\n", cycles);
        }
    }

    let results = format!(r#"# Image Transformation Benchmark Results

## Input Image
- File: src/diamond.webp
- Format: WebP

## Transformations Results
{}"#, 
        transformations.iter().enumerate().map(|(i, t)| {
            format!("### {}. {:?}\n- Cycles: {}\n- Output: src/diamond_transform_{}.png\n",
                i + 1,
                t,
                all_reports[i].cycle_tracker.get("transform_0").unwrap_or(&0),
                i
            )
        }).collect::<String>()
    );

    fs::write("benchmark_results.md", results).expect("Failed to write results");
}