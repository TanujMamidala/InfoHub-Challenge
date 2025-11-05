import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function WeatherModule() {
  const [city, setCity] = useState('London')
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchWeather = async (qCity = city) => {
    if (!qCity.trim()) {
      setError('Please enter a city name')
      return
    }
    
    setIsLoading(true)
    setError('')
    setData(null) // Clear old data
    try {
      const res = await axios.get(`/api/weather?city=${encodeURIComponent(qCity)}`)
      console.log('Weather response:', res.data) // Debug log
      setData(res.data)
    } catch (err) {
      console.error('Weather error:', err) // Debug log
      setError(err.response?.data?.error || err.message || 'Failed to load weather')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="module">
      <h2>Weather Forecast</h2>

      <div className="form-row">
        <input 
          type="text"
          placeholder="Enter city name..."
          value={city} 
          onChange={(e) => setCity(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && fetchWeather(city)}
        />
        <button 
          onClick={() => fetchWeather(city)}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get Weather'}
        </button>
      </div>

      {error && (
        <div className="error">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {data && !error && (
        <div className="weather">
          <h3>{data.city}</h3>
          <div className="temp">{Math.round(data.temperature)}°C</div>
          <div className="description">{data.description}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="loading">
          Fetching weather data...
        </div>
      )}
    </section>
  )
}
