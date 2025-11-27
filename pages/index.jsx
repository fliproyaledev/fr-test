// pages/index.jsx

import { useEffect, useMemo, useState } from 'react'

const fetcher = (url) => fetch(url).then((r) => r.json())

export default function Home() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')

  // --- Token listesi ---
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

  // --- Seçili token için "day open / last price / % from open" ---
  const dayOpen = useMemo(() => {
    if (!selectedToken) return null
    const price = selectedToken.priceUsd
    const pct = selectedToken.priceChange24h
    if (price == null || pct == null) return null

    const ratio = 1 + pct / 100
    if (ratio <= 0) return null

    return price / ratio
  }, [selectedToken])

  const dayClose = selectedToken?.priceUsd ?? null
  const changeFromOpenPct =
    selectedToken?.priceChange24h ?? null

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
      {/* SOL: TOKEN TABLOSU */}
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

      {/* SAĞ: DETAY + GRAFİK */}
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
                  <div className="detail-title-mainline">
                    <h2>{selectedToken.name}</h2>
                    <span className="detail-inline-price">
                      ${selectedToken.priceUsd.toFixed(6)}
                    </span>
                    <span
                      className={
                        'detail-inline-change ' +
                        (selectedToken.priceChange24h >= 0
                          ? 'num-green'
                          : 'num-red')
                      }
                    >
                      {selectedToken.priceChange24h.toFixed(2)}% 24h
                    </span>
                  </div>
                  <p>{selectedToken.symbol}</p>
                </div>
              </div>

              <div className="detail-price">
                <a href="/daily-open-change" className="nav-link-small">
                  Daily Open Change →
                </a>
              </div>
            </div>

            {/* Ana istatistikler */}
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
                  {selectedToken.liquidityUsd.toLocaleString(
                    'en-US',
                    { maximumFractionDigits: 0 }
                  )}
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

            {/* 24h open/close/% */}
            <div className="detail-grid" style={{ marginTop: 8 }}>
              <div className="stat-card">
                <div className="stat-label">Day Open (24h)</div>
                <div className="stat-value">
                  {dayOpen != null
                    ? `$${dayOpen.toFixed(6)}`
                    : '-'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Last Price</div>
                <div className="stat-value">
                  {dayClose != null
                    ? `$${dayClose.toFixed(6)}`
                    : '-'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">% from Open</div>
                <div
                  className={
                    'stat-value ' +
                    (changeFromOpenPct != null
                      ? changeFromOpenPct >= 0
                        ? 'num-green'
                        : 'num-red'
                      : '')
                  }
                >
                  {changeFromOpenPct != null
                    ? `${changeFromOpenPct.toFixed(2)}%`
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
