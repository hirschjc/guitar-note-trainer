import express, { Request, Response } from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const app = express()
const PORT = process.env.PORT ?? 3001
const prisma = new PrismaClient()

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Ordered lesson list for unlock chain
const LESSON_ORDER: string[] = [
  'level1-lesson1', 'level1-lesson2', 'level1-lesson3',
  'level2-lesson1', 'level2-lesson2', 'level2-lesson3',
  'level3-lesson1', 'level3-lesson2', 'level3-lesson3',
  'level4-lesson1', 'level4-lesson2', 'level4-lesson3',
  'level5-lesson1', 'level5-lesson2', 'level5-lesson3',
  'level6-lesson1', 'level6-lesson2', 'level6-lesson3', 'level6-lesson4',
]

const MASTERY_THRESHOLD = 80

interface SessionResultInput {
  id: string
  deviceId: string
  lessonId: string
  attemptedAt: string
  correctCount: number
  incorrectCount: number
  totalTimeMs: number
  score: number
}

interface LessonProgress {
  deviceId: string
  lessonId: string
  bestScore: number
  attemptCount: number
  isUnlocked: boolean
}

function deriveLessonProgress(
  deviceId: string,
  rows: { lessonId: string; score: number }[]
): LessonProgress[] {
  // Group by lessonId
  const grouped = new Map<string, number[]>()
  for (const row of rows) {
    const scores = grouped.get(row.lessonId) ?? []
    scores.push(row.score)
    grouped.set(row.lessonId, scores)
  }

  // Build a bestScore map for unlock chain evaluation
  const bestScoreMap = new Map<string, number>()
  for (const [lessonId, scores] of grouped.entries()) {
    bestScoreMap.set(lessonId, Math.max(...scores))
  }

  // Compute isUnlocked for every lesson in the ordered list
  const result: LessonProgress[] = []
  for (let i = 0; i < LESSON_ORDER.length; i++) {
    const lessonId = LESSON_ORDER[i]
    const scores = grouped.get(lessonId) ?? []
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0
    const attemptCount = scores.length

    let isUnlocked: boolean
    if (i === 0) {
      isUnlocked = true
    } else {
      const prevLessonId = LESSON_ORDER[i - 1]
      const prevBest = bestScoreMap.get(prevLessonId) ?? 0
      isUnlocked = prevBest >= MASTERY_THRESHOLD
    }

    result.push({ deviceId, lessonId, bestScore, attemptCount, isUnlocked })
  }

  return result
}

function validateSessionInput(body: Partial<SessionResultInput>): string | null {
  const required: (keyof SessionResultInput)[] = [
    'id', 'deviceId', 'lessonId', 'attemptedAt',
    'correctCount', 'incorrectCount', 'totalTimeMs', 'score',
  ]
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Missing required field: ${field}`
    }
  }
  return null
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// POST /api/sessions
app.post('/api/sessions', async (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<SessionResultInput>
    const validationError = validateSessionInput(body)
    if (validationError) {
      res.status(400).json({ error: validationError, code: 'VALIDATION_ERROR' })
      return
    }

    const input = body as SessionResultInput

    await prisma.sessionResult.upsert({
      where: { id: input.id },
      update: {
        deviceId: input.deviceId,
        lessonId: input.lessonId,
        attemptedAt: new Date(input.attemptedAt),
        correctCount: input.correctCount,
        incorrectCount: input.incorrectCount,
        totalTimeMs: input.totalTimeMs,
        score: input.score,
      },
      create: {
        id: input.id,
        deviceId: input.deviceId,
        lessonId: input.lessonId,
        attemptedAt: new Date(input.attemptedAt),
        correctCount: input.correctCount,
        incorrectCount: input.incorrectCount,
        totalTimeMs: input.totalTimeMs,
        score: input.score,
      },
    })

    res.status(201).json({ id: input.id })
  } catch (err) {
    console.error('POST /api/sessions error:', err)
    res.status(500).json({ error: 'Internal server error', code: 'DB_ERROR' })
  }
})

// GET /api/progress/:deviceId
app.get('/api/progress/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params

    const rows = await prisma.sessionResult.findMany({
      where: { deviceId },
      select: { lessonId: true, score: true },
    })

    const lessons = deriveLessonProgress(deviceId, rows)
    res.status(200).json({ lessons })
  } catch (err) {
    console.error('GET /api/progress error:', err)
    res.status(500).json({ error: 'Internal server error', code: 'DB_ERROR' })
  }
})

// POST /api/progress/sync
app.post('/api/progress/sync', async (req: Request, res: Response) => {
  try {
    const body = req.body as { sessions?: Partial<SessionResultInput>[] }

    if (!body.sessions || !Array.isArray(body.sessions)) {
      res.status(400).json({ error: 'Missing required field: sessions', code: 'VALIDATION_ERROR' })
      return
    }

    let synced = 0
    let failed = 0

    for (const session of body.sessions) {
      const validationError = validateSessionInput(session)
      if (validationError) {
        failed++
        continue
      }

      const input = session as SessionResultInput
      try {
        await prisma.sessionResult.upsert({
          where: { id: input.id },
          update: {
            deviceId: input.deviceId,
            lessonId: input.lessonId,
            attemptedAt: new Date(input.attemptedAt),
            correctCount: input.correctCount,
            incorrectCount: input.incorrectCount,
            totalTimeMs: input.totalTimeMs,
            score: input.score,
          },
          create: {
            id: input.id,
            deviceId: input.deviceId,
            lessonId: input.lessonId,
            attemptedAt: new Date(input.attemptedAt),
            correctCount: input.correctCount,
            incorrectCount: input.incorrectCount,
            totalTimeMs: input.totalTimeMs,
            score: input.score,
          },
        })
        synced++
      } catch {
        failed++
      }
    }

    res.status(200).json({ synced, failed })
  } catch (err) {
    console.error('POST /api/progress/sync error:', err)
    res.status(500).json({ error: 'Internal server error', code: 'DB_ERROR' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
