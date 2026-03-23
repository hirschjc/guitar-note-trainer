import { LessonProgress } from '../types';
import { LESSONS, MASTERY_THRESHOLD } from '../data/lessons';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates a mastery score from session stats.
 *
 * score = (correctCount / totalNotes) * 100 * timeBonus
 * timeBonus = clamp(1.0 - (avgResponseTimeMs - 2000) / 10000, 0.7, 1.0)
 *
 * Returns 0 if totalNotes is 0.
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
  const timeBonus = clamp(1.0 - (avgResponseTimeMs - 2000) / 10000, 0.7, 1.0);
  const score = (correctCount / totalNotes) * 100 * timeBonus;

  return clamp(score, 0, 100);
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

  // Walk sorted lessons, computing isUnlocked for each
  return sortedLessons.map((lesson, index) => {
    let isUnlocked: boolean;
    if (index === 0) {
      isUnlocked = true;
    } else {
      const prevLesson = sortedLessons[index - 1];
      const prevBestScore = bestScoreMap.get(prevLesson.id) ?? 0;
      isUnlocked = prevBestScore >= masteryThreshold;
    }

    return {
      deviceId,
      lessonId: lesson.id,
      bestScore: bestScoreMap.get(lesson.id) ?? 0,
      attemptCount: attemptCountMap.get(lesson.id) ?? 0,
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
