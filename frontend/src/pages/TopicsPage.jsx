import { useState, useEffect } from 'react'
import { getTopics } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function TopicsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTopics().then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading...</p></div>
  if (!data) return <div className="loading-container"><p>No data available.</p></div>

  const { topics, aspects } = data
  const maxMentions = Math.max(...Object.values(aspects || {}).map(a => a.mention_count), 1)

  const aspectChartData = Object.entries(aspects || {}).map(([name, d]) => ({
    name,
    mentions: d.mention_count,
    rating: d.avg_rating,
  }))

  return (
    <div>
      <div className="page-header">
        <h2>Topics & Aspects</h2>
        <p>Recurring themes and aspect-based analysis</p>
      </div>

      {aspects && Object.keys(aspects).length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Aspect Frequency</h3></div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={aspectChartData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="mentions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>Aspect Details</h3></div>
          {Object.entries(aspects || {}).map(([name, d]) => (
            <div className="aspect-item" key={name}>
              <div className="aspect-name">{name}</div>
              <div className="aspect-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(d.mention_count / maxMentions) * 100}%`,
                      background: d.avg_rating >= 3.5 ? '#22c55e' : d.avg_rating >= 2.5 ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Avg Rating: {d.avg_rating}/5 | {d.percentage}% of reviews
                </div>
              </div>
              <div className="aspect-mentions">{d.mention_count} mentions</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header"><h3>LDA Topics</h3></div>
          {Object.entries(topics || {}).map(([name, d]) => (
            <div key={name} style={{ marginBottom: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent-purple)' }}>{name}</div>
              <div className="tag-list">
                {d.words.map(word => (
                  <span key={word} className="tag" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                    {word}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {aspects && Object.keys(aspects).length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Aspect Sentiment Breakdown</h3></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Aspect</th>
                <th>Mentions</th>
                <th>Avg Rating</th>
                <th>Positive</th>
                <th>Neutral</th>
                <th>Negative</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(aspects).map(([name, d]) => (
                <tr key={name}>
                  <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{name}</td>
                  <td>{d.mention_count}</td>
                  <td>{d.avg_rating}</td>
                  <td className="sentiment-positive">{d.sentiment?.positive || 0}</td>
                  <td className="sentiment-neutral">{d.sentiment?.neutral || 0}</td>
                  <td className="sentiment-negative">{d.sentiment?.negative || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
