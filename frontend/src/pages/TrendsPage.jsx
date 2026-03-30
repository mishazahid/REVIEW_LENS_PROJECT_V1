import { useState, useEffect } from 'react'
import { getTrends } from '../services/api'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

export default function TrendsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrends().then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading...</p></div>
  if (!data) return <div className="loading-container"><p>No data available.</p></div>

  const { monthly_sentiment, monthly_ratings, anomalies } = data

  return (
    <div>
      <div className="page-header">
        <h2>Trend Analysis</h2>
        <p>Track sentiment and rating changes over time</p>
      </div>

      {anomalies && anomalies.length > 0 && (
        <div className="status-message status-error" style={{ marginBottom: 24 }}>
          <strong>Anomalies Detected:</strong>{' '}
          {anomalies.map(a => `${a.month} (${a.negative_pct}% negative, avg ${a.avg_negative_pct}%)`).join('; ')}
        </div>
      )}

      {monthly_sentiment && monthly_sentiment.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Sentiment Trend Over Time</h3></div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthly_sentiment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend />
              <Area type="monotone" dataKey="positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
              <Area type="monotone" dataKey="neutral" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.3} />
              <Area type="monotone" dataKey="negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthly_ratings && monthly_ratings.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Average Rating Over Time</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthly_ratings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis domain={[1, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Line type="monotone" dataKey="avg_rating" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthly_sentiment && monthly_sentiment.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Monthly Breakdown</h3></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total</th>
                <th>Positive</th>
                <th>Neutral</th>
                <th>Negative</th>
                <th>Avg Rating</th>
                <th>Negative %</th>
              </tr>
            </thead>
            <tbody>
              {monthly_sentiment.map(m => (
                <tr key={m.month}>
                  <td style={{ fontWeight: 600 }}>{m.month}</td>
                  <td>{m.total}</td>
                  <td className="sentiment-positive">{m.positive}</td>
                  <td className="sentiment-neutral">{m.neutral}</td>
                  <td className="sentiment-negative">{m.negative}</td>
                  <td>{m.avg_rating}</td>
                  <td style={{ color: m.negative_pct > 40 ? '#ef4444' : 'inherit' }}>{m.negative_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
