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
pub struct Region {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Transformation {
    Crop(CropParameters),
    Grayscale { region: Option<Region> },
    Rotate90,
    Rotate180,
    Rotate270,
    FlipVertical { region: Option<Region> },
    FlipHorizontal { region: Option<Region> },
    Brighten { value: i32, region: Option<Region> },
    Contrast { contrast: f32, region: Option<Region> },
    Blur { sigma: f32, region: Option<Region> },    
    TextOverlay(TextOverlayParameters),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SignatureData {
    pub signature: Vec<u8>,
    pub public_key: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageInput {
    pub image_data: Vec<u8>,
    pub transformations: Vec<Transformation>,
    pub signature_data: Option<SignatureData>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageOutput {
    pub final_image: Vec<u8>,
    pub original_image_hash: Vec<u8>,
    pub signer_public_key: Option<Vec<u8>>,
}