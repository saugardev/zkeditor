import React, { useState } from 'react';

type TextOverlayProps = {
  onApply: (params: {
    TextOverlay: {
      text: string;
      x: number;
      y: number;
      size: number;
      color: string;
    }
  }) => void;
};

export function TextOverlayControls({ onApply }: TextOverlayProps) {
  const [text, setText] = useState('');
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);
  const [size, setSize] = useState(24);
  const [color, setColor] = useState('#ffffff');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      TextOverlay: {
        text,
        x,
        y,
        size,
        color: color.replace('#', '')
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text"
        className="px-2 py-1 rounded border border-foreground/20"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
          placeholder="X position"
          className="px-2 py-1 rounded border border-foreground/20"
        />
        <input
          type="number"
          value={y}
          onChange={(e) => setY(Number(e.target.value))}
          placeholder="Y position"
          className="px-2 py-1 rounded border border-foreground/20"
        />
      </div>
      <input
        type="number"
        value={size}
        onChange={(e) => setSize(Number(e.target.value))}
        placeholder="Font size"
        className="px-2 py-1 rounded border border-foreground/20"
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-full h-8"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-foreground text-background rounded hover:opacity-90"
      >
        Add Text
      </button>
    </form>
  );
} 