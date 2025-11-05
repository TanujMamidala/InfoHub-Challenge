import React, { useState } from 'react'
import axios from 'axios'

export default function CurrencyConverter() {
  const [amount, setAmount] = useState(100)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const convert = async () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    setIsLoading(true)
    setError('')
    setData(null) // Clear old data
    try {
      const res = await axios.get(`/api/currency?amount=${encodeURIComponent(amountNum)}`)
      console.log('Currency response:', res.data) // Debug log
      setData(res.data)
    } catch (err) {
      console.error('Currency error:', err) // Debug log
      setError(err.response?.data?.error || err.message || 'Failed to convert currency')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="module">
      <h2>Currency Converter</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>Convert Indian Rupees (INR) to USD and EUR</p>

      <div className="form-row">
        <input
          type="number"
          min="1"
          placeholder="Enter amount in INR"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && convert()}
        />
        <button 
          onClick={convert}
          disabled={isLoading || !amount || amount <= 0}
        >
          {isLoading ? 'Converting...' : 'Convert'}
        </button>
      </div>

      {error && (
        <div className="error">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div className="result">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>INR Amount</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>₹{Number(data.amountINR).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>US Dollar</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>${Number(data.usd).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Euro</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>€{Number(data.eur).toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            Source: {data.ratesSource} • Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="loading">
          Converting currencies...
        </div>
      )}
    </section>
  )
}
