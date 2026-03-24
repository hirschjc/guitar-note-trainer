import { Lesson } from '../types';

export const MASTERY_THRESHOLD = 80;
export const MASTERY_REQUIRED_SESSIONS = 5; // must score ≥ 80% this many times to unlock next lesson

export const CHROMATIC_NOTES = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'] as const;

export const LESSONS: Lesson[] = [
  // ─── Level 1: Middle C and C major scale (C4–C5, natural notes only) ───────

  {
    id: 'level1-lesson1',
    level: 1,
    order: 1,
    learningObjective: 'Identify the first three notes of the C major scale: C4, D4, and E4',
    noteSet: ['C4', 'D4', 'E4'],
    octaveRange: [4, 4],
    sequenceLength: { min: 6, max: 10 },
  },
  {
    id: 'level1-lesson2',
    level: 1,
    order: 2,
    learningObjective: 'Identify the first five notes of the C major scale: C4 through G4',
    noteSet: ['C4', 'D4', 'E4', 'F4', 'G4'],
    octaveRange: [4, 4],
    sequenceLength: { min: 8, max: 12 },
  },
  {
    id: 'level1-lesson3',
    level: 1,
    order: 3,
    learningObjective: 'Identify all eight notes of the C major scale from C4 to C5',
    noteSet: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    octaveRange: [4, 5],
    sequenceLength: { min: 8, max: 16 },
  },

  // ─── Level 2: Extended range — three octaves (C3–C6, all natural notes) ────

  {
    id: 'level2-lesson1',
    level: 2,
    order: 1,
    learningObjective: 'Extend the C major scale down to the third octave (C3–C4)',
    noteSet: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
    octaveRange: [3, 4],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level2-lesson2',
    level: 2,
    order: 2,
    learningObjective: 'Extend the C major scale up to the sixth octave (C5–C6)',
    noteSet: ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'],
    octaveRange: [5, 6],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level2-lesson3',
    level: 2,
    order: 3,
    learningObjective: 'Identify natural notes across three full octaves (C3–C6)',
    noteSet: [
      'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
      'C6',
    ],
    octaveRange: [3, 6],
    sequenceLength: { min: 10, max: 16 },
  },

  // ─── Level 3: Common intervals (thirds, fifths, octaves within C major, C3–C5) ─

  {
    id: 'level3-lesson1',
    level: 3,
    order: 1,
    learningObjective: 'Identify notes a third apart within C major (C3–C5)',
    noteSet: ['C4', 'E4', 'G4', 'B4', 'D5', 'F4', 'A4', 'C5'],
    octaveRange: [3, 5],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level3-lesson2',
    level: 3,
    order: 2,
    learningObjective: 'Identify notes a fifth apart within C major (C3–C5)',
    noteSet: ['C3', 'G3', 'D4', 'A4', 'E4', 'B4', 'F4', 'C5'],
    octaveRange: [3, 5],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level3-lesson3',
    level: 3,
    order: 3,
    learningObjective: 'Identify notes an octave apart within C major (C3–C5)',
    noteSet: ['C3', 'C4', 'C5', 'G3', 'G4', 'E3', 'E4', 'A3', 'A4'],
    octaveRange: [3, 5],
    sequenceLength: { min: 8, max: 16 },
  },

  // ─── Level 4: Basic chords — C, G, D, Am, Em (C3–C5) ───────────────────────

  {
    id: 'level4-lesson1',
    level: 4,
    order: 1,
    learningObjective: 'Identify notes in the C major and G major chords (C3–C5)',
    noteSet: ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'B3', 'D4', 'G4', 'B4'],
    octaveRange: [3, 5],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level4-lesson2',
    level: 4,
    order: 2,
    learningObjective: 'Identify notes in the D major, Am, and Em chords (C3–C5)',
    noteSet: ['D3', 'F#3', 'A3', 'D4', 'F#4', 'A4', 'E3', 'G3', 'B3', 'E4', 'G4', 'B4', 'A3', 'C4', 'E4'],
    octaveRange: [3, 5],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level4-lesson3',
    level: 4,
    order: 3,
    learningObjective: 'Identify notes across all five basic chords: C, G, D, Am, Em (C3–C5)',
    noteSet: [
      'C3', 'E3', 'G3', 'C4', 'E4', 'G4',
      'G3', 'B3', 'D4', 'G4', 'B4',
      'D3', 'F#3', 'A3', 'D4', 'F#4', 'A4',
      'A3', 'C4', 'E4', 'A4',
      'E3', 'G3', 'B3', 'E4', 'G4', 'B4',
    ],
    octaveRange: [3, 5],
    sequenceLength: { min: 10, max: 16 },
  },

  // ─── Level 5: Common keys — G, D, F, Bb major (C3–C5, includes accidentals) ─

  {
    id: 'level5-lesson1',
    level: 5,
    order: 1,
    learningObjective: 'Identify notes in G major and D major scales (C3–C5)',
    noteSet: [
      'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4',
      'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5',
    ],
    octaveRange: [3, 5],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level5-lesson2',
    level: 5,
    order: 2,
    learningObjective: 'Identify notes in F major and Bb major scales (C3–C5)',
    noteSet: [
      'F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4',
      'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4',
    ],
    octaveRange: [3, 5],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level5-lesson3',
    level: 5,
    order: 3,
    learningObjective: 'Identify notes across G, D, F, and Bb major scales with accidentals (C3–C5)',
    noteSet: [
      'C3', 'D3', 'E3', 'F3', 'F#3', 'G3', 'A3', 'Bb3', 'B3',
      'C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'Bb4', 'B4',
      'C5', 'C#5', 'D5',
    ],
    octaveRange: [3, 5],
    sequenceLength: { min: 10, max: 16 },
  },

  // ─── Level 6: Complex chords and extended harmony (C3–C6, all 12 chromatic) ─

  {
    id: 'level6-lesson1',
    level: 6,
    order: 1,
    learningObjective: 'Identify all 12 chromatic pitch classes in the fourth octave (C4–B4)',
    noteSet: [
      'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4',
      'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
    ],
    octaveRange: [4, 4],
    sequenceLength: { min: 8, max: 14 },
  },
  {
    id: 'level6-lesson2',
    level: 6,
    order: 2,
    learningObjective: 'Identify chromatic notes across two octaves (C3–C5)',
    noteSet: [
      'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
      'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
      'C5',
    ],
    octaveRange: [3, 5],
    sequenceLength: { min: 10, max: 16 },
  },
  {
    id: 'level6-lesson3',
    level: 6,
    order: 3,
    learningObjective: 'Master all 12 chromatic notes across three octaves (C3–C6)',
    noteSet: [
      'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
      'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
      'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
      'C6',
    ],
    octaveRange: [3, 6],
    sequenceLength: { min: 12, max: 16 },
  },
  {
    id: 'level6-lesson4',
    level: 6,
    order: 4,
    learningObjective: 'Extended harmony: seventh chords and chromatic passing tones (C3–C6)',
    noteSet: [
      'C4', 'E4', 'G4', 'B4',       // Cmaj7
      'D4', 'F#4', 'A4', 'C5',      // D7
      'G3', 'B3', 'D4', 'F4',       // G7
      'F4', 'A4', 'C5', 'E5',       // Fmaj7
      'A3', 'C4', 'E4', 'G4',       // Am7
      'E3', 'G#3', 'B3', 'D4',      // E7
      'C#4', 'D#4', 'F#4', 'G#4', 'A#4', // chromatic passing tones
    ],
    octaveRange: [3, 6],
    sequenceLength: { min: 12, max: 16 },
  },
];
