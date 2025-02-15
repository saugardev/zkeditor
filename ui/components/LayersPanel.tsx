export function LayersPanel() {
  return (
    <div className="text-white">
      <h3 className="text-lg font-semibold mb-4">Layers</h3>
      <div className="flex flex-col gap-2">
        <div className="bg-neutral-800 p-2 rounded flex items-center justify-between">
          <span>Background</span>
          <input type="checkbox" checked readOnly />
        </div>
      </div>
    </div>
  );
} 