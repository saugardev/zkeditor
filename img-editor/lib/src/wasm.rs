use wasm_bindgen::prelude::*;
use serde_wasm_bindgen;
use crate::{ImageProject, ImageInput, Transformation};

#[wasm_bindgen]
pub struct WasmImageProject(ImageProject);

#[wasm_bindgen]
impl WasmImageProject {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(ImageProject::new())
    }

    #[wasm_bindgen]
    pub fn add_layer(&mut self, image_data: &[u8]) -> Result<(), JsValue> {
        self.0.add_layer(image_data)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn transform_layer(&mut self, index: usize, transformation: &JsValue) -> Result<(), JsValue> {
        let transformation: Transformation = serde_wasm_bindgen::from_value(transformation.clone())
            .map_err(|e| JsValue::from_str(&format!("Invalid transformation: {}", e)))?;
        
        self.0.transform_layer(index, &transformation)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn get_layer(&self, index: usize, format: Option<String>) -> Result<Vec<u8>, JsValue> {
        self.0.get_layer(index, format)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn add_empty_layer(&mut self, width: u32, height: u32) -> Result<(), JsValue> {
        self.0.add_empty_layer(width, height)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn process_with_proof(&mut self, input: &JsValue) -> Result<JsValue, JsValue> {
        let input: ImageInput = serde_wasm_bindgen::from_value(input.clone())
            .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;
        
        let output = self.0.process_with_proof(&input)
            .map_err(|e| JsValue::from_str(&e))?;
        
        serde_wasm_bindgen::to_value(&output)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }
}