import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function QuoteGenerator() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchQuote = async () => {
    setIsLoading(true)
    setError('')
    setData(null) // Clear old data
    try {
      const res = await axios.get('/api/quote')
      console.log('Quote response:', res.data) // Debug log
      if (res.data && res.data.quote) {
        setData(res.data.quote)
      } else {
        throw new Error('Invalid quote response')
      }
    } catch (err) {
      console.error('Quote error:', err) // Debug log
      setError(err.response?.data?.error || err.message || 'Failed to load quote')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuote()
  }, [])

  return (
    <section className="module">
      <h2>Daily Inspiration</h2>
      
      {error && (
        <div className="error">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {data && !isLoading && (
        <>
          <blockquote>
            <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>"{data.text}"</p>
            <footer style={{ 
              color: 'var(--muted)',
              fontSize: '0.875rem',
              fontStyle: 'normal'
            }}>— {data.author || 'Unknown'}</footer>
          </blockquote>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--muted)',
            textAlign: 'right',
            marginTop: '0.5rem'
          }}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </>
      )}

      {isLoading && (
        <div className="loading">
          Finding inspiration...
        </div>
      )}

      <div className="actions">
        <button 
          onClick={fetchQuote}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'New Quote'}
        </button>
      </div>
    </section>
  )
}
