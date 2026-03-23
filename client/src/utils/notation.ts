import { NotationObject, NoteWithOctave, Measure, NoteSpec } from '../types';

/**
 * Extracts the pitch class (e.g. "C", "F#", "Bb") from a NoteWithOctave string.
 */
export function getPitchClass(note: NoteWithOctave): string {
  const match = note.match(/^([A-Ga-g][#b]?)/);
  if (!match) throw new Error(`Invalid note format: ${note}`);
  return match[1];
}

/**
 * Extracts the octave number from a NoteWithOctave string.
 */
export function getOctave(note: NoteWithOctave): number {
  const match = note.match(/(\d+)$/);
  if (!match) throw new Error(`Invalid note format: ${note}`);
  return parseInt(match[1], 10);
}

/**
 * Convert a note-with-octave string (e.g. "F#4", "Bb3", "C5") to VexFlow key format.
 * VexFlow uses format like "f#/4", "bb/3", "c/5"
 */
export function noteToVexFlowKey(note: string): string {
  const match = note.match(/^([A-Ga-g][#b]?)(\d+)$/);
  if (!match) throw new Error(`Invalid note format: ${note}`);
  const pitchClass = match[1].toLowerCase();
  const octave = match[2];
  return `${pitchClass}/${octave}`;
}

/**
 * Convert a note-with-octave string to its accidental type for VexFlow.
 * Returns "#" for sharps, "b" for flats, "n" for naturals, or null if none.
 */
export function getNoteAccidental(note: string): '#' | 'b' | 'n' | null {
  const match = note.match(/^[A-Ga-g]([#b]?)/);
  if (!match) return null;
  const acc = match[1];
  if (acc === '#') return '#';
  // 'b' as accidental only when it follows a letter (e.g. "Bb", "Eb") — not standalone 'B'
  if (acc === 'b') return 'b';
  return null;
}

/**
 * Infers NoteSpec accidental from pitch class string.
 */
function inferAccidental(pitchClass: string): NoteSpec['accidental'] {
  if (pitchClass.includes('#')) return 'sharp';
  if (pitchClass.length > 1 && pitchClass.endsWith('b')) return 'flat';
  return undefined;
}

/**
 * Build a NotationObject from a flat array of note-with-octave strings.
 * Used by the sequence generator to create a renderable notation object.
 * All notes are quarter notes by default.
 * Groups notes into measures of `notesPerMeasure` (default 4).
 */
export function buildNotationFromSequence(
  notes: NoteWithOctave[],
  notesPerMeasure = 4
): NotationObject {
  const timeSignature = `${notesPerMeasure}/4`;
  const measures: Measure[] = [];
  let currentMeasureNotes: NoteSpec[] = [];

  for (const note of notes) {
    const pitchClass = getPitchClass(note);
    const accidental = inferAccidental(pitchClass);

    currentMeasureNotes.push({
      pitch: note,
      duration: 'quarter',
      ...(accidental ? { accidental } : {}),
    });

    if (currentMeasureNotes.length === notesPerMeasure) {
      measures.push({ notes: currentMeasureNotes });
      currentMeasureNotes = [];
    }
  }

  // Push any remaining notes as a partial measure
  if (currentMeasureNotes.length > 0) {
    measures.push({ notes: currentMeasureNotes });
  }

  return {
    clef: 'treble',
    timeSignature,
    measures,
  };
}

/**
 * Serialize a NotationObject to a JSON string (pretty-printed).
 */
export function formatNotation(obj: NotationObject): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Parse a JSON string back into a NotationObject.
 * Throws if the input is not valid JSON or doesn't match the expected shape.
 */
export function parseNotation(raw: string): NotationObject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('parseNotation: invalid JSON string');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('clef' in parsed) ||
    !('timeSignature' in parsed) ||
    !('measures' in parsed)
  ) {
    throw new Error(
      'parseNotation: object missing required fields (clef, timeSignature, measures)'
    );
  }

  return parsed as NotationObject;
}
