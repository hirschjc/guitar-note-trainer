import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LessonsPage, StatsScreen, PracticeScreen } from './pages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LessonsPage />} />
        <Route path="/lesson/:lessonId" element={<PracticeScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
