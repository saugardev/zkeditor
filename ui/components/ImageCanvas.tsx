/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { SelectionRect } from './SelectionRect';
import { Rulers } from './Rulers';

interface ImageCanvasProps {
  imageUrl: string | null;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  selection: { x: number; y: number; width: number; height: number } | null;
  onSelectionChange: (selection: { x: number; y: number; width: number; height: number } | null) => void;
  isLoading: boolean;
  selectedTool: string | null;
}

export function ImageCanvas({
  imageUrl,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  selection,
  onSelectionChange,
  isLoading,
  selectedTool
}: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  }, [imageUrl]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomFactor = 0.03;
      const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
      const newZoom = Math.min(Math.max(zoom * (1 + delta), 0.1), 5);
      onZoomChange(newZoom);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'selection') {
      return;
    }
    
    if (e.button === 1 || e.button === 0) {
      setIsDragging(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onPanChange({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', (e) => {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    return () => {
      container.removeEventListener('wheel', (e) => {
        if (e.ctrlKey) e.preventDefault();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${selectedTool === 'selection' ? 'cursor-crosshair' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {imageUrl && (
        <>
          <Rulers
            width={imageDimensions.width}
            height={imageDimensions.height}
            zoom={zoom}
            pan={pan}
          />
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Editor canvas"
              className="max-w-none"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setImageDimensions({
                  width: img.naturalWidth,
                  height: img.naturalHeight
                });
              }}
            />
            <div 
              className="absolute inset-0 -z-10 bg-[#e0e0e0]"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #c0c0c0 25%, transparent 25%),
                  linear-gradient(-45deg, #c0c0c0 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #c0c0c0 75%),
                  linear-gradient(-45deg, transparent 75%, #c0c0c0 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                width: imageDimensions.width,
                height: imageDimensions.height
              }}
            />
            {selectedTool === 'selection' && (
              <SelectionRect 
                selection={selection} 
                onSelectionChange={onSelectionChange} 
                imageRef={imageRef as React.RefObject<HTMLImageElement>}
                zoom={zoom}
              />
            )}
          </div>
          
          <div className="absolute bottom-8 right-2 bg-neutral-900 px-2 py-1 rounded text-white text-sm">
            {Math.round(zoom * 100)}% | {imageDimensions.width}x{imageDimensions.height}px
          </div>
        </>
      )}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white">Processing...</div>
        </div>
      )}
    </div>
  );
} 