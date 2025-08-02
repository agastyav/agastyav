import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SeriesPage from './pages/SeriesPage'
import JumpResultPage from './pages/JumpResultPage'
import ModerationPage from './pages/ModerationPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import ArcPage from './pages/ArcPage'

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/series/:id" element={<SeriesPage />} />
          <Route path="/series/:id/jump" element={<JumpResultPage />} />
          <Route path="/arc/:id" element={<ArcPage />} />
          <Route path="/moderation" element={<ModerationPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App