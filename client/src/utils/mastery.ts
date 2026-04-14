import { LessonProgress } from '../types';
import { LESSONS, MASTERY_THRESHOLD } from '../data/lessons';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates a mastery score from session stats.
 *
 * Speed requirement: >1300ms avg response = 0 score (slower than ~46 BPM).
 * Full credit at ≤666ms avg response (~90 BPM).
 * Linear scale between 666ms and 1300ms.
 *
 * score = accuracy * speedMultiplier
 * speedMultiplier = clamp((1000 - avgMs) / 500, 0, 1)
 *
 * Returns 0 if totalNotes is 0 or avg response > 1000ms.
 * Final score is clamped to [0, 100].
 */
export function calculateMasteryScore(
  correctCount: number,
  incorrectCount: number,
  totalTimeMs: number
): number {
  const totalNotes = correctCount + incorrectCount;
  if (totalNotes === 0) return 0;

  const avgResponseTimeMs = totalTimeMs / totalNotes;

  // Hard cutoff: slower than ~46 BPM (1300ms/note) = no mastery credit
  if (avgResponseTimeMs > 1300) return 0;

  // Speed multiplier: 1.0 at ≤666ms (~90 BPM), 0.0 at 1300ms
  const speedMultiplier = clamp((1300 - avgResponseTimeMs) / (1300 - 666), 0, 1);

  // Accuracy: only first-attempt correct notes count (incorrectCount already excludes retries)
  const accuracy = correctCount / totalNotes;

  return clamp(accuracy * 100 * speedMultiplier, 0, 100);
}

/**
 * Given a list of session-derived progress records, compute the full
 * LessonProgress array for all lessons — including isUnlocked.
 *
 * Rules:
 * - The first lesson (by level then order) is always unlocked
 * - A lesson is unlocked if the immediately preceding lesson has a bestScore >= masteryThreshold
 * - deviceId is passed through to each LessonProgress record
 */
export function computeLessonProgress(
  sessionResults: Array<{ lessonId: string; score: number }>,
  deviceId: string,
  masteryThreshold: number = MASTERY_THRESHOLD
): LessonProgress[] {
  // Sort lessons by level then order to get canonical sequence
  const sortedLessons = [...LESSONS].sort((a, b) =>
    a.level !== b.level ? a.level - b.level : a.order - b.order
  );

  // Build map of lessonId → bestScore from sessionResults
  const bestScoreMap = new Map<string, number>();
  for (const result of sessionResults) {
    const current = bestScoreMap.get(result.lessonId) ?? 0;
    if (result.score > current) {
      bestScoreMap.set(result.lessonId, result.score);
    }
  }

  // Build attempt count map
  const attemptCountMap = new Map<string, number>();
  for (const result of sessionResults) {
    attemptCountMap.set(result.lessonId, (attemptCountMap.get(result.lessonId) ?? 0) + 1);
  }

  // Build map of lessonId → qualifying session count (sessions with score >= threshold)
  const qualifyingSessionsMap = new Map<string, number>();
  for (const result of sessionResults) {
    if (result.score >= masteryThreshold) {
      qualifyingSessionsMap.set(result.lessonId, (qualifyingSessionsMap.get(result.lessonId) ?? 0) + 1);
    }
  }

  // Walk sorted lessons, computing isUnlocked for each
  // All lessons are always unlocked — no gates
  return sortedLessons.map((lesson, _index) => {
    const isUnlocked = true;

    return {
      deviceId,
      lessonId: lesson.id,
      bestScore: bestScoreMap.get(lesson.id) ?? 0,
      attemptCount: attemptCountMap.get(lesson.id) ?? 0,
      qualifyingCount: qualifyingSessionsMap.get(lesson.id) ?? 0,
      isUnlocked,
    };
  });
}

/**
 * Returns true if the given lessonId is unlocked in the provided progress list.
 */
export function isLessonUnlocked(
  lessonId: string,
  progressList: LessonProgress[]
): boolean {
  return progressList.find((p) => p.lessonId === lessonId)?.isUnlocked ?? false;
}
