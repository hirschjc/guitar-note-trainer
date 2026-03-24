import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LESSONS } from '../data/lessons';
import { generateSequence, randomSequenceLength } from '../utils/sequenceGenerator';
import { buildNotationFromSequence } from '../utils/notation';
import { calculateMasteryScore } from '../utils/mastery';
import { audioEngine } from '../utils/audioEngine';
import { progressTracker } from '../utils/progressTracker';
import { StaffDisplay } from '../components/StaffDisplay';
import { NoteButtonGrid } from '../components/NoteButtonGrid';
import type { NotationObject } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPitchClassFromNote(noteWithOctave: string): string {
  const match = noteWithOctave.match(/^([A-Ga-g][#b]?)/);
  return match ? match[1] : noteWithOctave;
}

function getOctaveFromNote(noteWithOctave: string): number {
  const match = noteWithOctave.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 4;
}

function noteMatchesButton(noteWithOctave: string, buttonLabel: string): boolean {
  const pitchClass = getPitchClassFromNote(noteWithOctave);
  const parts = buttonLabel.split('/');
  return parts.some((p) => p.toLowerCase() === pitchClass.toLowerCase());
}

/** Find the button label that matches a given note-with-octave */
function getCorrectButtonLabel(noteWithOctave: string): string {
  const pitchClass = getPitchClassFromNote(noteWithOctave);
  // Check accidentals first (enharmonic pairs)
  const accidentalButtons = ['C#/Db', 'D#/Eb', 'F#/Gb', 'G#/Ab', 'A#/Bb'];
  for (const btn of accidentalButtons) {
    const parts = btn.split('/');
    if (parts.some((p) => p.toLowerCase() === pitchClass.toLowerCase())) {
      return btn;
    }
  }
  // Natural notes
  return pitchClass.charAt(0).toUpperCase() + pitchClass.slice(1);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type GameState = 'playing' | 'sequence_complete' | 'level_complete';

// ─── Component ───────────────────────────────────────────────────────────────

export function PracticeScreen() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Lesson config
  const lesson = LESSONS.find((l) => l.id === lessonId);

  // Game state
  const [sequence, setSequence] = useState<string[]>([]);
  const [notation, setNotation] = useState<NotationObject | null>(null);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [currentNoteHadError, setCurrentNoteHadError] = useState(false); // tracks if current note was missed
  const [startTime, setStartTime] = useState<number>(0);
  const [lastTappedNote, setLastTappedNote] = useState<string | null>(null);
  const [lastTapCorrect, setLastTapCorrect] = useState<boolean | null>(null);
  const [correctNote, setCorrectNote] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Hint timer ref
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correctNoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Init / redirect ────────────────────────────────────────────────────

  useEffect(() => {
    if (!lesson) {
      navigate('/');
      return;
    }
    startNewSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);

  // ─── Hint timer ─────────────────────────────────────────────────────────

  const resetHintTimer = useCallback(
    (pitchClass: string, octave: number) => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => {
        void audioEngine.playHint(pitchClass, octave);
      }, 5000);
    },
    []
  );

  // Reset hint timer whenever active note changes
  useEffect(() => {
    if (gameState !== 'playing' || sequence.length === 0) return;
    const activeNote = sequence[activeNoteIndex];
    if (!activeNote) return;
    const pitchClass = getPitchClassFromNote(activeNote);
    const octave = getOctaveFromNote(activeNote);
    resetHintTimer(pitchClass, octave);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [activeNoteIndex, sequence, gameState, resetHintTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (correctNoteTimerRef.current) clearTimeout(correctNoteTimerRef.current);
    };
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────

  function startNewSequence() {
    if (!lesson) return;
    const len = randomSequenceLength(lesson.sequenceLength.min, lesson.sequenceLength.max);
    const seq = generateSequence(lesson.noteSet, len);
    const notationObj = buildNotationFromSequence(seq);
    setSequence(seq);
    setNotation(notationObj);
    setActiveNoteIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setCurrentNoteHadError(false);
    setStartTime(Date.now());
    setLastTappedNote(null);
    setLastTapCorrect(null);
    setCorrectNote(null);
    setGameState('playing');
  }

  function isLastLessonInLevel(): boolean {
    if (!lesson) return false;
    const levelLessons = LESSONS.filter((l) => l.level === lesson.level);
    const maxOrder = Math.max(...levelLessons.map((l) => l.order));
    return lesson.order === maxOrder;
  }

  // ─── Note tap handler ───────────────────────────────────────────────────

  function handleNoteSelect(buttonLabel: string) {
    if (gameState !== 'playing' || sequence.length === 0) return;

    // Unlock audio context on first user gesture (browser autoplay policy)
    audioEngine.resume();

    const activeNote = sequence[activeNoteIndex];
    if (!activeNote) return;

    const pitchClass = getPitchClassFromNote(activeNote);
    const octave = getOctaveFromNote(activeNote);
    const isCorrect = noteMatchesButton(activeNote, buttonLabel);

    setLastTappedNote(buttonLabel);
    setLastTapCorrect(isCorrect);

    if (isCorrect) {
      // Clear hint timer
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);

      void audioEngine.playNote(pitchClass, octave);

      // Only count as correct toward mastery if this note wasn't previously missed
      const newCorrectCount = currentNoteHadError ? correctCount : correctCount + 1;
      const newIndex = activeNoteIndex + 1;

      setCorrectCount(newCorrectCount);
      setActiveNoteIndex(newIndex);
      setCurrentNoteHadError(false);

      if (newIndex >= sequence.length) {
        // Sequence complete
        const totalTimeMs = Date.now() - startTime;
        const score = calculateMasteryScore(newCorrectCount, incorrectCount, totalTimeMs);
        const roundedScore = Math.round(score);
        setFinalScore(roundedScore);

        progressTracker.recordSession({
          lessonId: lesson!.id,
          attemptedAt: new Date().toISOString(),
          correctCount: newCorrectCount,
          incorrectCount,
          totalTimeMs,
          score: roundedScore,
        });

        if (roundedScore >= 80 && isLastLessonInLevel()) {
          setGameState('level_complete');
        } else {
          setGameState('sequence_complete');
        }
      }
    } else {
      // Incorrect tap
      void audioEngine.playNote(buttonLabel, octave);
      setTimeout(() => {
        void audioEngine.playNote(pitchClass, octave);
      }, 600);

      const correctLabel = getCorrectButtonLabel(activeNote);
      setCorrectNote(correctLabel);
      setIncorrectCount((c) => c + 1);
      setCurrentNoteHadError(true);

      if (correctNoteTimerRef.current) clearTimeout(correctNoteTimerRef.current);
      correctNoteTimerRef.current = setTimeout(() => {
        setCorrectNote(null);
      }, 1500);
    }
  }

  // ─── Mute toggle ────────────────────────────────────────────────────────

  function handleMuteToggle() {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  }

  // ─── Score display ──────────────────────────────────────────────────────

  const totalAttempts = correctCount + incorrectCount;
  const runningScore =
    totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 100;

  // ─── Guard: lesson not found ─────────────────────────────────────────────

  if (!lesson) return null;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] px-2"
          aria-label="Back to lessons"
        >
          <span className="text-lg">←</span>
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-sm font-semibold text-center flex-1 mx-2 truncate">
          {lesson.learningObjective}
        </h1>

        <button
          onClick={handleMuteToggle}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-400 hover:text-white transition-colors"
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </header>

      {/* Staff Display */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        {notation && (
          <StaffDisplay
            notation={notation}
            activeNoteIndex={activeNoteIndex}
          />
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-400 shrink-0">
        <span>
          Note {Math.min(activeNoteIndex + 1, sequence.length)} of {sequence.length}
        </span>
        <span>Score: {runningScore}%</span>
      </div>

      {/* Note Button Grid */}
      <div className="px-4 pb-6 flex-1 flex flex-col justify-end">
        <NoteButtonGrid
          showNaturalSign={false}
          onNoteSelect={handleNoteSelect}
          correctNote={correctNote ?? undefined}
          lastTappedNote={lastTappedNote ?? undefined}
          lastTapCorrect={lastTapCorrect ?? undefined}
          disabled={gameState !== 'playing'}
        />
      </div>

      {/* Completion overlays */}
      <AnimatePresence>
        {gameState === 'sequence_complete' && (
          <CompletionOverlay
            score={finalScore}
            title="Sequence Complete!"
            colorScheme="blue"
            onPlayAgain={startNewSequence}
            onBack={() => navigate('/')}
          />
        )}
        {gameState === 'level_complete' && (
          <CompletionOverlay
            score={finalScore}
            title="Level Complete! 🏆"
            colorScheme="gold"
            onPlayAgain={startNewSequence}
            onBack={() => navigate('/')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CompletionOverlay ───────────────────────────────────────────────────────

interface CompletionOverlayProps {
  score: number;
  title: string;
  colorScheme: 'blue' | 'gold';
  onPlayAgain: () => void;
  onBack: () => void;
}

function CompletionOverlay({
  score,
  title,
  colorScheme,
  onPlayAgain,
  onBack,
}: CompletionOverlayProps) {
  const isGold = colorScheme === 'gold';

  const bgColor = isGold
    ? 'bg-yellow-900/95'
    : 'bg-blue-900/95';

  const accentColor = isGold ? 'text-yellow-300' : 'text-blue-300';
  const buttonPrimary = isGold
    ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
    : 'bg-blue-500 hover:bg-blue-400 text-white';

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Card */}
      <motion.div
        className={`relative w-full max-w-sm rounded-2xl ${bgColor} p-8 flex flex-col items-center gap-6 shadow-2xl`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Stars burst (decorative) */}
        {isGold && (
          <motion.div
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
          >
            ⭐
          </motion.div>
        )}

        <motion.h2
          className={`text-2xl font-bold text-center ${accentColor}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {title}
        </motion.h2>

        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <span className={`text-6xl font-bold ${accentColor}`}>{score}%</span>
          <span className="text-gray-300 text-sm">
            {score >= 80 ? 'Mastery achieved! 🎉' : 'Keep practicing!'}
          </span>
        </motion.div>

        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={onPlayAgain}
            className={`w-full py-3 rounded-xl font-semibold text-base transition-colors ${buttonPrimary} min-h-[44px]`}
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl font-semibold text-base bg-gray-700 hover:bg-gray-600 text-white transition-colors min-h-[44px]"
          >
            Back to Lessons
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default PracticeScreen;
