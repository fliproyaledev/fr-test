// pages/api/ohlcv.js
// Get daily OHLCV data for one token (by tokenId)
// Uses GeckoTerminal public API (no API key required)

import { TOKEN_MAP } from '../../lib/tokens'

export default async function handler(req, res) {
  const { tokenId } = req.query

  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId is required' })
  }

  const token = TOKEN_MAP[tokenId]

  if (!token) {
    return res.status(400).json({ error: `Unknown tokenId: ${tokenId}` })
  }

  const network = token.network || 'base'
  const poolAddress = token.poolAddress

  if (!poolAddress) {
    return res.status(400).json({ error: 'Token has no poolAddress defined' })
  }

  // Daily candles (1D), last ~30 gün
  const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/day?aggregate=1&limit=30&currency=usd&token=base`

  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!resp.ok) {
      console.error('OHLCV error', resp.status, await resp.text())
      return res.status(500).json({ error: 'Failed to fetch OHLCV data' })
    }

    const json = await resp.json()
    const list = json?.data?.attributes?.ohlcv_list || []

    // Convert [ts, open, high, low, close, volume] -> objects
    const candles = list.map(([ts, o, h, l, c, v]) => ({
      timestamp: ts * 1000, // ms
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v,
    }))

    let todayOpen = null
    let todayClose = null
    let changeFromOpenPct = null

    if (candles.length > 0) {
      const latest = candles[candles.length - 1] // son gün mumu
      todayOpen = latest.open
      todayClose = latest.close
      if (todayOpen > 0) {
        changeFromOpenPct = ((todayClose - todayOpen) / todayOpen) * 100
      }
    }

    return res.status(200).json({
      candles,
      todayOpen,
      todayClose,
      changeFromOpenPct,
    })
  } catch (err) {
    console.error('OHLCV fetch exception:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
