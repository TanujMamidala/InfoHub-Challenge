import React, { useState, useEffect } from 'react'
import axios from 'axios'
import WeatherModule from './components/WeatherModule'
import CurrencyConverter from './components/CurrencyConverter'
import QuoteGenerator from './components/QuoteGenerator'

export default function App() {
  const [activeTab, setActiveTab] = useState('Weather')
  const [backendHealthy, setBackendHealthy] = useState(null)
  const [backendConfig, setBackendConfig] = useState(null)
  const [showWarning, setShowWarning] = useState(true)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const [health, config] = await Promise.all([
          axios.get('/api/health', { timeout: 2500 }),
          axios.get('/api/config', { timeout: 2500 })
        ])
        if (!mounted) return
        setBackendHealthy(!!(health.data && health.data.status === 'ok'))
        setBackendConfig(config.data)
        // Show warning if backend is up but no API keys configured
        setShowWarning(health.data?.status === 'ok' && 
          config.data && 
          !config.data.openWeatherKeyPresent && 
          !config.data.exchangeRateKeyPresent)
      } catch (err) {
        if (!mounted) return
        setBackendHealthy(false)
        setBackendConfig(null)
        setShowWarning(true)
      }
    }
    check()
    const t = setInterval(check, 10000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>InfoHub</h1>
          <div className="status">
            Status: {' '}
            {backendHealthy === null ? (
              <span>Checking...</span>
            ) : backendHealthy ? (
              <span className="online">Online ●</span>
            ) : (
              <span className="offline">Offline ●</span>
            )}
            {backendConfig && backendHealthy && (
              <span style={{marginLeft:10}}>
                {[
                  backendConfig.openWeatherKeyPresent && 'Weather',
                  backendConfig.exchangeRateKeyPresent && 'Currency',
                  backendConfig.quoteApiUrlPresent && 'Quotes'
                ].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>
        <nav className="tabs">
          <button 
            className={activeTab === 'Weather' ? 'active' : ''} 
            onClick={() => setActiveTab('Weather')}
          >
            Weather
          </button>
          <button 
            className={activeTab === 'Currency' ? 'active' : ''} 
            onClick={() => setActiveTab('Currency')}
          >
            Currency
          </button>
          <button 
            className={activeTab === 'Quote' ? 'active' : ''} 
            onClick={() => setActiveTab('Quote')}
          >
            Quotes
          </button>
        </nav>
      </header>

      {showWarning && !backendHealthy && (
        <div className="error">
          <strong>Cannot connect to backend server</strong>
          <p>Make sure the server is running on port 3001 and try again.</p>
        </div>
      )}

      {showWarning && backendHealthy && (
        <div className="error">
          <strong>API Keys Not Configured</strong>
          <p>Some features may not work. Please check the server's .env file.</p>
        </div>
      )}

      <main className="main">
        {activeTab === 'Weather' && <WeatherModule />}
        {activeTab === 'Currency' && <CurrencyConverter />}
        {activeTab === 'Quote' && <QuoteGenerator />}
      </main>

      <footer className="footer">
        <p>&copy; InfoHub {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
