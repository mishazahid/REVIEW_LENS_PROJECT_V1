import { useState, useEffect } from 'react'
import { getReviews, getDashboard } from '../services/api'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [product, setProduct] = useState('')
  const [sentiment, setSentiment] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(res => {
      const eda = res.data?.eda
      if (eda?.products) setProducts(Object.keys(eda.products))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getReviews({ product: product || undefined, sentiment: sentiment || undefined, page, per_page: 15 })
      .then(res => {
        setReviews(res.data.reviews)
        setTotal(res.data.total)
        setTotalPages(res.data.total_pages)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, product, sentiment])

  const handleFilterChange = () => setPage(1)

  const renderStars = (rating) => {
    if (!rating) return '—'
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Browse Reviews</h2>
        <p>Explore individual reviews with filtering</p>
      </div>

      <div className="filters">
        <select className="filter-select" value={product} onChange={(e) => { setProduct(e.target.value); setPage(1) }}>
          <option value="">All Products</option>
          {products.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={sentiment} onChange={(e) => { setSentiment(e.target.value); setPage(1) }}>
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          {total} reviews found
        </span>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading reviews...</p></div>
      ) : (
        <>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Review</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Sentiment</th>
                  <th>Date</th>
                  <th>Polarity</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r, i) => (
                  <tr key={i}>
                    <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.review_text}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.product}</td>
                    <td><span className="stars">{renderStars(r.rating)}</span></td>
                    <td>
                      <span className={`badge badge-${r.sentiment === 'positive' ? 'low' : r.sentiment === 'negative' ? 'critical' : 'medium'}`}>
                        {r.sentiment}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.date || '—'}</td>
                    <td>{r.polarity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </>
      )}
    </div>
  )
}
