import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { LessonsPage, StatsScreen, PracticeScreen } from './pages'
import FingeringPracticeScreen from './pages/FingeringPracticeScreen'
import { LESSONS } from './data/lessons'

function LessonRouter() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const lesson = LESSONS.find((l) => l.id === lessonId)
  if (lesson?.lessonType === 'fingering') {
    return <FingeringPracticeScreen />
  }
  return <PracticeScreen />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LessonsPage />} />
        <Route path="/lesson/:lessonId" element={<LessonRouter />} />
        <Route path="/stats" element={<StatsScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
