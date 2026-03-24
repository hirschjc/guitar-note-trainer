import { useRef, useEffect, useState, useCallback } from 'react';
import * as Vex from 'vexflow';
import { NotationObject, NoteDuration } from '../types';

interface StaffDisplayProps {
  notation: NotationObject;
  activeNoteIndex: number; // flat index across all measures
  onRenderComplete?: () => void;
}

// Duration mapping: internal → VexFlow duration string
const DURATION_MAP: Record<NoteDuration, string> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
};

const ACTIVE_NOTE_COLOR = '#f59e0b'; // amber
const DEFAULT_NOTE_COLOR = '#ffffff'; // white — visible on dark background
const STAFF_COLOR = '#e5e7eb'; // light gray for staff lines, clef, time sig

export function StaffDisplay({ notation, activeNoteIndex, onRenderComplete }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const renderNotation = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous render
    container.innerHTML = '';
    setRenderError(false);

    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Vex;

      const containerWidth = container.clientWidth || 600;
      const staveWidth = Math.max(containerWidth - 20, 200);
      const staveHeight = 150;
      const measurePadding = 10;
      const totalHeight = notation.measures.length * staveHeight + 40;

      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(containerWidth, totalHeight);
      const context = renderer.getContext();
      // Set default stroke/fill to light color for dark background
      context.setStrokeStyle(STAFF_COLOR);
      context.setFillStyle(STAFF_COLOR);

      let flatNoteIndex = 0;

      notation.measures.forEach((measure, measureIndex) => {
        const yOffset = measureIndex * staveHeight + 20;
        const stave = new Stave(measurePadding, yOffset, staveWidth - measurePadding * 2);

        // Only add clef and time signature on first measure
        if (measureIndex === 0) {
          stave.addClef(notation.clef);
          stave.addTimeSignature(notation.timeSignature);
        }

        stave.setContext(context).draw();

        const staveNotes = measure.notes.map((noteSpec) => {
          // Convert pitch to VexFlow key format: "F#4" → "f#/4", "Bb3" → "bb/3"
          const pitchMatch = noteSpec.pitch.match(/^([A-Ga-g][#b]?)(\d+)$/);
          const pitchClass = pitchMatch ? pitchMatch[1].toLowerCase() : 'c';
          const octave = pitchMatch ? pitchMatch[2] : '4';
          const vfKey = `${pitchClass}/${octave}`;
          const duration = DURATION_MAP[noteSpec.duration] ?? 'q';

          const staveNote = new StaveNote({
            keys: [vfKey],
            duration,
          });

          // Add accidental modifier if present
          if (noteSpec.accidental === 'sharp') {
            staveNote.addModifier(new Accidental('#'), 0);
          } else if (noteSpec.accidental === 'flat') {
            staveNote.addModifier(new Accidental('b'), 0);
          } else if (noteSpec.accidental === 'natural') {
            staveNote.addModifier(new Accidental('n'), 0);
          }

          // Highlight active note with amber, default black
          const color = flatNoteIndex === activeNoteIndex ? ACTIVE_NOTE_COLOR : DEFAULT_NOTE_COLOR;
          staveNote.setStyle({ fillStyle: color, strokeStyle: color });

          flatNoteIndex++;
          return staveNote;
        });

        if (staveNotes.length > 0) {
          const [beatsStr, beatValueStr] = notation.timeSignature.split('/');
          const voice = new Voice({
            num_beats: parseInt(beatsStr, 10),
            beat_value: parseInt(beatValueStr, 10),
          }).setStrict(false);

          voice.addTickables(staveNotes);
          new Formatter().joinVoices([voice]).format([voice], staveWidth - measurePadding * 2 - 60);
          voice.draw(context, stave);
        }
      });

      setIsLoading(false);
      onRenderComplete?.();

      // Post-process: thicken ledger lines in the rendered SVG
      const svg = container.querySelector('svg');
      if (svg) {
        // VexFlow renders ledger lines as <rect> elements with very small height
        // Target rects that are wider than tall (horizontal lines = ledger lines or staff lines)
        // Ledger lines are outside the main staff area
        const rects = svg.querySelectorAll('rect');
        rects.forEach((rect) => {
          const w = parseFloat(rect.getAttribute('width') ?? '0');
          const h = parseFloat(rect.getAttribute('height') ?? '0');
          // Ledger lines are thin horizontal rects (height < 3, width > 10)
          if (h > 0 && h < 3 && w > 10) {
            // Make them thicker by increasing height and adjusting y
            const currentY = parseFloat(rect.getAttribute('y') ?? '0');
            const newH = Math.max(h, 2);
            rect.setAttribute('height', String(newH));
            rect.setAttribute('y', String(currentY - (newH - h) / 2));
          }
        });
      }
    } catch (err) {
      console.error('StaffDisplay: VexFlow render error', err);
      setRenderError(true);
      setIsLoading(false);
    }
  }, [notation, activeNoteIndex, onRenderComplete]);

  // Re-render on notation/activeNoteIndex changes
  useEffect(() => {
    setIsLoading(true);
    renderNotation();
  }, [renderNotation]);

  // ResizeObserver: re-render when container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      renderNotation();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [renderNotation]);

  if (renderError) {
    return (
      <div
        style={{ width: '100%', padding: '1rem', textAlign: 'center', color: '#6b7280' }}
        data-testid="staff-display-error"
      >
        Couldn&apos;t render notation.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem',
          }}
          data-testid="staff-display-loading"
        >
          Loading notation…
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', visibility: isLoading ? 'hidden' : 'visible', backgroundColor: '#1f2937', borderRadius: '0.5rem', padding: '0.5rem' }}
        className="staff-display-container"
        data-testid="staff-display"
      />
    </div>
  );
}

export default StaffDisplay;
