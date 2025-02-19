import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration - 300);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div 
      className={`fixed bottom-2 w-56 right-4 bg-neutral-900 text-white px-4 py-2 rounded shadow-lg border border-neutral-700 
        transition-all duration-300 transform 
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <p className="text-sm pointer-events-none">{message}</p>
    </div>
  );
} 