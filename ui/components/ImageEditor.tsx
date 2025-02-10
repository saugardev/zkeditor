'use client';

import { useImageEditor } from '@/hooks/useImageEditor';
import Image from 'next/image';
import { useState } from 'react';

export default function ImageEditor() {
  const { loadImage, applyTransformation, exportImage } = useImageEditor();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('png');

  const transformations = [
    { name: 'Grayscale', type: 'Grayscale' },
    { name: 'Rotate 90°', type: 'Rotate90' },
    { name: 'Rotate 180°', type: 'Rotate180' },
    { name: 'Rotate 270°', type: 'Rotate270' },
    { name: 'Flip Vertical', type: 'FlipVertical' },
    { name: 'Flip Horizontal', type: 'FlipHorizontal' },
    { name: 'Brighten', type: 'Brighten', paramName: 'value', value: 10 },
    { name: 'Contrast', type: 'Contrast', paramName: 'contrast', value: 1.5 },
    { name: 'Blur', type: 'Blur', paramName: 'sigma', value: 10.0 }
  ];

  const formats = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await loadImage(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleTransform = async (type: string, value?: number, paramName?: string) => {
    const transformation = {
      [type]: value !== undefined ? { [paramName || 'value']: value } : null
    };
    const newUrl = await applyTransformation(transformation);
    if (newUrl) setImageUrl(newUrl);
  };

  const handleExport = async () => {
    const url = await exportImage(selectedFormat);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-image.${selectedFormat}`;
      link.click();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileUpload}
        className="mb-4"
      />
      
      {imageUrl && (
        <>
          <div className="flex flex-wrap gap-2">
            {transformations.map((t) => (
              <button
                key={t.type}
                onClick={() => handleTransform(t.type, t.value, t.paramName)}
                className="px-4 py-2 bg-foreground text-background rounded hover:opacity-90"
              >
                {t.name}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <select 
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-2 py-1 rounded border border-foreground/20"
            >
              {formats.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-foreground text-background rounded hover:opacity-90"
            >
              Export
            </button>
          </div>
          
          <Image
            src={imageUrl} 
            alt="Edited image" 
            className="max-w-full"
            height={500}
            width={500}
          />
        </>
      )}
    </div>
  );
} 