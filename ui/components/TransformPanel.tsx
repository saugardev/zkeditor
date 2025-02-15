/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';

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
}

export function TransformPanel({ selectedTool, onTransform, onTextOverlay }: TransformPanelProps) {
  const [textParams, setTextParams] = useState({
    text: '',
    x: 10,
    y: 10,
    size: 24,
    color: '#ffffff'
  });

  if (!selectedTool) return null;

  return (
    <div className="text-white">
      <h3 className="text-lg font-semibold mb-4">Adjustments</h3>
      
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
            <input
              type="number"
              value={textParams.x}
              onChange={(e) => setTextParams({ ...textParams, x: Number(e.target.value) })}
              placeholder="X"
              className="bg-neutral-800 px-2 py-1 rounded"
            />
            <input
              type="number"
              value={textParams.y}
              onChange={(e) => setTextParams({ ...textParams, y: Number(e.target.value) })}
              placeholder="Y"
              className="bg-neutral-800 px-2 py-1 rounded"
            />
          </div>
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
            onClick={() => onTextOverlay({ TextOverlay: { ...textParams, color: textParams.color.replace('#', '') } })}
            className="bg-blue-500 px-3 py-1 rounded"
          >
            Add Text
          </button>
        </div>
      ) : (
        <button
          onClick={() => onTransform(selectedTool)}
          className="bg-blue-500 px-3 py-1 rounded"
        >
          Apply {selectedTool}
        </button>
      )}
    </div>
  );
} 