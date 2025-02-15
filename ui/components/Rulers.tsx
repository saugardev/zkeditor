interface RulersProps {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
}

export function Rulers({ width, height, zoom, pan }: RulersProps) {
  const rulerSize = 24;
  
  const getStepSize = (zoom: number) => {
    if (zoom >= 1) return { major: 100, minor: 10 };
    if (zoom >= 0.5) return { major: 200, minor: 20 };
    if (zoom >= 0.25) return { major: 500, minor: 50 };
    return { major: 1000, minor: 100 };
  };

  const { major: step, minor: minorStep } = getStepSize(zoom);
  const scaledMinorStep = minorStep * zoom;

  const visibleRange = {
    x: {
      start: Math.floor(-pan.x / zoom / step) * step,
      end: Math.ceil((width / zoom - pan.x / zoom) / step) * step
    },
    y: {
      start: Math.floor(-pan.y / zoom / step) * step,
      end: Math.ceil((height / zoom - pan.y / zoom) / step) * step
    }
  };

  return (
    <>
      <div 
        className="absolute bottom-0 left-0 h-6 bg-neutral-900 z-10"
        style={{ 
          left: rulerSize, 
          right: 0
        }}
      >
        <svg width="100%" height={rulerSize} className="text-neutral-400">
          {Array.from({ length: Math.ceil((visibleRange.x.end - visibleRange.x.start) / step) }).map((_, i) => {
            const x = (visibleRange.x.start + i * step) * zoom + pan.x;
            return (
              <g key={i} transform={`translate(${x}, 0)`}>
                <line
                  x1={0}
                  y1={rulerSize}
                  x2={0}
                  y2={rulerSize - 12}
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <text
                  x={2}
                  y={rulerSize - 4}
                  fontSize={`12px`}
                  fill="currentColor"
                >
                  {visibleRange.x.start + i * step}
                </text>
                {zoom >= 0.25 && Array.from({ length: (step / minorStep) - 1 }).map((_, j) => (
                  <line
                    key={j}
                    x1={(j + 1) * scaledMinorStep}
                    y1={rulerSize}
                    x2={(j + 1) * scaledMinorStep}
                    y2={rulerSize - 6}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div 
        className="absolute top-0 left-0 w-6 bg-neutral-900 z-10"
        style={{ 
          top: rulerSize, 
          bottom: 0
        }}
      >
        <svg height="100%" width={rulerSize} className="text-neutral-400">
          {Array.from({ length: Math.ceil((visibleRange.y.end - visibleRange.y.start) / step) }).map((_, i) => {
            const y = (visibleRange.y.start + i * step) * zoom + pan.y;
            return (
              <g key={i} transform={`translate(0, ${y})`}>
                <line
                  x1={rulerSize}
                  y1={0}
                  x2={rulerSize - 12}
                  y2={0}
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <text
                  x={rulerSize - 4}
                  y={12}
                  fontSize={`12px`}
                  fill="currentColor"
                  transform={`rotate(-90 ${rulerSize - 4} 12)`}
                >
                  {visibleRange.y.start + i * step}
                </text>
                {zoom >= 0.25 && Array.from({ length: (step / minorStep) - 1 }).map((_, j) => (
                  <line
                    key={j}
                    x1={rulerSize}
                    y1={(j + 1) * scaledMinorStep}
                    x2={rulerSize - 6}
                    y2={(j + 1) * scaledMinorStep}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="absolute top-0 left-0 w-6 h-6 bg-neutral-900 z-20" />
    </>
  );
} 