import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LESSONS } from '../data/lessons'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Middle C and C Major Scale',
  2: 'Extended Range',
  3: 'Common Intervals',
  4: 'Basic Chords',
  5: 'Common Keys',
  6: 'Extended Harmony',
  7: 'Common Keys with Accidentals',
  8: 'Chromatic Notes & Extended Harmony',
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
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]))

  const levelGroups = groupByLevel()
  const levels = Array.from(levelGroups.keys()).sort((a, b) => a - b)

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
      <header className="flex items-center px-4 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-tight">Guitar Note Trainer</h1>
      </header>

      <main className="px-4 py-6 space-y-3 max-w-2xl mx-auto">
        {levels.map((level) => {
          const lessons = levelGroups.get(level)!
          const isExpanded = expandedLevels.has(level)

          return (
            <div key={level} className="rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => toggleLevel(level)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
              >
                <span className="text-base font-semibold">
                  Level {level} — {getLevelName(level)}
                </span>
                <span className="text-gray-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="divide-y divide-gray-800">
                  {lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() => navigate(`/lesson/${lesson.id}`)}
                        className="flex items-center px-4 py-3 bg-gray-950 transition-colors cursor-pointer hover:bg-gray-900"
                      >
                        <p className="text-sm text-gray-200 leading-snug">
                          {lesson.learningObjective}
                        </p>
                        {lesson.lessonType === 'fingering' && (
                          <span className="ml-2 shrink-0 inline-block px-2 py-0.5 text-xs font-medium bg-emerald-700 text-emerald-100 rounded-full">
                            🎸 Fingering
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}
