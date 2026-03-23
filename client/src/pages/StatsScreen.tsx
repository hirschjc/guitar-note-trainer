import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { progressTracker } from '../utils/progressTracker'
import { LESSONS } from '../data/lessons'
import { LessonProgress, SessionResult } from '../types'

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.round(score)}%` }}
        />
      </div>
      <span
        className={`text-sm font-bold w-10 text-right ${
          score >= 80
            ? 'text-green-400'
            : score >= 60
            ? 'text-yellow-400'
            : 'text-red-400'
        }`}
      >
        {Math.round(score)}%
      </span>
    </div>
  )
}

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <span
      title={`${Math.round(score)}%`}
      className={`inline-block w-3 h-3 rounded-full ${color}`}
    />
  )
}

export default function StatsScreen() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [sessions, setSessions] = useState<SessionResult[]>([])

  useEffect(() => {
    setProgress(progressTracker.getProgress())
    setSessions(progressTracker.getSessions())
  }, [])

  const progressMap = new Map(progress.map((p) => [p.lessonId, p]))

  // Sessions grouped by lessonId, sorted by attemptedAt ascending
  const sessionsByLesson = new Map<string, SessionResult[]>()
  for (const s of sessions) {
    if (!sessionsByLesson.has(s.lessonId)) sessionsByLesson.set(s.lessonId, [])
    sessionsByLesson.get(s.lessonId)!.push(s)
  }
  for (const [, arr] of sessionsByLesson) {
    arr.sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt))
  }

  const attemptedLessons = LESSONS.filter((l) => (progressMap.get(l.id)?.attemptCount ?? 0) > 0).sort(
    (a, b) => (a.level !== b.level ? a.level - b.level : a.order - b.order)
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors text-lg"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-xl font-bold tracking-tight">Stats</h1>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {attemptedLessons.length === 0 ? (
          <p className="text-gray-400 text-center mt-16 text-sm leading-relaxed">
            No practice sessions yet.
            <br />
            Start practicing to see your stats here.
          </p>
        ) : (
          <div className="space-y-4">
            {attemptedLessons.map((lesson) => {
              const p = progressMap.get(lesson.id)!
              const lessonSessions = sessionsByLesson.get(lesson.id) ?? []
              const last10 = lessonSessions.slice(-10)

              return (
                <div
                  key={lesson.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-4 space-y-3"
                >
                  {/* Lesson title */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                      Level {lesson.level} · Lesson {lesson.order}
                    </p>
                    <p className="text-sm text-gray-200 leading-snug">
                      {lesson.learningObjective}
                    </p>
                  </div>

                  {/* Best score bar */}
                  <ScoreBar score={p.bestScore} />

                  {/* Attempt count */}
                  <p className="text-xs text-gray-500">
                    {p.attemptCount} {p.attemptCount === 1 ? 'attempt' : 'attempts'}
                  </p>

                  {/* Last 10 sessions sparkline */}
                  {last10.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Last {last10.length} sessions</p>
                      <div className="flex items-center gap-1">
                        {last10.map((s, i) => (
                          <ScoreDot key={i} score={s.score} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
