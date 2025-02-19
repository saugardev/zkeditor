import { useRef, useCallback } from 'react';
import { createImageProject } from '@/lib/wasm-loader';

export function useImageEditor() {
  const projectsRef = useRef<Map<number, Awaited<ReturnType<typeof createImageProject>>>>(new Map());

  const loadImage = useCallback(async (file: File, tabIndex: number) => {
    console.log('Loading image for tab:', tabIndex);
    const arrayBuffer = await file.arrayBuffer();
    const project = await createImageProject();
    await project.add_layer(new Uint8Array(arrayBuffer));
    
    const exifOrientation = await getImageOrientation(file);
    if (exifOrientation >= 5 && exifOrientation <= 8) {
      await project.transform_layer(0, { Rotate90: null });
    }
    
    projectsRef.current.set(tabIndex, project);
    console.log('Projects after update:', projectsRef.current);
    
    return project;
  }, []);

  const applyTransformation = useCallback(async (transformation: unknown, tabIndex: number, layerIndex = 0) => {
    console.log('Applying transformation for tab:', tabIndex);
    console.log('Available projects:', projectsRef.current);
    const project = projectsRef.current.get(tabIndex);
    if (!project) {
      // Re-create project if it's lost
      const currentTab = document.querySelector(`img[data-tab="${tabIndex}"]`) as HTMLImageElement;
      if (currentTab?.src) {
        const response = await fetch(currentTab.src);
        const arrayBuffer = await response.arrayBuffer();
        const newProject = await createImageProject();
        await newProject.add_layer(new Uint8Array(arrayBuffer));
        projectsRef.current.set(tabIndex, newProject);
        await newProject.transform_layer(layerIndex, transformation);
        const result = await newProject.get_layer(layerIndex);
        return URL.createObjectURL(new Blob([result], { type: 'image/png' }));
      }
      console.error('No project found for tab:', tabIndex);
      return null;
    }
    
    await project.transform_layer(layerIndex, transformation);
    const result = await project.get_layer(layerIndex);
    return URL.createObjectURL(new Blob([result], { type: 'image/png' }));
  }, []);

  const exportImage = useCallback(async (format: string, tabIndex: number, layerIndex = 0) => {
    const project = projectsRef.current.get(tabIndex);
    if (!project) return null;
    const result = await project.get_layer(layerIndex, format);
    return URL.createObjectURL(new Blob([result], { type: `image/${format}` }));
  }, []);

  const reorderProjects = useCallback((oldIndices: number[], newIndices: number[]) => {
    const newProjects = new Map<number, Awaited<ReturnType<typeof createImageProject>>>();
    
    oldIndices.forEach((oldIndex, i) => {
      const project = projectsRef.current.get(oldIndex);
      if (project) {
        newProjects.set(newIndices[i], project);
      }
    });
    
    projectsRef.current = newProjects;
  }, []);

  return {
    projects: projectsRef.current,
    loadImage,
    applyTransformation,
    exportImage,
    reorderProjects
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
export async function getImageOrientation(file: File): Promise<number> {
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