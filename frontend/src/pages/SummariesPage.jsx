import { useState, useEffect } from 'react'
import { getSummaries } from '../services/api'
import { FileText, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react'

export default function SummariesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSummaries().then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading...</p></div>
  if (!data) return <div className="loading-container"><p>No data available.</p></div>

  const { summaries, executive_summary } = data
  const overall = summaries?._overall
  const productSummaries = Object.entries(summaries || {}).filter(([k]) => k !== '_overall')

  return (
    <div>
      <div className="page-header">
        <h2>AI-Generated Summaries</h2>
        <p>LLM-powered insights from customer reviews</p>
      </div>

      {executive_summary && (
        <div className="executive-summary">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={18} color="#a855f7" />
            <strong style={{ color: 'var(--accent-purple)' }}>Executive Summary</strong>
          </div>
          {executive_summary}
        </div>
      )}

      {overall && (
        <div className="card-grid card-grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Reviews</div>
            <div className="stat-value">{overall.total_reviews}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Products Analyzed</div>
            <div className="stat-value">{overall.total_products}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Best Rated</div>
            <div className="stat-value" style={{ fontSize: 16 }}>{overall.best_rated?.product}</div>
            <div className="stat-sub" style={{ color: 'var(--accent-green)' }}>{overall.best_rated?.rating}/5</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Needs Improvement</div>
            <div className="stat-value" style={{ fontSize: 16 }}>{overall.worst_rated?.product}</div>
            <div className="stat-sub" style={{ color: 'var(--accent-red)' }}>{overall.worst_rated?.rating}/5</div>
          </div>
        </div>
      )}

      {productSummaries.map(([name, s]) => (
        <div className="summary-card" key={name}>
          <h4>
            <FileText size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-blue)' }} />
            {s.product}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 12 }}>
              {s.total_reviews} reviews | {s.avg_rating}/5
            </span>
            {s.llm_generated && (
              <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', borderRadius: 12 }}>
                AI Generated
              </span>
            )}
          </h4>
          <p>{s.summary}</p>

          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            {s.key_positives?.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ThumbsUp size={14} /> Key Strengths
                </div>
                <div className="tag-list">
                  {s.key_positives.map((p, i) => <span key={i} className="tag tag-positive">{p}</span>)}
                </div>
              </div>
            )}
            {s.key_negatives?.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ThumbsDown size={14} /> Main Concerns
                </div>
                <div className="tag-list">
                  {s.key_negatives.map((n, i) => <span key={i} className="tag tag-negative">{n}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
