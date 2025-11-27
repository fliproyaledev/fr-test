// pages/api/day-open.js
// Her token için son günlük candle'ın open & close değerini döner.
// lib/tokens içindeki TOKENS listesini kullanır.

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

  // GeckoTerminal OHLCV endpoint (günlük mumlar)
  const baseUrl = 'https://api.geckoterminal.com/api/v2'
  const url = `${baseUrl}/networks/${network}/pools/${poolId}/ohlcv/day?aggregate=1&limit=10&currency=usd&token=base`

  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!resp.ok) {
      console.error(
        'day-open error',
        resp.status,
        await resp.text().catch(() => '')
      )
      return res
        .status(500)
        .json({ error: 'Failed to fetch OHLCV data' })
    }

    const json = await resp.json()
    const list = json?.data?.attributes?.ohlcv_list || []

    if (!Array.isArray(list) || list.length === 0) {
      return res.status(200).json({
        timestamp: null,
        dayOpen: null,
        lastClose: null,
      })
    }

    // 🔥 ÖNEMLİ: GeckoTerminal'de en sondaki eleman EN YENİ günlük mum
    const last = list[list.length - 1]
    // [timestamp, open, high, low, close, volume]
    const [ts, open, , , close] = last

    return res.status(200).json({
      timestamp: ts * 1000,
      dayOpen: typeof open === 'number' ? open : parseFloat(open),
      lastClose:
        typeof close === 'number' ? close : parseFloat(close),
    })
  } catch (err) {
    console.error('day-open handler exception:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
