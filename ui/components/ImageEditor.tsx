'use client';

import { useImageEditor } from '@/hooks/useImageEditor';
import { useState } from 'react';
import { 
  ImageIcon, 
  Wand2, 
  RotateCw, 
  FlipHorizontal2, 
  SunMedium, 
  Contrast,
  Droplet,
  Type,
  SquareDashed
} from 'lucide-react';
import { TransformPanel } from '@/components/TransformPanel';
import { LayersPanel } from '@/components/LayersPanel';
import { ImageCanvas } from '@/components/ImageCanvas';

interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

const tools = [
  { icon: ImageIcon, name: 'Upload', type: 'upload' },
  { icon: SquareDashed, name: 'Selection', type: 'selection' },
  { icon: Wand2, name: 'Grayscale', type: 'Grayscale' },
  { icon: RotateCw, name: 'Rotate', type: 'Rotate90' },
  { icon: FlipHorizontal2, name: 'Flip', type: 'FlipHorizontal' },
  { icon: SunMedium, name: 'Brighten', type: 'Brighten' },
  { icon: Contrast, name: 'Contrast', type: 'Contrast' },
  { icon: Droplet, name: 'Blur', type: 'Blur' },
  { icon: Type, name: 'Text', type: 'text' }
];

export default function ImageEditor() {
  const { loadImage, applyTransformation, exportImage } = useImageEditor();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selection, setSelection] = useState<RegionSelection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

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
    const url = await exportImage(selectedTool === 'png' ? 'png' : 'jpeg');
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-image.${selectedTool === 'png' ? 'png' : 'jpeg'}`;
      link.click();
    }
  };

  const handleToolClick = (toolType: string) => {
    setSelectedTool(toolType);
    if (toolType === 'upload') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files) {
          handleFileUpload({ target } as React.ChangeEvent<HTMLInputElement>);
        }
      };
      input.click();
    }
  };

  return (
    <div className="h-screen flex">
      <div className="w-16 bg-neutral-900 flex flex-col gap-2 p-2">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => handleToolClick(tool.type)}
            className={`p-2 rounded-lg transition-colors ${
              selectedTool === tool.type 
                ? 'bg-blue-500 text-white' 
                : 'text-neutral-400 hover:bg-neutral-800'
            }`}
            title={tool.name}
          >
            <tool.icon size={20} />
          </button>
        ))}
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 bg-neutral-800 relative overflow-hidden">
          <ImageCanvas
            imageUrl={imageUrl}
            zoom={zoom}
            pan={pan}
            onZoomChange={setZoom}
            onPanChange={setPan}
            selection={selection}
            onSelectionChange={setSelection}
            isLoading={isLoading}
            selectedTool={selectedTool}
          />
        </div>

        <div className="w-64 bg-neutral-900 p-4 flex flex-col gap-4">
          <TransformPanel
            selectedTool={selectedTool}
            onTransform={handleTransform}
            onTextOverlay={handleTextOverlay}
            onExport={handleExport}
          />
          <LayersPanel />
        </div>
      </div>
    </div>
  );
}
