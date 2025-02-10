import { useState, useCallback } from 'react';
import { createImageProject } from '@/lib/wasm-loader';

export function useImageEditor() {
  const [imageProject, setImageProject] = useState<Awaited<ReturnType<typeof createImageProject>> | null>(null);

  const loadImage = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const project = await createImageProject();
    await project.add_layer(new Uint8Array(arrayBuffer));
    setImageProject(project);
    return project;
  }, []);

  const applyTransformation = useCallback(async (transformation: unknown, layerIndex = 0) => {
    if (!imageProject) return null;
    await imageProject.transform_layer(layerIndex, transformation);
    const result = await imageProject.get_layer(layerIndex);
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