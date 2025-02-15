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

  // Adjust for the centered image position and ruler offset
  const imageOffset = {
    x: window.innerWidth / 2 - width * zoom / 2 + pan.x - 136,
    y: window.innerHeight / 2 - height * zoom / 2 + pan.y + rulerSize
  };

  const getTickRange = (size: number, step: number, zoom: number) => {
    const totalVisibleSize = window.innerWidth / zoom;
    const minTick = Math.floor(-totalVisibleSize / step);
    const maxTick = Math.ceil((size + totalVisibleSize) / step);
    return Array.from({ length: maxTick - minTick }, (_, i) => i + minTick);
  };

  return (
    <>
      <div 
        className="absolute top-0 left-0 h-6 bg-neutral-900 z-10"
        style={{ 
          right: 0,
          userSelect: 'none'
        }}
      >
        <svg width="100%" height={rulerSize} className="text-neutral-400">
          {getTickRange(width, step, zoom).map((i) => {
            const value = i * step;
            const x = value * zoom + imageOffset.x - rulerSize;
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
                  fontSize="12px"
                  fill="currentColor"
                >
                  {value}
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
        className="absolute -top-9 left-0 w-6 bg-neutral-900 z-10"
        style={{ 
          bottom: 0,
          userSelect: 'none'
        }}
      >
        <svg height="100%" width={rulerSize} className="text-neutral-400">
          {getTickRange(height, step, zoom).map((i) => {
            const value = i * step;
            const y = value * zoom + imageOffset.y - rulerSize;
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
                  fontSize="12px"
                  fill="currentColor"
                  transform={`rotate(-90 ${rulerSize - 4} 12)`}
                >
                  {value}
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

      <div className="absolute top-0 left-0 w-6 bg-neutral-900 z-10 h-6 select-none">
      </div>
    </>
  );
} 