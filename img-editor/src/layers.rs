use image::{DynamicImage, ImageFormat};
use crate::Transformation;

pub struct Layer {
    pub image: DynamicImage,
}

impl Layer {
    pub fn new(image_data: &[u8]) -> Result<Layer, String> {
        let img = image::load_from_memory(image_data)
            .map_err(|e| format!("Failed to load image: {}", e))?;
        Ok(Layer { image: img })
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
