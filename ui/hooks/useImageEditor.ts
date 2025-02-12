import { useState, useCallback } from 'react';
import { createImageProject } from '@/lib/wasm-loader';

export function useImageEditor() {
  const [imageProject, setImageProject] = useState<Awaited<ReturnType<typeof createImageProject>> | null>(null);

  const loadImage = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const project = await createImageProject();
    await project.add_layer(new Uint8Array(arrayBuffer));

    const exifOrientation = await getImageOrientation(file);
    const initialImage = await project.get_layer(0);
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = URL.createObjectURL(new Blob([initialImage]));
    });

    if (exifOrientation >= 5 && exifOrientation <= 8) {
      await project.transform_layer(0, { Rotate90: null });
    }

    setImageProject(project);
    return project;
  }, []);

  const applyTransformation = useCallback(async (transformation: unknown, layerIndex = 0) => {
    if (!imageProject) return null;
    
    const originalImage = await imageProject.get_layer(layerIndex);
    const img = new Image();
    await new Promise(resolve => {
        img.onload = resolve;
        img.src = URL.createObjectURL(new Blob([originalImage]));
    });
    
    await imageProject.transform_layer(layerIndex, transformation);
    const result = await imageProject.get_layer(layerIndex);
    
    const transformedImg = new Image();
    await new Promise(resolve => {
        transformedImg.onload = resolve;
        transformedImg.src = URL.createObjectURL(new Blob([result]));
    });
    
    return URL.createObjectURL(new Blob([result], { type: 'image/png' }));
  }, [imageProject]);

  const exportImage = useCallback(async (format: string, layerIndex = 0) => {
    if (!imageProject) return null;
    const result = await imageProject.get_layer(layerIndex, format);
    return URL.createObjectURL(new Blob([result], { type: `image/${format}` }));
  }, [imageProject]);

  return {
    imageProject,
    loadImage,
    applyTransformation,
    exportImage
  };
}

/**
 * Reads EXIF orientation from JPEG files
 * @returns {Promise<number>} Orientation value 1-8:
 * - 1: Normal (no rotation/flip)
 * - 2: Flipped horizontally
 * - 3: Rotated 180°
 * - 4: Flipped vertically
 * - 5: Rotated 90° CCW and flipped horizontally
 * - 6: Rotated 90° CW
 * - 7: Rotated 90° CW and flipped horizontally
 * - 8: Rotated 90° CCW
 */
async function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const view = new DataView(e.target?.result as ArrayBuffer);
      
      // Check if image is JPEG by looking for JPEG Start of Image (SOI) marker
      if (view.getUint16(0, false) != 0xFFD8) {
        resolve(1); // Not a JPEG, return normal orientation
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        const marker = view.getUint16(offset, false);
        offset += 2;
        
        if (marker == 0xFFE1) { // EXIF marker (APP1)
          // Check for "Exif" string (0x45786966 in hex)
          if (view.getUint32(offset += 2, false) != 0x45786966) {
            resolve(1);
            return;
          }
          
          // Check byte order - II (0x4949) for Intel = little-endian, MM (0x4D4D) for Motorola = big-endian
          const little = view.getUint16(offset += 6, false) == 0x4949;
          offset += view.getUint32(offset + 4, little);
          
          const tags = view.getUint16(offset, little);
          offset += 2;
          
          // Look for orientation tag (0x0112)
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) == 0x0112) {
              resolve(view.getUint16(offset + (i * 12) + 8, little));
              return;
            }
          }
        } else if ((marker & 0xFF00) != 0xFF00) { // Invalid marker
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      
      resolve(1); // No EXIF orientation found, return normal orientation
    };
    reader.readAsArrayBuffer(file);
  });
} 