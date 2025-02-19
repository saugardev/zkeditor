import { Transformation } from '@/types/transformations';
import { Undo2 } from 'lucide-react';

interface TransformationHistoryProps {
  transformations: Transformation[];
  onUndo: () => void;
}

export function TransformationHistory({ transformations, onUndo }: TransformationHistoryProps) {
  if (!transformations?.length) {
    return (
      <div className="flex-none h-[50vh] border-neutral-800">
        <div className="px-2 py-3 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-400">History</h3>
        </div>
        <div className="p-2 text-sm text-neutral-500">
          No transformations yet
        </div>
      </div>
    );
  }

  return (
    <div className="flex-none h-[50vh] border-neutral-800">
      <div className="px-2 py-3 border-b border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-400">History</h3>
      </div>
      <div className="overflow-y-auto h-[calc(100%-2.5rem)]">
        {transformations.map((t, i) => (
          <div 
            key={i} 
            className="px-2 py-1.5 text-sm text-neutral-300 border-b border-neutral-800/50 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium">{t.type}</div>
              {t.params && (
                <div className="text-xs text-neutral-500 mt-0.5">
                  {Object.entries(t.params).map(([key, value]) => (
                    <div key={key}>{key}: {value}</div>
                  ))}
                </div>
              )}
            </div>
            <button 
              className="p-1.5 ml-2 flex-none text-xs bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-300 transition-colors"
              onClick={onUndo}
              title="Undo"
            >
              <Undo2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 