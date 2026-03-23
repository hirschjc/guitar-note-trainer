// The 12 chromatic pitch classes (always shown as buttons)
export type ChromaticNote = 'C' | 'C#/Db' | 'D' | 'D#/Eb' | 'E' | 'F' | 'F#/Gb' | 'G' | 'G#/Ab' | 'A' | 'A#/Bb' | 'B';

// A note with octave, e.g. "C4", "F#5", "Bb3"
export type NoteWithOctave = string;

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth';
export type Accidental = 'sharp' | 'flat' | 'natural';

export interface NoteSpec {
  pitch: NoteWithOctave;   // e.g. "C4", "F#5"
  duration: NoteDuration;
  accidental?: Accidental;
}

export interface Measure {
  notes: NoteSpec[];
}

export interface NotationObject {
  clef: 'treble';
  timeSignature: string;  // e.g. "4/4"
  measures: Measure[];
}

export interface Lesson {
  id: string;             // e.g. "level1-lesson1"
  level: number;          // 1–6
  order: number;          // position within level
  learningObjective: string;
  noteSet: NoteWithOctave[];  // notes this lesson draws from
  octaveRange: [number, number];
  sequenceLength: { min: number; max: number };
}

export interface SessionResult {
  id: string;             // UUID, generated client-side
  deviceId: string;
  lessonId: string;
  attemptedAt: string;    // ISO 8601
  correctCount: number;
  incorrectCount: number;
  totalTimeMs: number;
  score: number;          // 0–100
  synced: boolean;
}

export interface LessonProgress {
  deviceId: string;
  lessonId: string;
  bestScore: number;
  attemptCount: number;
  isUnlocked: boolean;
}
