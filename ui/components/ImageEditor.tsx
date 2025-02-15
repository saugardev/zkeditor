/* eslint-disable @next/next/no-img-element */
'use client';

import { useImageEditor } from '@/hooks/useImageEditor';
import { useState, useRef } from 'react';
import { TextOverlayControls } from './TextOverlayControls';
import { SelectionRect } from './SelectionRect';

interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Transformation {
  name: string;
  type: string;
  value?: number;
  directApply?: boolean;
}

export default function ImageEditor() {
  const { loadImage, applyTransformation, exportImage } = useImageEditor();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [selection, setSelection] = useState<RegionSelection | null>(null);
  const [selectedTransform, setSelectedTransform] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const transformations: Transformation[] = [
    { name: 'Grayscale', type: 'Grayscale' },
    { name: 'Rotate 90°', type: 'Rotate90', directApply: true },
    { name: 'Rotate 180°', type: 'Rotate180', directApply: true },
    { name: 'Rotate 270°', type: 'Rotate270', directApply: true },
    { name: 'Flip Vertical', type: 'FlipVertical', directApply: true },
    { name: 'Flip Horizontal', type: 'FlipHorizontal', directApply: true },
    { name: 'Brighten', type: 'Brighten', value: 10 },
    { name: 'Contrast', type: 'Contrast', value: 1.5 },
    { name: 'Blur', type: 'Blur', value: 10.0 }
  ];

  const formats = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsLoading(true);
      const project = await loadImage(file);
      const initialImage = await project.get_layer(0);
      setImageUrl(URL.createObjectURL(new Blob([initialImage], { type: 'image/png' })));
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransform = async (
    type: string, 
    value?: number, 
    paramName?: string,
    region?: RegionSelection
  ) => {
    try {
      setIsLoading(true);
      const noRegionTransforms = ['Rotate90', 'Rotate180', 'Rotate270'];
      
      let transformation;
      if (type === 'Brighten') {
        transformation = {
          Brighten: {
            value: 10,
            region: region ? {
              x: Math.round(region.x),
              y: Math.round(region.y),
              width: Math.round(region.width),
              height: Math.round(region.height)
            } : null
          }
        };
      } else if (type === 'Contrast') {
        transformation = {
          Contrast: {
            contrast: 1.5,
            region: region ? {
              x: Math.round(region.x),
              y: Math.round(region.y),
              width: Math.round(region.width),
              height: Math.round(region.height)
            } : null
          }
        };
      } else if (type === 'Blur') {
        transformation = {
          Blur: {
            sigma: 10.0,
            region: region ? {
              x: Math.round(region.x),
              y: Math.round(region.y),
              width: Math.round(region.width),
              height: Math.round(region.height)
            } : null
          }
        };
      } else {
        transformation = {
          [type]: noRegionTransforms.includes(type) 
            ? null 
            : {
                region: region ? {
                  x: Math.round(region.x),
                  y: Math.round(region.y), 
                  width: Math.round(region.width),
                  height: Math.round(region.height)
                } : null
              }
        };
      }
      
      const newUrl = await applyTransformation(transformation);
      if (newUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            setImageUrl(newUrl);
            resolve();
          };
          img.src = newUrl;
        });
      }
    } catch (error) {
      console.error('Transform failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextOverlay = async (params: {
    TextOverlay: {
      text: string;
      x: number;
      y: number;
      size: number;
      color: string;
    }
  }) => {
    try {
      setIsLoading(true);
      const newUrl = await applyTransformation(params);
      if (newUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            setImageUrl(newUrl);
            resolve();
          };
          img.src = newUrl;
        });
      }
    } catch (error) {
      console.error('Text overlay failed:', error);
    } finally {
      setIsLoading(false);
    }
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
      
      <div className="flex flex-wrap gap-2">
        {transformations.map((t) => (
          <button
            key={t.type}
            onClick={() => {
              if (t.directApply) {
                handleTransform(t.type);
              } else {
                setSelectedTransform(t.type);
              }
            }}
            disabled={isLoading}
            className={`px-4 py-2 rounded ${
              selectedTransform === t.type && !t.directApply
                ? 'bg-blue-500 text-white' 
                : 'bg-foreground text-background'
            } hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Processing...' : t.name}
          </button>
        ))}
      </div>
      
      <div className="relative flex justify-center">
        <div className="max-h-[80vh] w-auto relative">
          <img
            ref={imageRef}
            src={imageUrl || undefined}
            alt="Edited image" 
            className="h-full w-auto object-contain"
            style={{ 
              maxWidth: '100%',
              objectFit: 'contain'
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white">Processing...</div>
            </div>
          )}
          {selectedTransform && (
            <SelectionRect
              selection={selection}
              onSelectionChange={setSelection}
              imageRef={imageRef as React.RefObject<HTMLImageElement>}
            />
          )}
        </div>
        {selection && selectedTransform && (
          <button
            onClick={() => {
              handleTransform(selectedTransform, undefined, undefined, selection);
              setSelection(null);
              setSelectedTransform(null);
            }}
            className="absolute bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Apply
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-[1fr,300px] gap-4">
        <div>
          <TextOverlayControls onApply={handleTextOverlay} />
        </div>
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
    </div>
  );
}
