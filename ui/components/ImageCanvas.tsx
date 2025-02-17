/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, useCallback } from 'react';
import { SelectionRect } from './SelectionRect';
import { Rulers } from './Rulers';
import { Scan } from 'lucide-react';

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
  activeTab: number;
  tabs: { name: string; imageUrl: string | null; zoom: number; pan: { x: number; y: number }; isNew?: boolean }[];
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
  selectedTool,
  activeTab,
  tabs
}: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [hasInitiallyFit, setHasInitiallyFit] = useState(false);

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
      const newZoom = Math.min(Math.max(zoom * (1 + delta), 0.1), 10);
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

  const fitToBounds = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;
    
    const container = containerRef.current;
    const image = imageRef.current;
    
    const containerAspect = container.clientWidth / container.clientHeight;
    const imageAspect = image.naturalWidth / image.naturalHeight;
    
    let newZoom;
    if (containerAspect > imageAspect) {
      newZoom = Math.min((container.clientHeight * 0.9) / image.naturalHeight, 10);
    } else {
      newZoom = Math.min((container.clientWidth * 0.9) / image.naturalWidth, 10);
    }
    
    onZoomChange(newZoom);
    onPanChange({ x: 0, y: 0 });
  }, [onZoomChange, onPanChange]);

  useEffect(() => {
    if (imageUrl && (!hasInitiallyFit || (tabs?.[activeTab]?.isNew))) {
      fitToBounds();
      setHasInitiallyFit(true);
    }
  }, [imageUrl, hasInitiallyFit, fitToBounds, activeTab, tabs]);

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
      {imageUrl && !isLoading && (
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
              data-tab={activeTab}
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
            {(selectedTool === 'selection' || selectedTool === 'text') && (
              <SelectionRect 
                selection={selection} 
                onSelectionChange={(newSelection) => {
                  if (selectedTool === 'text' && newSelection) {
                    onSelectionChange(null);
                    const event = new CustomEvent('textposition', { 
                      detail: { x: newSelection.x, y: newSelection.y }
                    });
                    window.dispatchEvent(event);
                  } else {
                    onSelectionChange(newSelection);
                  }
                }}
                imageRef={imageRef as React.RefObject<HTMLImageElement>}
                zoom={zoom}
                singlePoint={selectedTool === 'text'}
              />
            )}
          </div>
          
          <div className="absolute bottom-2 right-2 bg-neutral-900 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
            <span>{Math.round(zoom * 100)}% | {imageDimensions.width}x{imageDimensions.height}px</span>
            <button
              onClick={fitToBounds}
              className="p-1 hover:bg-neutral-800 rounded"
              title="Reset zoom"
            >
              <Scan size={14} />
            </button>
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