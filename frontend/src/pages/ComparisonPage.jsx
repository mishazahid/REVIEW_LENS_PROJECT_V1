import { useState, useEffect } from 'react'
import { getComparison } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export default function ComparisonPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getComparison().then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading...</p></div>
  if (!data) return <div className="loading-container"><p>No data available.</p></div>

  const products = Object.entries(data).sort((a, b) => a[1].rank - b[1].rank)

  const barData = products.map(([name, d]) => ({
    name: name.length > 18 ? name.slice(0, 18) + '...' : name,
    'Avg Rating': d.avg_rating,
    'Positive %': d.positive_pct,
    'Negative %': d.negative_pct,
  }))

  const satisfactionData = products.map(([name, d]) => ({
    name: name.length > 18 ? name.slice(0, 18) + '...' : name,
    satisfaction: d.satisfaction_score,
  }))

  return (
    <div>
      <div className="page-header">
        <h2>Product Comparison</h2>
        <p>Compare products by sentiment, ratings, and satisfaction</p>
      </div>

      <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>Rating & Sentiment Comparison</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend />
              <Bar dataKey="Positive %" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Negative %" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><h3>Satisfaction Score</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={satisfactionData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="satisfaction" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Product Ranking</h3></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Product</th>
              <th>Reviews</th>
              <th>Avg Rating</th>
              <th>Positive</th>
              <th>Neutral</th>
              <th>Negative</th>
              <th>Satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {products.map(([name, d]) => (
              <tr key={name}>
                <td style={{ fontWeight: 700, color: d.rank === 1 ? '#22c55e' : 'inherit' }}>#{d.rank}</td>
                <td style={{ fontWeight: 600 }}>{name}</td>
                <td>{d.total_reviews}</td>
                <td>{d.avg_rating}</td>
                <td className="sentiment-positive">{d.sentiment.positive} ({d.positive_pct}%)</td>
                <td className="sentiment-neutral">{d.sentiment.neutral}</td>
                <td className="sentiment-negative">{d.sentiment.negative} ({d.negative_pct}%)</td>
                <td style={{ fontWeight: 600, color: d.satisfaction_score > 0 ? '#22c55e' : '#ef4444' }}>
                  {d.satisfaction_score > 0 ? '+' : ''}{d.satisfaction_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
