use image::{DynamicImage, ImageFormat, Rgba, RgbaImage};
use serde::{Serialize, Deserialize};
use crate::Transformation;
use ab_glyph::{Font, FontArc, PxScale, Point};

#[derive(Debug, Serialize, Deserialize)]
pub struct Layer {
    #[serde(skip)]
    pub image: DynamicImage,
    #[serde(with = "serde_bytes")]
    image_data: Vec<u8>,
}

impl Layer {
    pub fn new(image_data: &[u8]) -> Result<Layer, String> {
        let img = image::load_from_memory(image_data)
            .map_err(|e| format!("Failed to load image: {}", e))?;
        Ok(Layer { 
            image: img,
            image_data: image_data.to_vec(),
        })
    }

    pub fn new_empty(width: u32, height: u32) -> Result<Self, String> {
        let image = DynamicImage::ImageRgba8(RgbaImage::new(width, height));
        let mut bytes = Vec::new();
        image.write_to(&mut std::io::Cursor::new(&mut bytes), ImageFormat::Png)
            .map_err(|e| format!("Failed to encode empty image: {}", e))?;
        
        Ok(Layer { 
            image,
            image_data: bytes,
        })
    }

    pub fn apply_transformation(&mut self, transformation: Transformation) -> Result<(), String> {
        self.image = match transformation {
            Transformation::Crop(params) => {
                self.image.crop_imm(params.x, params.y, params.width, params.height)
            }
            Transformation::Grayscale => self.image.grayscale(),
            Transformation::Rotate90 => self.image.rotate90(),
            Transformation::Rotate180 => self.image.rotate180(),
            Transformation::Rotate270 => self.image.rotate270(),
            Transformation::FlipVertical => self.image.flipv(),
            Transformation::FlipHorizontal => self.image.fliph(),
            Transformation::Brighten(params) => self.image.brighten(params.value),
            Transformation::Contrast(params) => self.image.adjust_contrast(params.contrast),
            Transformation::Blur(params) => self.image.blur(params.sigma),
            Transformation::TextOverlay(params) => {
                let font_data = include_bytes!("../assets/impact.ttf");
                let font = FontArc::try_from_slice(font_data)
                    .map_err(|_| "Failed to load font")?;

                let mut rgba_image = self.image.to_rgba8();
                let scale = PxScale::from(params.size as f32);
                let color = Self::hex_to_rgba(&params.color)?;

                let mut max_ascent: f32 = 0.0;
                for c in params.text.chars() {
                    let glyph = font.glyph_id(c).with_scale(scale);
                    let bounds = font.glyph_bounds(&glyph);
                    max_ascent = max_ascent.max(-bounds.min.y);
                }
                
                let mut cursor = Point { 
                    x: params.x as f32, 
                    y: params.y as f32 + max_ascent,
                };

                for c in params.text.chars() {
                    let glyph = font.glyph_id(c)
                        .with_scale(scale);
                    if let Some(outline) = font.outline_glyph(glyph.clone()) {
                        outline.draw(|x, y, v| {
                            let px = ((x as f32 + cursor.x).max(0.0)) as u32;
                            let py = ((y as f32 + cursor.y).max(0.0)) as u32;
                            if px < rgba_image.width() && py < rgba_image.height() {
                                let alpha = (v * 255.0) as u8;
                                if alpha > 0 {
                                    rgba_image.put_pixel(px, py, Rgba([
                                        color[0],
                                        color[1],
                                        color[2],
                                        alpha,
                                    ]));
                                }
                            }
                        });
                    }
                    cursor.x += font.glyph_bounds(&glyph).width();
                }

                DynamicImage::ImageRgba8(rgba_image)
            }
        };
        Ok(())
    }

    pub fn to_bytes(&self, format: ImageFormat, quality: Option<f32>) -> Result<Vec<u8>, String> {
        let mut bytes: Vec<u8> = Vec::new();
        match (format, quality) {
            (ImageFormat::Jpeg, Some(q)) => q.clamp(0.0, 100.0) as u8,
            (ImageFormat::Jpeg, None) => 90,
            (ImageFormat::WebP, Some(q)) => (q.clamp(0.0, 100.0) * 100.0) as u8,
            (ImageFormat::WebP, None) => 80,
            _ => 100,
        };

        self.image
            .write_to(&mut std::io::Cursor::new(&mut bytes), format)
            .map_err(|e| format!("Failed to encode image: {}", e))?;
        Ok(bytes)
    }

    fn hex_to_rgba(hex: &str) -> Result<Rgba<u8>, String> {
        let hex = hex.trim_start_matches('#');
        if hex.len() != 6 {
            return Err("Invalid hex color".to_string());
        }
        
        let r = u8::from_str_radix(&hex[0..2], 16).map_err(|_| "Invalid red value")?;
        let g = u8::from_str_radix(&hex[2..4], 16).map_err(|_| "Invalid green value")?;
        let b = u8::from_str_radix(&hex[4..6], 16).map_err(|_| "Invalid blue value")?;
        
        Ok(Rgba([r, g, b, 255]))
    }
}