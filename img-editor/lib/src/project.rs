use image::ImageFormat;
use crate::{Layer, ImageInput, ImageOutput, Transformation};

pub struct ImageProject {
    pub(crate) layers: Vec<Layer>,
}

impl ImageProject {
    pub fn new() -> Self {
        Self { layers: Vec::new() }
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
    }

    pub fn add_empty_layer(&mut self, width: u32, height: u32) -> Result<(), String> {
        let empty_layer = Layer::new_empty(width, height)?;
        self.layers.push(empty_layer);
        Ok(())
    }

    pub fn process_with_proof(&mut self, input: &ImageInput) -> Result<ImageOutput, String> {
        self.add_layer(&input.image_data)?;
        
        for transformation in &input.transformations {
            self.transform_layer(0, transformation)?;
        }
        
        let final_image = self.get_layer(0, None)?;
        
        Ok(ImageOutput {
            final_image,
            transformation_count: input.transformations.len(),
            id: input.id.clone()
        })
    }
}