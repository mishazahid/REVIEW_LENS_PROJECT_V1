import { useState, useEffect } from 'react'
import { getSentiment } from '../services/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = { positive: '#22c55e', neutral: '#eab308', negative: '#ef4444' }

export default function SentimentPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSentiment().then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading...</p></div>
  if (!data) return <div className="loading-container"><p>No data available.</p></div>

  const { distribution, by_product, model_metrics } = data

  const pieData = Object.entries(distribution).map(([name, val]) => ({ name, value: val.count, pct: val.percentage }))

  const productChartData = Object.entries(by_product).map(([product, vals]) => ({
    name: product.length > 18 ? product.slice(0, 18) + '...' : product,
    positive: vals.positive,
    neutral: vals.neutral,
    negative: vals.negative,
  }))

  return (
    <div>
      <div className="page-header">
        <h2>Sentiment Analysis</h2>
        <p>Review sentiment classification using TextBlob and ML models</p>
      </div>

      <div className="card-grid card-grid-3" style={{ marginBottom: 24 }}>
        {Object.entries(distribution).map(([label, val]) => (
          <div className="stat-card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color: COLORS[label] }}>{val.count}</div>
            <div className="stat-sub">{val.percentage}% of reviews</div>
          </div>
        ))}
      </div>

      <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>Overall Sentiment</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value"
                label={({ name, pct }) => `${name} (${pct}%)`}>
                {pieData.map(entry => <Cell key={entry.name} fill={COLORS[entry.name]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><h3>Sentiment by Product</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productChartData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend />
              <Bar dataKey="positive" stackId="a" fill={COLORS.positive} />
              <Bar dataKey="neutral" stackId="a" fill={COLORS.neutral} />
              <Bar dataKey="negative" stackId="a" fill={COLORS.negative} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {model_metrics && (
        <div className="card">
          <div className="card-header"><h3>ML Model Performance</h3></div>
          <div className="card-grid card-grid-3">
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Model</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>TF-IDF + Logistic Regression</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Accuracy</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-green)', marginTop: 4 }}>
                {(model_metrics.accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Split</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{model_metrics.split}</div>
            </div>
          </div>
          {model_metrics.report && (
            <table className="data-table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>Support</th>
                </tr>
              </thead>
              <tbody>
                {['positive', 'neutral', 'negative'].map(cls => {
                  const m = model_metrics.report[cls]
                  return m ? (
                    <tr key={cls}>
                      <td><span className={`sentiment-${cls}`} style={{ fontWeight: 600, textTransform: 'capitalize' }}>{cls}</span></td>
                      <td>{(m.precision * 100).toFixed(1)}%</td>
                      <td>{(m.recall * 100).toFixed(1)}%</td>
                      <td>{(m['f1-score'] * 100).toFixed(1)}%</td>
                      <td>{m.support}</td>
                    </tr>
                  ) : null
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
