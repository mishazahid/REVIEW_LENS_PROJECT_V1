import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import SentimentPage from './pages/SentimentPage'
import TopicsPage from './pages/TopicsPage'
import PrioritiesPage from './pages/PrioritiesPage'
import TrendsPage from './pages/TrendsPage'
import ComparisonPage from './pages/ComparisonPage'
import SummariesPage from './pages/SummariesPage'
import ReviewsPage from './pages/ReviewsPage'
import './App.css'

function App() {
  const [analysisReady, setAnalysisReady] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar analysisReady={analysisReady} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<UploadPage onAnalysisComplete={() => setAnalysisReady(true)} />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sentiment" element={<SentimentPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/priorities" element={<PrioritiesPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/summaries" element={<SummariesPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
