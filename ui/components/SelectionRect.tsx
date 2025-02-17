import React, { useState } from 'react';

interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SelectionRectProps {
  selection: RegionSelection | null;
  onSelectionChange: (selection: RegionSelection) => void;
  imageRef: React.RefObject<HTMLImageElement>;
  zoom: number;
  singlePoint?: boolean;
}

export function SelectionRect({ selection, onSelectionChange, imageRef, zoom, singlePoint }: SelectionRectProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setStartPos({ x, y });
    setIsDragging(true);
    
    if (singlePoint) {
      onSelectionChange({ x, y, width: 1, height: 1 });
      setIsDragging(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current || singlePoint) return;
    const rect = imageRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / zoom;
    const currentY = (e.clientY - rect.top) / zoom;

    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    const x = Math.min(currentX, startPos.x);
    const y = Math.min(currentY, startPos.y);

    onSelectionChange({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {selection && (
        <div
          className="absolute border border-blue-500 bg-blue-500/20"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height
          }}
        />
      )}
    </div>
  );
} 