import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CatalystHero from './components/CatalystHero'
import DashboardPage from './pages/DashboardPage'
import VideoBackground from './components/VideoBackground'

function App() {
  return (
    <>
      <VideoBackground />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CatalystHero />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
