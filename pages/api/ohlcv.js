// pages/api/ohlcv.js
// Her token için günlük OHLCV verisi (GeckoTerminal) + bugünkü open/close/% değişim

import { TOKENS } from '../../lib/tokens'

export default async function handler(req, res) {
  const { tokenId } = req.query

  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId is required' })
  }

  const token = TOKENS.find((t) => t.id === tokenId)

  if (!token) {
    return res
      .status(400)
      .json({ error: `Unknown tokenId: ${tokenId}` })
  }

  const network = token.network || 'base'
  const poolId = token.poolId

  if (!poolId) {
    return res
      .status(400)
      .json({ error: 'Token has no poolId defined' })
  }

  const baseUrl = 'https://api.geckoterminal.com/api/v2'
  // Günlük mumlar (1D), son 30 gün
  const url = `${baseUrl}/networks/${network}/pools/${poolId}/ohlcv/day?aggregate=1&limit=30&currency=usd&token=base`

  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!resp.ok) {
      console.error(
        'OHLCV error',
        resp.status,
        await resp.text().catch(() => '')
      )
      return res
        .status(500)
        .json({ error: 'Failed to fetch OHLCV data' })
    }

    const json = await resp.json()
    const list = json?.data?.attributes?.ohlcv_list || []

    // [ts, open, high, low, close, volume] -> objelere çevir
    const candles = list.map(([ts, o, h, l, c, v]) => ({
      timestamp: ts * 1000,
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
