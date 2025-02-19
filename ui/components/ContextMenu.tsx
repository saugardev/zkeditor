import { useEffect, useRef } from 'react';
import { 
  Wand2, 
  RotateCw, 
  FlipHorizontal2, 
  SunMedium, 
  Contrast,
  Droplet,
  Type,
  SquareDashed,
  Copy,
  RotateCcw,
  Crop
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
}

const menuItems = [
  { icon: Copy, label: 'Copy', action: 'copy' },
  { icon: RotateCcw, label: 'Undo', action: 'undo' },
  { icon: RotateCw, label: 'Redo', action: 'redo' },
  { type: 'separator', id: 'sep1' },
  { icon: SquareDashed, label: 'Select Region', action: 'selection' },
  { icon: Crop, label: 'Crop', action: 'Crop' },
  { type: 'separator', id: 'sep2' },
  { icon: Wand2, label: 'Grayscale', action: 'Grayscale' },
  { icon: RotateCw, label: 'Rotate', action: 'Rotate90' },
  { icon: FlipHorizontal2, label: 'Flip', action: 'FlipHorizontal' },
  { icon: SunMedium, label: 'Brighten', action: 'Brighten' },
  { icon: Contrast, label: 'Contrast', action: 'Contrast' },
  { icon: Droplet, label: 'Blur', action: 'Blur' },
  { icon: Type, label: 'Add Text', action: 'text' }
];

export function ContextMenu({ x, y, onClose, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [onClose]);

  const handleMenuClick = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    onAction(action);
    if (action === 'copy') {
      showToast('Image copied to clipboard');
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      data-context-menu
      className="fixed bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg py-1 z-50"
      style={{
        left: x,
        top: y,
        minWidth: '200px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item) => (
        'type' in item ? (
          <div key={item.id} className="h-px bg-neutral-700 my-1" />
        ) : (
          <button
            key={item.action}
            onClick={(e) => handleMenuClick(e, item.action)}
            className="w-full px-4 py-2 flex items-center gap-2 hover:bg-neutral-800 text-sm text-neutral-300"
          >
            <item.icon size={16} />
            {item.label}
          </button>
        )
      ))}
    </div>
  );
} 