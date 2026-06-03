import { FretPosition } from '../types';

interface FretboardDisplayProps {
  fretWindow: { start: number; end: number };
  showStringLabels: boolean;
  highlightedPositions: FretPosition[];
  onFretTap: (position: FretPosition) => void;
  disabled?: boolean;
}

// String labels top-to-bottom: string 1 (E5) at top, string 6 (E3) at bottom
// Using guitar octave convention (one octave higher than standard MIDI notation)
const STRING_LABELS: Record<number, string> = {
  1: 'E5',
  2: 'B4',
  3: 'G4',
  4: 'D4',
  5: 'A3',
  6: 'E3',
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
  const stringCount = 6;

  // When the window includes fret 0, separate it into an "open" zone left of the nut
  const hasOpenZone = start === 0;
  const gridStart = hasOpenZone ? 1 : start;
  const gridCount = end - gridStart + 1;

  // SVG layout constants
  const labelWidth = showStringLabels ? 36 : 8;
  const openZoneWidth = hasOpenZone ? 52 : 0;
  const cellW = 60;
  const cellH = 44;
  const nutWidth = 6;
  const gridOriginX = labelWidth + openZoneWidth + nutWidth;
  const boardWidth = gridOriginX + gridCount * cellW;
  const boardHeight = stringCount * cellH + 20; // +20 for fret marker dots below

  function getHighlight(str: number, fret: number): 'correct' | 'incorrect' | 'reveal' | null {
    const found = highlightedPositions.find((p) => p.string === str && p.fret === fret);
    return found?.highlight ?? null;
  }

  function highlightColor(h: 'correct' | 'incorrect' | 'reveal'): string {
    if (h === 'correct' || h === 'reveal') return '#22c55e';
    return '#ef4444';
  }

  const tapProps = (str: number, fret: number) => ({
    fill: 'transparent' as const,
    style: { cursor: disabled ? ('default' as const) : ('pointer' as const) },
    onClick: () => { if (!disabled) onFretTap({ string: str, fret }); },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!disabled) { e.preventDefault(); onFretTap({ string: str, fret }); }
    },
    role: 'button' as const,
  });

  return (
    <div style={{ width: '100%', height: '100%', overflowX: 'hidden' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', touchAction: 'manipulation' }}
        aria-label="Guitar fretboard"
      >
        {/* Background */}
        <rect x={0} y={0} width={boardWidth} height={boardHeight} fill="#1c1008" rx={6} />

        {/* Open zone background */}
        {hasOpenZone && (
          <rect
            x={labelWidth} y={0}
            width={openZoneWidth} height={stringCount * cellH}
            fill="#111827"
          />
        )}

        {/* Nut */}
        <rect
          x={labelWidth + openZoneWidth}
          y={0}
          width={nutWidth}
          height={stringCount * cellH}
          fill="#e5e7eb"
        />

        {/* Fret lines */}
        {Array.from({ length: gridCount + 1 }, (_, i) => {
          const x = gridOriginX + i * cellW;
          return (
            <line
              key={`fret-${i}`}
              x1={x} y1={0} x2={x} y2={stringCount * cellH}
              stroke="#6b7280" strokeWidth={1.5}
            />
          );
        })}

        {/* String lines — extend through open zone and frets */}
        {Array.from({ length: stringCount }, (_, i) => {
          const str = i + 1;
          const y = i * cellH + cellH / 2;
          const thickness = 0.8 + (str - 1) * 0.35;
          return (
            <line
              key={`string-${str}`}
              x1={labelWidth} y1={y} x2={boardWidth} y2={y}
              stroke="#d4a853" strokeWidth={thickness}
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
                x={labelWidth - 4} y={y + 5}
                textAnchor="end" fontSize={11}
                fill="#9ca3af" fontFamily="monospace"
              >
                {STRING_LABELS[str]}
              </text>
            );
          })}

        {/* Open zone: "O" indicators + tap targets */}
        {hasOpenZone && Array.from({ length: stringCount }, (_, si) => {
          const str = si + 1;
          const y = si * cellH;
          const cy = y + cellH / 2;
          const cx = labelWidth + openZoneWidth / 2;
          const hl = getHighlight(str, 0);
          return (
            <g key={`open-${str}`}>
              {hl ? (
                <circle cx={cx} cy={cy} r={16} fill={highlightColor(hl)} opacity={0.85} />
              ) : (
                <circle cx={cx} cy={cy} r={11} fill="none" stroke="#6b7280" strokeWidth={1.5} />
              )}
              <rect
                x={labelWidth} y={y}
                width={openZoneWidth} height={cellH}
                aria-label={`String ${str}, open`}
                {...tapProps(str, 0)}
              />
            </g>
          );
        })}

        {/* "open" label below the open zone */}
        {hasOpenZone && (
          <text
            x={labelWidth + openZoneWidth / 2}
            y={stringCount * cellH + 14}
            textAnchor="middle" fontSize={9}
            fill="#6b7280" fontFamily="monospace"
          >
            open
          </text>
        )}

        {/* Fret marker dots */}
        {Array.from({ length: gridCount }, (_, i) => {
          const fret = gridStart + i;
          if (!FRET_MARKERS.has(fret)) return null;
          const cx = gridOriginX + i * cellW + cellW / 2;
          return (
            <circle key={`marker-${fret}`} cx={cx} cy={stringCount * cellH + 10} r={4} fill="#6b7280" />
          );
        })}

        {/* Fret number labels */}
        {Array.from({ length: gridCount }, (_, i) => {
          const fret = gridStart + i;
          if (!FRET_MARKERS.has(fret)) return null;
          const cx = gridOriginX + i * cellW + cellW / 2;
          return (
            <text
              key={`fret-num-${fret}`}
              x={cx} y={stringCount * cellH + 18}
              textAnchor="middle" fontSize={9}
              fill="#6b7280" fontFamily="monospace"
            >
              {fret}
            </text>
          );
        })}

        {/* Tap targets + highlights for fretted positions */}
        {Array.from({ length: stringCount }, (_, si) => {
          const str = si + 1;
          return Array.from({ length: gridCount }, (_, fi) => {
            const fret = gridStart + fi;
            const x = gridOriginX + fi * cellW;
            const y = si * cellH;
            const hl = getHighlight(str, fret);
            return (
              <g key={`cell-${str}-${fret}`}>
                {hl && (
                  <circle
                    cx={x + cellW / 2} cy={y + cellH / 2}
                    r={16} fill={highlightColor(hl)} opacity={0.85}
                  />
                )}
                <rect
                  x={x} y={y} width={cellW} height={cellH}
                  aria-label={`String ${str}, fret ${fret}`}
                  {...tapProps(str, fret)}
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
