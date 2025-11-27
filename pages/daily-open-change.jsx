// pages/daily-open-change.tsx
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type TokenRow = {
  id: string
  name: string
  symbol: string
  logoUrl: string
  priceUsd: number
  volume24hUsd: number
  priceChange24h: number
  poolAddress: string
  network: string
}

type RowWithOpen = TokenRow & {
  dayOpen: number | null
  lastClose: number | null
  pctFromOpen: number | null
}

export default function DailyOpenChangePage() {
  const [rows, setRows] = useState<RowWithOpen[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        // Ana token listesini çekiyoruz (FDV, price, 24h %, volume vs)
        const tokenRes = await fetch('/api/tokens')
        const tokenJson = await tokenRes.json()
        const tokens: TokenRow[] = tokenJson.tokens

        // Her token için günlük candle open/close çek
        const rowsWithOpen: RowWithOpen[] = await Promise.all(
          tokens.map(async (t) => {
            try {
              const ohlcvRes = await fetch(
                `/api/day-open?network=${t.network}&pool=${t.poolAddress}`
              )
              const ohlcvJson = await ohlcvRes.json()

              const dayOpen =
                typeof ohlcvJson.dayOpen === 'number'
                  ? ohlcvJson.dayOpen
                  : null
              const lastClose =
                typeof ohlcvJson.lastClose === 'number'
                  ? ohlcvJson.lastClose
                  : null

              let pctFromOpen: number | null = null
              if (dayOpen && t.priceUsd) {
                pctFromOpen = ((t.priceUsd - dayOpen) / dayOpen) * 100
              }

              return {
                ...t,
                dayOpen,
                lastClose,
                pctFromOpen
              }
            } catch {
              // Bir token için OHLCV patlarsa, en azından diğer kolonlar çalışsın
              return {
                ...t,
                dayOpen: null,
                lastClose: null,
                pctFromOpen: null
              }
            }
          })
        )

        setRows(rowsWithOpen)
      } catch (e) {
        console.error(e)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) =>
      `${r.name} ${r.symbol}`.toLowerCase().includes(q)
    )
  }, [rows, search])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Daily Open Change
          </h1>
          <p className="text-xs text-slate-400">
            Based on GeckoTerminal daily candles (open vs last close)
          </p>
        </div>
        <Link
          href="/"
          className="text-xs text-sky-400 hover:text-sky-300 hover:underline"
        >
          ← Back to main view
        </Link>
      </header>

      <main className="px-6 py-4">
        <div className="mb-4 max-w-md">
          <input
            type="text"
            placeholder="Search by name or symbol..."
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && (
          <div className="text-sm text-slate-400">Loading daily candles…</div>
        )}
        {error && (
          <div className="text-sm text-red-400 mb-2">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80 text-xs text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Token</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Day Open
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Last Close (candle)
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    % from Open
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    24h % (spot)
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    24h Vol
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-slate-800/60 hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      <img
                        src={t.logoUrl}
                        alt={t.symbol}
                        className="h-6 w-6 rounded-full bg-slate-900 object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="text-slate-100 text-xs font-medium">
                          {t.name}
                        </span>
                        <span className="text-[10px] uppercase text-slate-500">
                          {t.symbol}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      {t.dayOpen != null
                        ? `$${t.dayOpen.toFixed(6)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      {t.lastClose != null
                        ? `$${t.lastClose.toFixed(6)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      {t.pctFromOpen != null ? (
                        <span
                          className={
                            t.pctFromOpen >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        >
                          {t.pctFromOpen >= 0 ? '+' : ''}
                          {t.pctFromOpen.toFixed(2)}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      <span
                        className={
                          t.priceChange24h >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }
                      >
                        {t.priceChange24h >= 0 ? '+' : ''}
                        {t.priceChange24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-300">
                      {t.volume24hUsd
                        ? `$${t.volume24hUsd.toLocaleString('en-US', {
                            maximumFractionDigits: 0
                          })}`
                        : '—'}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-xs text-slate-500"
                    >
                      No tokens match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
