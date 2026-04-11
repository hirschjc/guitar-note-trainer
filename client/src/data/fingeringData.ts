import { FretPosition, FretRegion } from '../types';

/**
 * Standard tuning open-string MIDI values (string 6→1):
 * E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
 */
const OPEN_STRING_MIDI: Record<number, number> = {
  6: 40, // E2
  5: 45, // A2
  4: 50, // D3
  3: 55, // G3
  2: 59, // B3
  1: 64, // E4
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Convert MIDI number to note-with-octave string, e.g. 60 → "C4" */
function midiToNoteId(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

/** Normalize a note ID to use sharps only (e.g. "Bb3" → "A#3", "F#3" stays) */
function normalizeNoteId(noteId: string): string {
  const flatToSharp: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
    'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  };
  const match = noteId.match(/^([A-G]b?)(\d+)$/);
  if (!match) return noteId;
  const [, name, oct] = match;
  const normalized = flatToSharp[name] ?? name;
  return `${normalized}${oct}`;
}

interface NoteFingeringEntry {
  defaultFingering: FretPosition;
  alternateFingerings: FretPosition[];
}

/** Build the complete fingering map for standard tuning, frets 0–12 */
function buildFingeringMap(): Record<string, NoteFingeringEntry> {
  // Collect all (string, fret) → noteId pairs
  const noteToPositions = new Map<string, FretPosition[]>();

  for (let str = 1; str <= 6; str++) {
    const openMidi = OPEN_STRING_MIDI[str];
    for (let fret = 0; fret <= 12; fret++) {
      const midi = openMidi + fret;
      const noteId = midiToNoteId(midi);
      if (!noteToPositions.has(noteId)) {
        noteToPositions.set(noteId, []);
      }
      noteToPositions.get(noteId)!.push({ string: str, fret });
    }
  }

  const map: Record<string, NoteFingeringEntry> = {};

  for (const [noteId, positions] of noteToPositions.entries()) {
    // Sort by fret ascending, then by string descending (higher string number = lower pitch = prefer)
    const sorted = [...positions].sort((a, b) =>
      a.fret !== b.fret ? a.fret - b.fret : b.string - a.string
    );
    const [defaultFingering, ...alternateFingerings] = sorted;
    map[noteId] = { defaultFingering, alternateFingerings };
  }

  return map;
}

const FINGERING_MAP = buildFingeringMap();

/**
 * Returns valid fingerings for a note given phase and optional region constraint.
 * Phase 'default': only the default fingering.
 * Phase 'alternate': all fingerings within the region (or all if no region).
 */
export function getValidFingerings(
  noteId: string,
  phase: 'default' | 'alternate',
  regionConstraint?: FretRegion
): FretPosition[] {
  const normalized = normalizeNoteId(noteId);
  const entry = FINGERING_MAP[normalized];
  if (!entry) return [];

  if (phase === 'default') {
    return [entry.defaultFingering];
  }

  // alternate: all fingerings, optionally filtered by region
  const all = [entry.defaultFingering, ...entry.alternateFingerings];
  if (!regionConstraint) return all;
  return all.filter(
    (p) => p.fret >= regionConstraint.minFret && p.fret <= regionConstraint.maxFret
  );
}

/**
 * Returns true if the given position is a valid fingering for the note.
 */
export function isValidFingering(
  noteId: string,
  position: FretPosition,
  phase: 'default' | 'alternate',
  regionConstraint?: FretRegion
): boolean {
  const valid = getValidFingerings(noteId, phase, regionConstraint);
  return valid.some((p) => p.string === position.string && p.fret === position.fret);
}

/**
 * Returns true if string labels should be shown for the given lesson level.
 * Labels are shown for levels below the threshold (default: 4).
 */
export function shouldShowStringLabels(lessonLevel: number, threshold = 4): boolean {
  return lessonLevel < threshold;
}

export { FINGERING_MAP };
