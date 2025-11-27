// pages/daily-open-change.jsx

import { useEffect, useState, useMemo } from 'react'

const fetchJson = (url) => fetch(url).then((r) => r.json())

export default function DailyOpenChangePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        // 1) Tüm tokenlerin temel metrikleri
        const base = await fetchJson('/api/tokens')
        const tokens = base.tokens || []

        // 2) Her token için OHLCV -> open/close/%
        const withOhlcv = await Promise.all(
          tokens.map(async (t) => {
            try {
              const resp = await fetch(`/api/ohlcv?tokenId=${t.id}`)
              if (!resp.ok) {
                return {
                  ...t,
                  todayOpen: null,
                  todayClose: null,
                  changeFromOpenPct: null,
                }
              }
              const data = await resp.json()
              return {
                ...t,
                todayOpen: data.todayOpen,
                todayClose: data.todayClose,
                changeFromOpenPct: data.changeFromOpenPct,
              }
            } catch (e) {
              console.error('ohlcv error for', t.id, e)
              return {
                ...t,
                todayOpen: null,
                todayClose: null,
                changeFromOpenPct: null,
              }
            }
          })
        )

        // 3) % from open'e göre DESC sırala
        withOhlcv.sort((a, b) => {
          const av =
            a.changeFromOpenPct !== null &&
            a.changeFromOpenPct !== undefined
              ? a.changeFromOpenPct
              : -Infinity
          const bv =
            b.changeFromOpenPct !== null &&
            b.changeFromOpenPct !== undefined
              ? b.changeFromOpenPct
              : -Infinity
          return bv - av
        })

        setRows(withOhlcv)
      } catch (e) {
        console.error(e)
        setError('Failed to load daily open change data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredRows = useMemo(() => {
    const s = search.toLowerCase()
    return rows.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.symbol.toLowerCase().includes(s)
    )
  }, [rows, search])

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading daily open changes…</div>
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
      <div className="detail">
        <div className="detail-header">
          <div className="detail-title">
            <div>
              <h2>Daily Open Change</h2>
              <p>
                Based on GeckoTerminal daily candles (open vs current
                close)
              </p>
            </div>
          </div>
          <div className="detail-price">
            <a href="/" style={{ fontSize: 13, color: '#93c5fd' }}>
              ← Back to main view
            </a>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            className="search"
            placeholder="Search by name or symbol…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Aynı tablo stilini kullanıyoruz */}
        <div className="table-header">
          <span className="col-name">Token</span>
          <span className="col-num">Day Open</span>
          <span className="col-num">Last Close</span>
          <span className="col-num">% from Open</span>
          <span className="col-num">24h % (spot)</span>
          <span className="col-num">24h Vol</span>
        </div>

        <div className="table-body">
          {filteredRows.map((t) => (
            <div key={t.id} className="row">
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

              {/* Day Open */}
              <span className="col-num">
                {t.todayOpen != null
                  ? `$${t.todayOpen.toFixed(6)}`
                  : '-'}
              </span>

              {/* Last Close */}
              <span className="col-num">
                {t.todayClose != null
                  ? `$${t.todayClose.toFixed(6)}`
                  : '-'}
              </span>

              {/* % from Open */}
              <span
                className={
                  'col-num ' +
                  (t.changeFromOpenPct != null
                    ? t.changeFromOpenPct >= 0
                      ? 'num-green'
                      : 'num-red'
                    : '')
                }
              >
                {t.changeFromOpenPct != null
                  ? `${t.changeFromOpenPct.toFixed(2)}%`
                  : '-'}
              </span>

              {/* 24h % (şu an kullandığın spot fiyat değişimi) */}
              <span
                className={
                  'col-num ' +
                  (t.priceChange24h >= 0 ? 'num-green' : 'num-red')
                }
              >
                {t.priceChange24h.toFixed(2)}%
              </span>

              {/* 24h Vol */}
              <span className="col-num">
                $
                {t.volume24hUsd.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
