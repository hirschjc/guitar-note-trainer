import React, { useEffect, useState } from 'react';

// The 12 chromatic pitch class buttons — always rendered
const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const ACCIDENTAL_NOTES = ['C#/Db', 'D#/Eb', 'F#/Gb', 'G#/Ab', 'A#/Bb'] as const;
const NATURAL_SIGN = '♮';

export interface NoteButtonGridProps {
  /** Show the ♮ button when the sequence contains natural sign notes */
  showNaturalSign?: boolean;
  onNoteSelect: (note: string) => void;
  /** Set briefly after an incorrect tap to pulse the correct button amber */
  correctNote?: string;
  /** The most recently tapped note (for red/green flash) */
  lastTappedNote?: string;
  /** Was the last tap correct (green) or wrong (red)? */
  lastTapCorrect?: boolean;
  /** All buttons non-interactive, reduced opacity */
  disabled?: boolean;
}

type FlashState = 'correct' | 'incorrect' | null;

export function NoteButtonGrid({
  showNaturalSign = false,
  onNoteSelect,
  correctNote,
  lastTappedNote,
  lastTapCorrect,
  disabled = false,
}: NoteButtonGridProps): React.ReactElement {
  const [flashNote, setFlashNote] = useState<string | null>(null);
  const [flashState, setFlashState] = useState<FlashState>(null);

  // Trigger flash animation when lastTappedNote changes
  useEffect(() => {
    if (!lastTappedNote) return;

    setFlashNote(lastTappedNote);
    setFlashState(lastTapCorrect ? 'correct' : 'incorrect');

    const timer = setTimeout(() => {
      setFlashNote(null);
      setFlashState(null);
    }, 600);

    return () => clearTimeout(timer);
  }, [lastTappedNote, lastTapCorrect]);

  function getButtonClasses(note: string): string {
    const base =
      'min-h-[44px] min-w-[44px] px-2 py-2 rounded-lg text-sm font-medium ' +
      'transition-colors duration-150 select-none focus:outline-none focus:ring-2 focus:ring-offset-1 ';

    const isFlashing = flashNote === note;
    const isCorrectHint = correctNote === note && !isFlashing;

    if (disabled) {
      return base + 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50';
    }

    if (isFlashing && flashState === 'correct') {
      return base + 'bg-green-500 text-white ring-2 ring-green-400 cursor-pointer';
    }

    if (isFlashing && flashState === 'incorrect') {
      return base + 'bg-red-500 text-white ring-2 ring-red-400 cursor-pointer';
    }

    if (isCorrectHint) {
      return base + 'bg-amber-400 text-white ring-2 ring-amber-300 animate-pulse cursor-pointer';
    }

    return base + 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 cursor-pointer focus:ring-gray-400';
  }

  function handleClick(note: string): void {
    if (!disabled) {
      onNoteSelect(note);
    }
  }

  function testId(note: string): string {
    return `note-btn-${note.replace('/', '-')}`;
  }

  return (
    <div className="flex flex-col gap-2 w-full" role="group" aria-label="Note buttons">
      {/* Top row: natural notes */}
      <div className="flex flex-wrap gap-1 justify-center">
        {NATURAL_NOTES.map((note) => (
          <button
            key={note}
            data-testid={testId(note)}
            className={getButtonClasses(note)}
            onClick={() => handleClick(note)}
            disabled={disabled}
            aria-label={`Note ${note}`}
          >
            {note}
          </button>
        ))}
      </div>

      {/* Bottom row: accidentals + optional ♮ */}
      <div className="flex flex-wrap gap-1 justify-center">
        {ACCIDENTAL_NOTES.map((note) => (
          <button
            key={note}
            data-testid={testId(note)}
            className={getButtonClasses(note)}
            onClick={() => handleClick(note)}
            disabled={disabled}
            aria-label={`Note ${note}`}
          >
            {note}
          </button>
        ))}

        {showNaturalSign && (
          <button
            key={NATURAL_SIGN}
            data-testid={testId(NATURAL_SIGN)}
            className={getButtonClasses(NATURAL_SIGN)}
            onClick={() => handleClick(NATURAL_SIGN)}
            disabled={disabled}
            aria-label="Natural sign"
          >
            {NATURAL_SIGN}
          </button>
        )}
      </div>
    </div>
  );
}

export default NoteButtonGrid;
