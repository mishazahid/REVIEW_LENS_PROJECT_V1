import { useState, useEffect } from 'react'
import { getPriorities } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PRIORITY_COLORS = { critical: '#ef4444', high: '#eab308', medium: '#3b82f6', low: '#22c55e' }

export default function PrioritiesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPriorities().then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading...</p></div>
  if (!data) return <div className="loading-container"><p>No data available.</p></div>

  const { priorities, summary } = data

  const chartData = priorities.map(p => ({
    name: p.aspect,
    score: p.priority_score,
    color: PRIORITY_COLORS[p.priority_level],
  }))

  return (
    <div>
      <div className="page-header">
        <h2>Issue Prioritization</h2>
        <p>Complaints ranked by frequency, severity, and sentiment</p>
      </div>

      {summary && (
        <div className="card-grid card-grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Issues</div>
            <div className="stat-value">{summary.total_issues}</div>
          </div>
          {['critical', 'high', 'medium', 'low'].map(level => (
            <div className="stat-card" key={level}>
              <div className="stat-label">{level}</div>
              <div className="stat-value" style={{ color: PRIORITY_COLORS[level] }}>
                {summary.distribution[level]}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3>Priority Scores</h3></div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={130} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-header"><h3>Detailed Priority Breakdown</h3></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Aspect</th>
              <th>Priority</th>
              <th>Score</th>
              <th>Mentions</th>
              <th>Avg Rating</th>
              <th>Neg. Mentions</th>
              <th>Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {priorities.map((p, i) => (
              <tr key={p.aspect}>
                <td style={{ fontWeight: 700 }}>#{i + 1}</td>
                <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p.aspect}</td>
                <td><span className={`badge badge-${p.priority_level}`}>{p.priority_level}</span></td>
                <td style={{ fontWeight: 600 }}>{p.priority_score}</td>
                <td>{p.mention_count}</td>
                <td>{p.avg_rating}</td>
                <td className="sentiment-negative">{p.negative_mentions}</td>
                <td style={{ fontSize: 12 }}>
                  Freq: {p.frequency_score} | Sev: {p.severity_score} | Neg: {p.negativity_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
