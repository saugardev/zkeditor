mod layers;

use image::ImageFormat;
pub use layers::Layer;
use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Debug)]
pub struct ImageProject {
    layers: Vec<Layer>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CropParameters {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BlurParameters {
    pub sigma: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BrightenParameters {
    pub value: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ContrastParameters {
    pub contrast: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TextOverlayParameters {
    pub text: String,
    pub x: u32,
    pub y: u32,
    pub size: u32,
    pub color: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Transformation {
    Crop(CropParameters),
    Grayscale,
    Rotate90,
    Rotate180,
    Rotate270,
    FlipVertical,
    FlipHorizontal,
    Brighten(BrightenParameters),
    Contrast(ContrastParameters),
    Blur(BlurParameters),    
    TextOverlay(TextOverlayParameters),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageInput {
    pub image_data: Vec<u8>,
    pub transformations: Vec<Transformation>
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageOutput {
    pub final_image: Vec<u8>,
    pub transformation_count: usize
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use super::*;
    use serde_wasm_bindgen;

    #[wasm_bindgen]
    impl ImageProject {
        #[wasm_bindgen(constructor)]
        pub fn new() -> ImageProject {
            ImageProject { layers: Vec::new() }
        }

        #[wasm_bindgen]
        pub fn add_layer(&mut self, image_data: &[u8]) -> Result<(), JsValue> {
            let layer = Layer::new(image_data)
                .map_err(|e| JsValue::from_str(&e))?;
            self.layers.push(layer);
            Ok(())
        }

        #[wasm_bindgen]
        pub fn transform_layer(&mut self, index: usize, transformation: &JsValue) -> Result<(), JsValue> {
            let layer = self.layers.get_mut(index)
                .ok_or_else(|| JsValue::from_str("Layer index out of bounds"))?;
            
            let transformation: Transformation = serde_wasm_bindgen::from_value(transformation.clone())
                .map_err(|e| JsValue::from_str(&format!("Invalid transformation: {}", e)))?;
            
            layer.apply_transformation(transformation)
                .map_err(|e| JsValue::from_str(&e))
        }

        #[wasm_bindgen]
        pub fn get_layer(&self, index: usize, format: Option<String>) -> Result<Vec<u8>, JsValue> {
            let layer = self.layers.get(index)
                .ok_or_else(|| JsValue::from_str("Layer index out of bounds"))?;
            
            let format = match format.as_deref() {
                Some("jpeg") => ImageFormat::Jpeg,
                Some("webp") => ImageFormat::WebP,
                _ => ImageFormat::Png
            };
            
            layer.to_bytes(format, None)
                .map_err(|e| JsValue::from_str(&e))
        }

        #[wasm_bindgen]
        pub fn add_empty_layer(&mut self, width: u32, height: u32) -> Result<(), JsValue> {
            let empty_layer = Layer::new_empty(width, height)
                .map_err(|e| JsValue::from_str(&e))?;
            self.layers.push(empty_layer);
            Ok(())
        }

        pub fn process_with_proof(&mut self, input: &JsValue) -> Result<JsValue, JsValue> {
            let input: ImageInput = serde_wasm_bindgen::from_value(input.clone())
                .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;
            
            // Add initial image
            self.add_layer(&input.image_data)?;
            
            // Apply all transformations
            for transformation in &input.transformations {
                self.transform_layer(0, &serde_wasm_bindgen::to_value(&transformation)
                    .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?)?;
            }
            
            // Get final image
            let final_image = self.get_layer(0, None)?;
            
            let output = ImageOutput {
                final_image,
                transformation_count: input.transformations.len()
            };
            
            serde_wasm_bindgen::to_value(&output)
                .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
impl ImageProject {
    pub fn new() -> ImageProject {
        ImageProject { layers: Vec::new() }
    }

    pub fn add_layer(&mut self, image_data: &[u8]) -> Result<(), String> {
        let layer = Layer::new(image_data)?;
        self.layers.push(layer);
        Ok(())
    }

    pub fn transform_layer(&mut self, index: usize, transformation: &Transformation) -> Result<(), String> {
        let layer = self.layers.get_mut(index)
            .ok_or_else(|| "Layer index out of bounds".to_string())?;
        layer.apply_transformation(transformation.clone())
    }

    pub fn get_layer(&self, index: usize, format: Option<String>) -> Result<Vec<u8>, String> {
        let layer = self.layers.get(index)
            .ok_or_else(|| "Layer index out of bounds".to_string())?;
        
        let format = match format.as_deref() {
            Some("jpeg") => ImageFormat::Jpeg,
            Some("webp") => ImageFormat::WebP,
            _ => ImageFormat::Png
        };
        
        layer.to_bytes(format, None)
            .map_err(|e| e.to_string())
    }

    pub fn add_empty_layer(&mut self, width: u32, height: u32) -> Result<(), String> {
        let empty_layer = Layer::new_empty(width, height)?;
        self.layers.push(empty_layer);
        Ok(())
    }

    pub fn process_with_proof(&mut self, input: &ImageInput) -> Result<ImageOutput, String> {
        // Add initial image
        self.add_layer(&input.image_data)?;
        
        // Apply all transformations
        for transformation in &input.transformations {
            self.transform_layer(0, transformation)?;
        }
        
        // Get final image
        let final_image = self.get_layer(0, None)?;
        
        let output = ImageOutput {
            final_image,
            transformation_count: input.transformations.len()
        };
        
        Ok(output)
    }
}
