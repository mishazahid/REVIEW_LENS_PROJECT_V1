import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, Database, Play, CheckCircle } from 'lucide-react'
import { uploadDataset, loadSampleDataset, runAnalysis } from '../services/api'

export default function UploadPage({ onAnalysisComplete }) {
  const navigate = useNavigate()
  const [uploadState, setUploadState] = useState(null) // null | 'uploaded' | 'analyzing' | 'done'
  const [fileInfo, setFileInfo] = useState(null)
  const [mapping, setMapping] = useState({})
  const [error, setError] = useState(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setError(null)
    try {
      const res = await uploadDataset(file)
      setFileInfo(res.data)
      setMapping(res.data.detected_mapping)
      setUploadState('uploaded')
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  const handleLoadSample = async () => {
    setError(null)
    try {
      const res = await loadSampleDataset()
      setFileInfo(res.data)
      setMapping(res.data.detected_mapping)
      setUploadState('uploaded')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sample')
    }
  }

  const handleAnalyze = async () => {
    setError(null)
    setUploadState('analyzing')
    try {
      await runAnalysis(mapping)
      setUploadState('done')
      onAnalysisComplete()
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed')
      setUploadState('uploaded')
    }
  }

  const updateMapping = (key, value) => {
    setMapping(prev => ({ ...prev, [key]: value || null }))
  }

  if (uploadState === 'analyzing') {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Running analysis pipeline... This may take a moment.</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Sentiment analysis, topic extraction, LLM summarization...
        </p>
      </div>
    )
  }

  return (
    <div className="upload-container">
      <div className="page-header">
        <h2>Upload Review Data</h2>
        <p>Upload a CSV file or use the sample dataset to get started</p>
      </div>

      {uploadState !== 'done' && (
        <>
          <div {...getRootProps()} className={`upload-dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={48} color="var(--accent-blue)" />
            <h3>Drop your CSV file here</h3>
            <p>or click to browse files</p>
          </div>

          <div className="upload-or">or</div>

          <button className="btn btn-secondary" onClick={handleLoadSample}>
            <Database size={16} />
            Use Sample Dataset (Amazon Reviews)
          </button>
        </>
      )}

      {error && <div className="status-message status-error">{error}</div>}

      {uploadState === 'uploaded' && fileInfo && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="status-message status-success">
            <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Loaded {fileInfo.filename} — {fileInfo.rows} rows, {fileInfo.columns.length} columns
          </div>

          <div className="column-mapping">
            <h3>Column Mapping</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              We auto-detected the columns. Adjust if needed.
            </p>
            {['review_text', 'rating', 'product', 'date', 'title'].map(key => (
              <div className="mapping-row" key={key}>
                <label>{key.replace('_', ' ')}</label>
                <select
                  value={mapping[key] || ''}
                  onChange={(e) => updateMapping(key, e.target.value)}
                >
                  <option value="">— Not mapped —</option>
                  {fileInfo.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            className="btn btn-success"
            style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
            onClick={handleAnalyze}
            disabled={!mapping.review_text}
          >
            <Play size={16} />
            Run Analysis Pipeline
          </button>
        </div>
      )}

      {uploadState === 'done' && (
        <div className="status-message status-success" style={{ marginTop: 24 }}>
          <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Analysis complete! Redirecting to dashboard...
        </div>
      )}
    </div>
  )
}
