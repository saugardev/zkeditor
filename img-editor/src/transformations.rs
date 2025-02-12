use serde::{Deserialize, Serialize};

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