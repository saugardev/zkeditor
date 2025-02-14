use image::{DynamicImage, ImageFormat, Rgba, RgbaImage};
use serde::{Serialize, Deserialize};
use crate::{TextOverlayParameters, Transformation, Region};
use rusttype::{point, Font as RusttypeFont, Scale};

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

    fn apply_region_transformation(&mut self, region: &Region, transform: Box<dyn Fn(&mut DynamicImage)>) -> Result<(), String> {
        let mut sub_image = self.image.crop_imm(
            region.x,
            region.y,
            region.width,
            region.height
        );
        
        transform(&mut sub_image);
        
        // Convert both images to RGBA8 for pixel manipulation
        let mut new_image = self.image.to_rgba8();
        let sub_rgba = sub_image.to_rgba8();
        
        // Copy the transformed region back
        for y in 0..region.height {
            for x in 0..region.width {
                let pixel = sub_rgba.get_pixel(x, y);
                new_image.put_pixel(x + region.x, y + region.y, *pixel);
            }
        }
        
        self.image = DynamicImage::ImageRgba8(new_image);
        Ok(())
    }

    pub fn apply_transformation(&mut self, transformation: Transformation) -> Result<(), String> {
        match transformation {
            Transformation::Grayscale { region } => {
                if let Some(region) = region {
                    self.apply_region_transformation(&region, Box::new(|img| {
                        *img = img.grayscale();
                    }))
                } else {
                    self.image = self.image.grayscale();
                    Ok(())
                }
            },
            Transformation::FlipHorizontal { region } => {
                if let Some(region) = region {
                    self.apply_region_transformation(&region, Box::new(|img| {
                        *img = img.fliph();
                    }))
                } else {
                    self.image = self.image.fliph();
                    Ok(())
                }
            },
            Transformation::FlipVertical { region } => {
                if let Some(region) = region {
                    self.apply_region_transformation(&region, Box::new(|img| {
                        *img = img.flipv();
                    }))
                } else {
                    self.image = self.image.flipv();
                    Ok(())
                }
            },
            // Keep other transformations as is
            Transformation::Rotate90 => {
                self.image = self.image.rotate90();
                Ok(())
            },
            Transformation::Rotate180 => {
                self.image = self.image.rotate180();
                Ok(())
            },
            Transformation::Rotate270 => {
                self.image = self.image.rotate270();
                Ok(())
            },
            Transformation::Brighten(params) => {
                self.image = self.image.brighten(params.value);
                Ok(())
            },
            Transformation::Contrast(params) => {
                self.image = self.image.adjust_contrast(params.contrast);
                Ok(())
            },
            Transformation::Blur(params) => {
                self.image = self.image.blur(params.sigma);
                Ok(())
            },
            Transformation::TextOverlay(params) => {
                self.apply_text_overlay(&params)
                    .map(|img| { self.image = img; })
            },
            Transformation::Crop(params) => {
                self.image = self.image.crop_imm(
                    params.x,
                    params.y,
                    params.width,
                    params.height
                );
                Ok(())
            },
        }
    }

    fn apply_text_overlay(&mut self, params: &TextOverlayParameters) -> Result<DynamicImage, String> {
        let font_data = include_bytes!("../assets/impact.ttf");
        let font = RusttypeFont::try_from_bytes(font_data)
            .ok_or("Failed to load font")?;

        let mut rgba_image = self.image.to_rgba8();
        let scale = Scale::uniform(params.size as f32);
        let color = Self::hex_to_rgba(&params.color)?;

        let v_metrics = font.v_metrics(scale);
        let glyphs: Vec<_> = font.layout(
            &params.text,
            scale,
            point(params.x as f32, params.y as f32 + v_metrics.ascent)
        ).collect();

        let width = rgba_image.width() as i32;
        let height = rgba_image.height() as i32;

        for glyph in &glyphs {
            if let Some(bb) = glyph.pixel_bounding_box() {
                glyph.draw(|x, y, v| {
                    let px = x as i32 + bb.min.x;
                    let py = y as i32 + bb.min.y;
                    
                    if px >= 0 && px < width && py >= 0 && py < height {
                        let alpha = (v * 255.0) as u8;
                        if alpha > 0 {
                            rgba_image.put_pixel(px as u32, py as u32, Rgba([
                                color[0],
                                color[1], 
                                color[2],
                                alpha
                            ]));
                        }
                    }
                });
            }
        }

        Ok(DynamicImage::ImageRgba8(rgba_image))
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
