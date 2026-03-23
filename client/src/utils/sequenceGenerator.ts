import { NoteWithOctave } from '../types';

/**
 * Generates a randomized sequence of notes from the given note set.
 * Enforces: no note appears more than twice consecutively.
 * Length is randomly chosen between min and max (inclusive).
 *
 * Edge case: if noteSet has only 1 note, any repetition is allowed.
 */
export function generateSequence(
  noteSet: NoteWithOctave[],
  length: number
): NoteWithOctave[] {
  if (noteSet.length === 0) {
    return [];
  }

  // Single-note edge case — allow any repetition
  if (noteSet.length === 1) {
    return Array(length).fill(noteSet[0]);
  }

  const sequence: NoteWithOctave[] = [];

  for (let i = 0; i < length; i++) {
    let candidate: NoteWithOctave;
    let attempts = 0;
    const maxAttempts = noteSet.length * 10;

    do {
      candidate = noteSet[Math.floor(Math.random() * noteSet.length)];
      attempts++;

      // Avoid 3+ consecutive identical notes:
      // reject if the last two notes are the same as the candidate
      const wouldCreateTriple =
        sequence.length >= 2 &&
        sequence[sequence.length - 1] === candidate &&
        sequence[sequence.length - 2] === candidate;

      if (!wouldCreateTriple) {
        break;
      }
    } while (attempts < maxAttempts);

    sequence.push(candidate);
  }

  return sequence;
}

/**
 * Returns a random integer between min and max (inclusive).
 */
export function randomSequenceLength(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
