import { useState, useEffect } from 'react'
import { getDashboard } from '../services/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = { positive: '#22c55e', neutral: '#eab308', negative: '#ef4444' }

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading dashboard...</p></div>
  if (!data) return <div className="loading-container"><p>No analysis data. Upload a dataset first.</p></div>

  const { eda, sentiment_distribution, executive_summary, priorities, comparison } = data

  const sentimentPie = sentiment_distribution
    ? Object.entries(sentiment_distribution).map(([name, val]) => ({ name, value: val.count }))
    : []

  const ratingData = eda?.rating_distribution
    ? Object.entries(eda.rating_distribution).map(([star, count]) => ({ star: `${star} Star`, count }))
    : []

  const productData = comparison
    ? Object.entries(comparison).map(([name, d]) => ({
        name: name.length > 15 ? name.slice(0, 15) + '...' : name,
        rating: d.avg_rating,
        reviews: d.total_reviews,
        satisfaction: d.satisfaction_score,
      }))
    : []

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Key metrics and insights at a glance</p>
      </div>

      {executive_summary && (
        <div className="executive-summary">{executive_summary}</div>
      )}

      <div className="card-grid card-grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Reviews</div>
          <div className="stat-value">{eda?.total_reviews || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Rating</div>
          <div className="stat-value">{eda?.average_rating || '—'}</div>
          <div className="stat-sub">out of 5.0</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{eda?.total_products || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Issue</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {priorities?.[0]?.aspect || '—'}
          </div>
          <div className="stat-sub">
            {priorities?.[0] && <span className={`badge badge-${priorities[0].priority_level}`}>{priorities[0].priority_level}</span>}
          </div>
        </div>
      </div>

      <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>Sentiment Distribution</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {sentimentPie.map(entry => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><h3>Rating Distribution</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ratingData}>
              <XAxis dataKey="star" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {productData.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Product Satisfaction Scores</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="satisfaction" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
