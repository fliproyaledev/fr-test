// pages/daily-open-change.jsx

import { useEffect, useMemo, useState } from 'react'

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
        setError(null)

        // 1) Temel token listesi
        const base = await fetchJson('/api/tokens')
        const tokens = base.tokens || []

        // 2) Her token için /api/day-open çağır
        const withOpen = await Promise.all(
          tokens.map(async (t) => {
            try {
              const res = await fetch(
                `/api/day-open?tokenId=${t.id}`
              )
              if (!res.ok) {
                return {
                  ...t,
                  dayOpen: null,
                  lastCloseCandle: null,
                  pctFromOpen: null,
                }
              }
              const data = await res.json()

              const dayOpen = data.dayOpen ?? null
              const lastCloseCandle = data.lastClose ?? null

              let pctFromOpen = null
              if (dayOpen && t.priceUsd) {
                pctFromOpen =
                  ((t.priceUsd - dayOpen) / dayOpen) * 100
              }

              return {
                ...t,
                dayOpen,
                lastCloseCandle,
                pctFromOpen,
              }
            } catch (e) {
              console.error('day-open per token error', t.id, e)
              return {
                ...t,
                dayOpen: null,
                lastCloseCandle: null,
                pctFromOpen: null,
              }
            }
          })
        )

        // 3) % from open'e göre DESC sırala
        withOpen.sort((a, b) => {
          const av =
            a.pctFromOpen != null ? a.pctFromOpen : -Infinity
          const bv =
            b.pctFromOpen != null ? b.pctFromOpen : -Infinity
          return bv - av
        })

        setRows(withOpen)
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
        <div className="loading">Loading daily candles…</div>
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
                price)
              </p>
            </div>
          </div>
          <div className="detail-price">
            <a href="/" className="nav-link-small">
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

        <div className="table-header">
          <span className="col-name">Token</span>
          <span className="col-num">Day Open</span>
          <span className="col-num">Last Close (candle)</span>
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
                {t.dayOpen != null
                  ? `$${t.dayOpen.toFixed(6)}`
                  : '-'}
              </span>

              {/* Last Close (candle) */}
              <span className="col-num">
                {t.lastCloseCandle != null
                  ? `$${t.lastCloseCandle.toFixed(6)}`
                  : '-'}
              </span>

              {/* % from Open */}
              <span
                className={
                  'col-num ' +
                  (t.pctFromOpen != null
                    ? t.pctFromOpen >= 0
                      ? 'num-green'
                      : 'num-red'
                    : '')
                }
              >
                {t.pctFromOpen != null
                  ? `${t.pctFromOpen.toFixed(2)}%`
                  : '-'}
              </span>

              {/* 24h % (spot) */}
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
