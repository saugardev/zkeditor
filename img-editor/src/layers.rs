use image::{DynamicImage, ImageFormat, Rgba, RgbaImage};
use crate::Transformation;
use ab_glyph::{Font, FontArc, PxScale, Point};

pub struct Layer {
    pub image: DynamicImage,
}

impl Layer {
    pub fn new(image_data: &[u8]) -> Result<Layer, String> {
        let img = image::load_from_memory(image_data)
            .map_err(|e| format!("Failed to load image: {}", e))?;
        Ok(Layer { image: img })
    }

    pub fn new_empty(width: u32, height: u32) -> Result<Self, String> {
        let image = DynamicImage::ImageRgba8(RgbaImage::new(width, height));
        Ok(Layer { image })
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Transformation, CropParameters, BrightenParameters, ContrastParameters, BlurParameters};
    use image::{RgbaImage, Rgba};

    fn create_test_image() -> Vec<u8> {
        // Create a 2x2 black image
        let mut img = RgbaImage::new(2, 2);
        for pixel in img.pixels_mut() {
            *pixel = Rgba([0, 0, 0, 255]);
        }
        
        let mut bytes: Vec<u8> = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut bytes), ImageFormat::Png)
            .expect("Failed to create test image");
        bytes
    }

    #[test]
    fn test_layer_creation() {
        let image_data = create_test_image();
        let layer = Layer::new(&image_data).unwrap();
        assert_eq!(layer.image.width(), 2);
        assert_eq!(layer.image.height(), 2);
    }

    #[test]
    fn test_transformations() {
        let image_data = create_test_image();
        let mut layer = Layer::new(&image_data).unwrap();

        // Test grayscale
        layer.apply_transformation(Transformation::Grayscale).unwrap();

        // Test rotations
        layer.apply_transformation(Transformation::Rotate90).unwrap();
        assert_eq!(layer.image.width(), 2);
        assert_eq!(layer.image.height(), 2);

        // Test crop
        layer.apply_transformation(Transformation::Crop(CropParameters {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
        })).unwrap();
        assert_eq!(layer.image.width(), 1);
        assert_eq!(layer.image.height(), 1);

        // Test brightness
        layer.apply_transformation(Transformation::Brighten(BrightenParameters { value: 10 })).unwrap();

        // Test contrast
        layer.apply_transformation(Transformation::Contrast(ContrastParameters { contrast: 1.5 })).unwrap();

        // Test blur
        layer.apply_transformation(Transformation::Blur(BlurParameters { sigma: 1.0 })).unwrap();
    }

    #[test]
    fn test_invalid_image_data() {
        let result = Layer::new(&[0, 1, 2, 3]); // Invalid image data
        assert!(result.is_err());
    }

    #[test]
    fn test_to_bytes() {
        let image_data = create_test_image();
        let layer = Layer::new(&image_data).unwrap();

        // JPEG with 85% quality
        let jpeg_bytes = layer.to_bytes(ImageFormat::Jpeg, Some(85.0)).unwrap();
        assert!(!jpeg_bytes.is_empty());

        // WebP with 90% quality
        let webp_bytes = layer.to_bytes(ImageFormat::WebP, Some(0.9)).unwrap();
        assert!(!webp_bytes.is_empty());

        // PNG (quality parameter ignored)
        let png_bytes = layer.to_bytes(ImageFormat::Png, None).unwrap();
        assert!(!png_bytes.is_empty());
    }
}
