// pages/index.jsx

import { useEffect, useMemo, useState } from 'react'

const fetcher = (url) => fetch(url).then((r) => r.json())

export default function Home() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')

  // OHLCV state for selected token
  const [ohlcv, setOhlcv] = useState(null)
  const [ohlcvLoading, setOhlcvLoading] = useState(false)

  // --- Load basic token list (FDV, price, 24h%, volume, liq) ---
  useEffect(() => {
    async function load() {
      try {
        const data = await fetcher('/api/tokens')
        setTokens(data.tokens || [])
        if (data.tokens && data.tokens.length > 0) {
          setSelectedId(data.tokens[0].id)
        }
      } catch (e) {
        console.error(e)
        setError('Failed to load tokens')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedToken = useMemo(
    () => tokens.find((t) => t.id === selectedId) || null,
    [tokens, selectedId]
  )

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return tokens.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.symbol.toLowerCase().includes(s)
    )
  }, [tokens, search])

  // --- Load OHLCV for selected token (daily candles) ---
  useEffect(() => {
    if (!selectedId) {
      setOhlcv(null)
      return
    }

    async function loadOhlcv() {
      try {
        setOhlcvLoading(true)
        const res = await fetch(`/api/ohlcv?tokenId=${selectedId}`)
        if (!res.ok) {
          console.error('Failed to load ohlcv', res.status)
          setOhlcv(null)
          return
        }
        const data = await res.json()
        setOhlcv(data)
      } catch (e) {
        console.error('OHLCV error', e)
        setOhlcv(null)
      } finally {
        setOhlcvLoading(false)
      }
    }

    loadOhlcv()
  }, [selectedId])

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading, keep calm Virgen…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* LEFT: TOKENS TABLE */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>AI Tokens</h1>
          <p>{tokens.length} tokens</p>
          <input
            className="search"
            placeholder="Search by name or symbol…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-header">
          <span className="col-name">Token</span>
          <span className="col-num">FDV</span>
          <span className="col-num">Price</span>
          <span className="col-num">24h %</span>
          <span className="col-num">24h Vol</span>
          <span className="col-num">Liq.</span>
        </div>

        <div className="table-body">
          {filtered.map((t) => (
            <button
              key={t.id}
              className={
                'row ' + (t.id === selectedId ? 'row-selected' : '')
              }
              onClick={() => setSelectedId(t.id)}
            >
              <span className="col-name">
                {t.logo && (
                  <img
                    src={t.logo}
                    alt={t.symbol}
                    className="token-logo"
                  />
                )}
                <span>
                  <div className="token-name">{t.name}</div>
                  <div className="token-symbol">{t.symbol}</div>
                </span>
              </span>

              {/* FDV */}
              <span className="col-num">
                $
                {t.fdvUsd.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </span>

              {/* PRICE */}
              <span className="col-num">
                ${t.priceUsd.toFixed(6)}
              </span>

              {/* 24h % */}
              <span
                className={
                  'col-num ' +
                  (t.priceChange24h >= 0 ? 'num-green' : 'num-red')
                }
              >
                {t.priceChange24h.toFixed(2)}%
              </span>

              {/* 24h VOL */}
              <span className="col-num">
                $
                {t.volume24hUsd.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </span>

              {/* LIQ */}
              <span className="col-num">
                $
                {t.liquidityUsd.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: DETAIL + CHART */}
      <div className="detail">
        {selectedToken ? (
          <>
            <div className="detail-header">
              <div className="detail-title">
                {selectedToken.logo && (
                  <img
                    src={selectedToken.logo}
                    alt={selectedToken.symbol}
                    className="detail-logo"
                  />
                )}
                <div>
                  <h2>{selectedToken.name}</h2>
                  <p>{selectedToken.symbol}</p>
                </div>
              </div>
              <div className="detail-price">
                <div className="big-price">
                  ${selectedToken.priceUsd.toFixed(6)}
                </div>
                <div
                  className={
                    'badge ' +
                    (selectedToken.priceChange24h >= 0
                      ? 'badge-green'
                      : 'badge-red')
                  }
                >
                  {selectedToken.priceChange24h.toFixed(2)}% 24h
                </div>
              </div>
            </div>

            {/* Main stats */}
            <div className="detail-grid">
              <div className="stat-card">
                <div className="stat-label">FDV</div>
                <div className="stat-value">
                  $
                  {selectedToken.fdvUsd.toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Liquidity</div>
                <div className="stat-value">
                  $
                  {selectedToken.liquidityUsd.toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">24h Volume</div>
                <div className="stat-value">
                  $
                  {selectedToken.volume24hUsd.toLocaleString(
                    'en-US',
                    { maximumFractionDigits: 0 }
                  )}
                </div>
              </div>
            </div>

            {/* Daily candle stats (from OHLCV) */}
            <div className="detail-grid" style={{ marginTop: 8 }}>
              <div className="stat-card">
                <div className="stat-label">Day Open (candle)</div>
                <div className="stat-value">
                  {ohlcv && ohlcv.todayOpen
                    ? `$${ohlcv.todayOpen.toFixed(6)}`
                    : ohlcvLoading
                    ? 'Loading…'
                    : '-'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Last Close</div>
                <div className="stat-value">
                  {ohlcv && ohlcv.todayClose
                    ? `$${ohlcv.todayClose.toFixed(6)}`
                    : ohlcvLoading
                    ? 'Loading…'
                    : '-'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">% from Open</div>
                <div
                  className={
                    'stat-value ' +
                    (ohlcv && ohlcv.changeFromOpenPct != null
                      ? ohlcv.changeFromOpenPct >= 0
                        ? 'num-green'
                        : 'num-red'
                      : '')
                  }
                >
                  {ohlcv && ohlcv.changeFromOpenPct != null
                    ? `${ohlcv.changeFromOpenPct.toFixed(2)}%`
                    : ohlcvLoading
                    ? 'Loading…'
                    : '-'}
                </div>
              </div>
            </div>

            <div className="links-row">
              <a
                href={selectedToken.geckoTerminalUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in GeckoTerminal
              </a>
            </div>

            <div className="chart-wrapper">
              <iframe
                src={`${selectedToken.geckoTerminalUrl}?embed=1&theme=dark`}
                title={`${selectedToken.name} chart`}
                frameBorder="0"
                className="chart-iframe"
                allowFullScreen
              />
            </div>

            <div className="powered">Powered by GeckoTerminal</div>
          </>
        ) : (
          <div className="placeholder">Select a token from the list</div>
        )}
      </div>
    </div>
  )
}
