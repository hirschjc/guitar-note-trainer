import { FretPosition } from '../types';

interface FretboardDisplayProps {
  fretWindow: { start: number; end: number };
  showStringLabels: boolean;
  highlightedPositions: FretPosition[];
  onFretTap: (position: FretPosition) => void;
  disabled?: boolean;
}

// String labels top-to-bottom: string 1 (E4) at top, string 6 (E2) at bottom
const STRING_LABELS: Record<number, string> = {
  1: 'E4',
  2: 'B3',
  3: 'G3',
  4: 'D3',
  5: 'A2',
  6: 'E2',
};

// Standard fret marker positions
const FRET_MARKERS = new Set([3, 5, 7, 9, 12]);

export function FretboardDisplay({
  fretWindow,
  showStringLabels,
  highlightedPositions,
  onFretTap,
  disabled = false,
}: FretboardDisplayProps) {
  const { start, end } = fretWindow;
  const fretCount = end - start + 1;
  const stringCount = 6;

  // SVG layout constants
  const labelWidth = showStringLabels ? 36 : 8;
  const cellW = 60;
  const cellH = 44;
  const nutWidth = start === 0 ? 6 : 2;
  const boardWidth = labelWidth + nutWidth + fretCount * cellW;
  const boardHeight = stringCount * cellH + 20; // +20 for fret marker dots below

  function getHighlight(str: number, fret: number): 'correct' | 'incorrect' | 'reveal' | null {
    const found = highlightedPositions.find((p) => p.string === str && p.fret === fret);
    return found?.highlight ?? null;
  }

  function highlightColor(h: 'correct' | 'incorrect' | 'reveal'): string {
    if (h === 'correct' || h === 'reveal') return '#22c55e'; // green-500
    return '#ef4444'; // red-500
  }

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', touchAction: 'manipulation' }}
        aria-label="Guitar fretboard"
      >
        {/* Background */}
        <rect x={0} y={0} width={boardWidth} height={boardHeight} fill="#1c1008" rx={6} />

        {/* Nut / left border */}
        <rect
          x={labelWidth}
          y={0}
          width={nutWidth}
          height={stringCount * cellH}
          fill={start === 0 ? '#e5e7eb' : '#6b7280'}
        />

        {/* Fret lines */}
        {Array.from({ length: fretCount + 1 }, (_, i) => {
          const x = labelWidth + nutWidth + i * cellW;
          return (
            <line
              key={`fret-${i}`}
              x1={x} y1={0}
              x2={x} y2={stringCount * cellH}
              stroke="#6b7280"
              strokeWidth={1.5}
            />
          );
        })}

        {/* String lines */}
        {Array.from({ length: stringCount }, (_, i) => {
          const str = i + 1; // string 1 at top
          const y = i * cellH + cellH / 2;
          // Thicker strings for lower-pitched strings
          const thickness = 0.8 + (str - 1) * 0.35;
          return (
            <line
              key={`string-${str}`}
              x1={labelWidth + nutWidth} y1={y}
              x2={boardWidth} y2={y}
              stroke="#d4a853"
              strokeWidth={thickness}
            />
          );
        })}

        {/* String labels */}
        {showStringLabels &&
          Array.from({ length: stringCount }, (_, i) => {
            const str = i + 1;
            const y = i * cellH + cellH / 2;
            return (
              <text
                key={`label-${str}`}
                x={labelWidth - 4}
                y={y + 5}
                textAnchor="end"
                fontSize={11}
                fill="#9ca3af"
                fontFamily="monospace"
              >
                {STRING_LABELS[str]}
              </text>
            );
          })}

        {/* Fret marker dots */}
        {Array.from({ length: fretCount }, (_, i) => {
          const fret = start + i;
          if (!FRET_MARKERS.has(fret)) return null;
          const cx = labelWidth + nutWidth + i * cellW + cellW / 2;
          const cy = stringCount * cellH + 10;
          return (
            <circle
              key={`marker-${fret}`}
              cx={cx} cy={cy}
              r={4}
              fill="#6b7280"
            />
          );
        })}

        {/* Fret number labels */}
        {Array.from({ length: fretCount }, (_, i) => {
          const fret = start + i;
          if (!FRET_MARKERS.has(fret)) return null;
          const cx = labelWidth + nutWidth + i * cellW + cellW / 2;
          const cy = stringCount * cellH + 18;
          return (
            <text
              key={`fret-num-${fret}`}
              x={cx} y={cy}
              textAnchor="middle"
              fontSize={9}
              fill="#6b7280"
              fontFamily="monospace"
            >
              {fret}
            </text>
          );
        })}

        {/* Tap targets + highlights */}
        {Array.from({ length: stringCount }, (_, si) => {
          const str = si + 1;
          return Array.from({ length: fretCount }, (_, fi) => {
            const fret = start + fi;
            const x = labelWidth + nutWidth + fi * cellW;
            const y = si * cellH;
            const highlight = getHighlight(str, fret);

            return (
              <g key={`cell-${str}-${fret}`}>
                {/* Highlight circle */}
                {highlight && (
                  <circle
                    cx={x + cellW / 2}
                    cy={y + cellH / 2}
                    r={16}
                    fill={highlightColor(highlight)}
                    opacity={0.85}
                  />
                )}
                {/* Invisible tap target — minimum 44×44 */}
                <rect
                  x={x}
                  y={y}
                  width={cellW}
                  height={cellH}
                  fill="transparent"
                  style={{ cursor: disabled ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (!disabled) onFretTap({ string: str, fret });
                  }}
                  onTouchEnd={(e) => {
                    if (!disabled) {
                      e.preventDefault();
                      onFretTap({ string: str, fret });
                    }
                  }}
                  aria-label={`String ${str}, fret ${fret}`}
                  role="button"
                />
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}

export default FretboardDisplay;
