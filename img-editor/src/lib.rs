mod layers;

use image::ImageFormat;
use wasm_bindgen::prelude::*;
use layers::Layer;

#[wasm_bindgen]
pub struct ImageProject {
    layers: Vec<Layer>,
}

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct CropParameters {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BlurParameters {
    pub sigma: f32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BrightenParameters {
    pub value: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ContrastParameters {
    pub contrast: f32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TextOverlayParameters {
    pub text: String,
    pub x: u32,
    pub y: u32,
    pub size: u32,
    pub color: String,
}

#[derive(Serialize, Deserialize, Debug)]
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


#[wasm_bindgen]
impl ImageProject {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ImageProject {
        ImageProject {
            layers: Vec::new(),
        }
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
}
