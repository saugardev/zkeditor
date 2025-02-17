/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';

interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TransformPanelProps {
  selectedTool: string | null;
  onTransform: (type: string, value?: number, paramName?: string, region?: RegionSelection) => Promise<void>;
  onTextOverlay: (params: any) => Promise<void>;
  onExport: () => Promise<void>;
  selection: RegionSelection | null;
  onSelectionChange: (selection: RegionSelection | null) => void;
}

type TransformParams = {
  Brighten: { value: number };
  Contrast: { contrast: number };
  Blur: { sigma: number };
};

export function TransformPanel({ 
  selectedTool, 
  onTransform, 
  onTextOverlay,
  selection,
  onSelectionChange
}: TransformPanelProps) {
  const [textParams, setTextParams] = useState({
    text: '',
    x: 10,
    y: 10,
    size: 24,
    color: '#ffffff',
    selecting: false
  });

  const [params, setParams] = useState<TransformParams>({
    Brighten: { value: 10 },
    Contrast: { contrast: 1.5 },
    Blur: { sigma: 10.0 }
  });

  useEffect(() => {
    const handleTextPosition = (e: CustomEvent) => {
      if (textParams.selecting) {
        setTextParams(prev => ({ 
          ...prev, 
          x: Math.round(e.detail.x), 
          y: Math.round(e.detail.y),
          selecting: false 
        }));
      }
    };
    
    window.addEventListener('textposition', handleTextPosition as EventListener);
    return () => window.removeEventListener('textposition', handleTextPosition as EventListener);
  }, [textParams.selecting]);

  if (!selectedTool) return null;

  const renderToolParams = () => {
    switch (selectedTool) {
      case 'Brighten':
        return (
          <input
            type="range"
            min="-100"
            max="100"
            value={params.Brighten.value}
            onChange={(e) => setParams({
              ...params,
              Brighten: { value: parseInt(e.target.value) }
            })}
            className="w-full bg-neutral-800"
          />
        );
      case 'Contrast':
        return (
          <input
            type="range"
            min="0"
            max="300"
            step="10"
            value={params.Contrast.contrast * 100}
            onChange={(e) => setParams({
              ...params,
              Contrast: { contrast: parseInt(e.target.value) / 100 }
            })}
            className="w-full bg-neutral-800"
          />
        );
      case 'Blur':
        return (
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={params.Blur.sigma}
            onChange={(e) => setParams({
              ...params,
              Blur: { sigma: parseFloat(e.target.value) }
            })}
            className="w-full bg-neutral-800"
          />
        );
      default:
        return null;
    }
  };

  const handleApply = () => {
    console.log('Applying transformation:', selectedTool);
    switch (selectedTool) {
      case 'Brighten':
        onTransform(selectedTool, params.Brighten.value);
        break;
      case 'Contrast':
        onTransform(selectedTool, params.Contrast.contrast);
        break;
      case 'Blur':
        onTransform(selectedTool, params.Blur.sigma);
        break;
      default:
        onTransform(selectedTool);
    }
  };

  return (
    <div className="text-white">
      {selectedTool === 'text' ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={textParams.text}
            onChange={(e) => setTextParams({ ...textParams, text: e.target.value })}
            placeholder="Enter text"
            className="bg-neutral-800 px-2 py-1 rounded"
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={textParams.x}
                onChange={(e) => setTextParams({ ...textParams, x: Number(e.target.value) })}
                placeholder="X"
                className="bg-neutral-800 px-2 py-1 rounded w-full"
              />
              <input
                type="number"
                value={textParams.y}
                onChange={(e) => setTextParams({ ...textParams, y: Number(e.target.value) })}
                placeholder="Y"
                className="bg-neutral-800 px-2 py-1 rounded w-full"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setTextParams(prev => ({ ...prev, selecting: !prev.selecting }));
              if (!textParams.selecting) {
                onSelectionChange(null);
              }
            }}
            className={`px-3 py-1 rounded ${
              textParams.selecting ? 'bg-blue-600' : 'bg-neutral-800'
            }`}
          >
            {textParams.selecting ? 'Cancel Selection' : 'Select Position'}
          </button>
          <input
            type="number"
            value={textParams.size}
            onChange={(e) => setTextParams({ ...textParams, size: Number(e.target.value) })}
            placeholder="Size"
            className="bg-neutral-800 px-2 py-1 rounded"
          />
          <input
            type="color"
            value={textParams.color}
            onChange={(e) => setTextParams({ ...textParams, color: e.target.value })}
            className="w-full h-8"
          />
          <button
            onClick={() => {
              onTextOverlay({ 
                TextOverlay: { 
                  ...textParams, 
                  color: textParams.color.replace('#', '') 
                } 
              });
              setTextParams(prev => ({ ...prev, selecting: false }));
            }}
            className="bg-neutral-800 px-3 py-1 rounded"
          >
            Add Text
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {renderToolParams()}
          
          {selection && (
            <div className="mt-2">
              <div className="text-sm text-neutral-400 mb-1">Selection</div>
              <div className="text-xs text-neutral-500">
                {Math.round(selection.x)}, {Math.round(selection.y)}, {Math.round(selection.width)} x {Math.round(selection.height)}
              </div>
              <button
                onClick={() => onSelectionChange(null)}
                className="mt-2 text-sm text-red-400 hover:text-red-300"
              >
                Clear Selection
              </button>
            </div>
          )}

          <button
            onClick={handleApply}
            className="bg-neutral-800 px-3 py-1 rounded"
          >
            Apply {selectedTool}
          </button>
        </div>
      )}
    </div>
  );
} 