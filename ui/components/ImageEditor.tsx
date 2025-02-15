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
  SquareDashed,
  Menu
} from 'lucide-react';
import { TransformPanel } from '@/components/TransformPanel';
import { ImageCanvas } from '@/components/ImageCanvas';
import { Navbar } from './Navbar';
import { useTabs } from '@/contexts/TabsContext';

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
  const { tabs, activeTab, isLoading, setActiveTab, updateTabState } = useTabs();
  const { loadImage, applyTransformation, exportImage } = useImageEditor();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsTabLoading(true);
      const project = await loadImage(file, activeTab);
      const initialImage = await project.get_layer(0);
      const imageUrl = URL.createObjectURL(new Blob([initialImage], { type: 'image/png' }));
      updateTabState(activeTab, { imageUrl });
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsTabLoading(false);
    }
  };

  const handleTransform = async (
    type: string,
    value?: number,
    paramName?: string,
    region?: RegionSelection
  ) => {
    try {
      console.log('Starting transformation:', { type, value, paramName, region });
      setIsTabLoading(true);
      const noRegionTransforms = ['Rotate90', 'Rotate180', 'Rotate270'];
      
      const currentSelection = tabs[activeTab]?.selection;
      
      let transformation;
      if (type === 'Brighten') {
        transformation = {
          Brighten: {
            value,
            region: currentSelection ? {
              x: Math.round(currentSelection.x),
              y: Math.round(currentSelection.y),
              width: Math.round(currentSelection.width),
              height: Math.round(currentSelection.height)
            } : null
          }
        };
      } else if (type === 'Contrast') {
        transformation = {
          Contrast: {
            contrast: value,
            region: currentSelection ? {
              x: Math.round(currentSelection.x),
              y: Math.round(currentSelection.y),
              width: Math.round(currentSelection.width),
              height: Math.round(currentSelection.height)
            } : null
          }
        };
      } else if (type === 'Blur') {
        transformation = {
          Blur: {
            sigma: value,
            region: currentSelection ? {
              x: Math.round(currentSelection.x),
              y: Math.round(currentSelection.y),
              width: Math.round(currentSelection.width),
              height: Math.round(currentSelection.height)
            } : null
          }
        };
      } else {
        transformation = {
          [type]: noRegionTransforms.includes(type) 
            ? null 
            : {
                region: currentSelection ? {
                  x: Math.round(currentSelection.x),
                  y: Math.round(currentSelection.y), 
                  width: Math.round(currentSelection.width),
                  height: Math.round(currentSelection.height)
                } : null
              }
        };
      }
      
      console.log('Transformation object:', transformation);
      console.log('Current tab:', activeTab);
      console.log('Current tab image:', tabs[activeTab]?.imageUrl);
      
      const newUrl = await applyTransformation(transformation, activeTab);
      console.log('New URL after transformation:', newUrl);
      
      if (newUrl) {
        updateTabState(activeTab, { imageUrl: newUrl });
      }
    } catch (error) {
      console.error('Transform failed:', error);
    } finally {
      setIsTabLoading(false);
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
      setIsTabLoading(true);
  const newUrl = await applyTransformation(params, activeTab);
      if (newUrl) {
        const updatedTabs = [...tabs];
        updatedTabs[activeTab] = { ...updatedTabs[activeTab], imageUrl: newUrl };
        setActiveTab(activeTab);
      }
    } catch (error) {
      console.error('Text overlay failed:', error);
    } finally {
      setIsTabLoading(false);
    }
  };

  const handleExport = async () => {
  const url = await exportImage(selectedTool === 'png' ? 'png' : 'jpeg', activeTab);
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

  const handleZoomChange = (newZoom: number) => {
    updateTabState(activeTab, { zoom: newZoom });
  };

  const handlePanChange = (newPan: { x: number; y: number }) => {
    updateTabState(activeTab, { pan: newPan });
  };

  const handleSelectionChange = (newSelection: RegionSelection | null) => {
    updateTabState(activeTab, { selection: newSelection });
  };

  const handleTabSwitch = async (index: number) => {
    setIsTabLoading(true);
    setActiveTab(index);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsTabLoading(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <div className="w-16 bg-neutral-900 flex flex-col gap-2 p-2 border-r border-neutral-700">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => handleToolClick(tool.type)}
              className={`p-2 rounded-lg transition-colors flex items-center justify-center${
                selectedTool === tool.type 
                  ? ' bg-neutral-800 text-white' 
                  : ' text-neutral-400 hover:bg-neutral-800'
              }`}
              title={tool.name}
            >
              <tool.icon size={20} />
            </button>
          ))}
        </div>
  
        <div className="flex-1 flex flex-col">
          <div className="flex border-b border-neutral-700 bg-neutral-900">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabSwitch(index)}
                className={`px-4 py-2 flex items-center gap-2 text-neutral-400 text-sm ${
                  activeTab === index ? 'bg-neutral-800' : 'hover:bg-neutral-800'
                }`}
              >
                <Menu size={14} />
                {tab.name}
              </button>
            ))}
          </div>
          
          <div className="flex-1 flex">
            <div className="flex-1 bg-neutral-800 relative overflow-hidden">
              <ImageCanvas
                imageUrl={tabs[activeTab]?.imageUrl}
                zoom={tabs[activeTab]?.zoom ?? 1}
                pan={tabs[activeTab]?.pan ?? { x: 0, y: 0 }}
                onZoomChange={handleZoomChange}
                onPanChange={handlePanChange}
                selection={tabs[activeTab]?.selection ?? null}
                onSelectionChange={handleSelectionChange}
                isLoading={isLoading || isTabLoading}
                selectedTool={selectedTool}
                activeTab={activeTab}
                tabs={tabs}
              />
            </div>
  
            <div className="w-64 bg-neutral-900 p-4 flex flex-col gap-4">
              <div className="w-64 bg-neutral-900 p-4 flex flex-col gap-4">
                <TransformPanel
                  selectedTool={selectedTool}
                  onTransform={handleTransform}
                  onTextOverlay={handleTextOverlay}
                  onExport={handleExport}
                  selection={tabs[activeTab]?.selection ?? null}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
