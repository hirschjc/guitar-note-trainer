import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { progressTracker } from '../utils/progressTracker'
import { LESSONS } from '../data/lessons'
import { LessonProgress } from '../types'

// Group lessons by level
const LEVEL_NAMES: Record<number, string> = {
  1: 'Middle C and C Major Scale',
  2: 'Extended Range',
  3: 'Common Intervals',
  4: 'Basic Chords',
  5: 'Common Keys',
  6: 'Extended Harmony',
}

function getLevelName(level: number): string {
  return LEVEL_NAMES[level] ?? `Level ${level}`
}

function groupByLevel() {
  const map = new Map<number, typeof LESSONS>()
  for (const lesson of LESSONS) {
    if (!map.has(lesson.level)) map.set(lesson.level, [])
    map.get(lesson.level)!.push(lesson)
  }
  return map
}

export default function LessonsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]))

  useEffect(() => {
    const result = progressTracker.validateAndLoad()
    if (!result.ok) {
      setToast("We couldn't load your previous progress. Starting fresh.")
      setTimeout(() => setToast(null), 4000)
    }
    // Force recompute from sessions (bypass stale cache)
    setProgress(progressTracker.recomputeProgress())
  }, [location])

  const progressMap = new Map(progress.map((p) => [p.lessonId, p]))
  const levelGroups = groupByLevel()
  const levels = Array.from(levelGroups.keys()).sort((a, b) => a - b)

  // Find the "recommended" lesson: first unlocked lesson with bestScore < 80, or first lesson overall
  const recommendedLessonId = (() => {
    const allSorted = [...LESSONS].sort((a, b) =>
      a.level !== b.level ? a.level - b.level : a.order - b.order
    )
    const candidate = allSorted.find((l) => {
      const p = progressMap.get(l.id)
      return (p?.isUnlocked ?? (l.order === 1 && l.level === 1)) && (p?.bestScore ?? 0) < 80
    })
    return candidate?.id ?? allSorted[0]?.id
  })()

  function toggleLevel(level: number) {
    setExpandedLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-tight">Guitar Note Trainer</h1>
        <button
          onClick={() => navigate('/stats')}
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Stats →
        </button>
      </header>

      {/* Toast */}
      {toast && (
        <div className="mx-4 mt-4 px-4 py-3 bg-yellow-900 border border-yellow-700 rounded-lg text-yellow-200 text-sm">
          {toast}
        </div>
      )}

      {/* Level cards */}
      <main className="px-4 py-6 space-y-3 max-w-2xl mx-auto">
        {levels.map((level) => {
          const lessons = levelGroups.get(level)!
          const allLocked = lessons.every((l) => !(progressMap.get(l.id)?.isUnlocked ?? (l.level === 1 && l.order === 1)))
          const isExpanded = expandedLevels.has(level)

          return (
            <div key={level} className="rounded-xl border border-gray-800 overflow-hidden">
              {/* Level header */}
              <button
                onClick={() => toggleLevel(level)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">
                    Level {level} — {getLevelName(level)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <span>{allLocked ? '🔒' : '🔓'}</span>
                  <span className="text-gray-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Lesson rows */}
              {isExpanded && (
                <div className="divide-y divide-gray-800">
                  {lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => {
                      const p = progressMap.get(lesson.id)
                      const isUnlocked = p?.isUnlocked ?? (lesson.level === 1 && lesson.order === 1)
                      const isRecommended = lesson.id === recommendedLessonId
                      const bestScore = p?.bestScore ?? 0
                      const attempted = (p?.attemptCount ?? 0) > 0

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => isUnlocked && navigate(`/lesson/${lesson.id}`)}
                          className={`flex items-center justify-between px-4 py-3 bg-gray-950 transition-colors ${
                            isUnlocked
                              ? 'cursor-pointer hover:bg-gray-900'
                              : 'opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm text-gray-200 leading-snug">
                              {lesson.learningObjective}
                            </p>
                            {isRecommended && isUnlocked && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-500 text-gray-950 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isUnlocked ? (
                              <span className="text-base">🔒</span>
                            ) : attempted ? (
                              <span
                                className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                                  bestScore >= 80
                                    ? 'bg-green-900 text-green-300'
                                    : bestScore >= 60
                                    ? 'bg-yellow-900 text-yellow-300'
                                    : 'bg-red-900 text-red-300'
                                }`}
                              >
                                {Math.round(bestScore)}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">Not started</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}
