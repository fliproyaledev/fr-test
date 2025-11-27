// pages/api/day-open.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const CG_BASE = 'https://api.coingecko.com/api/v3/onchain'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { network = 'base', pool } = req.query

  if (!pool || typeof pool !== 'string') {
    return res.status(400).json({ error: 'Missing pool param' })
  }

  try {
    const url = `${CG_BASE}/networks/${network}/pools/${pool}/ohlcv/day` +
      `?aggregate=1&limit=5&currency=usd&token=base`

    const cgRes = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
      }
    })

    if (!cgRes.ok) {
      const text = await cgRes.text()
      console.error('CG OHLCV error', cgRes.status, text)
      return res.status(500).json({ error: 'Failed to fetch OHLCV' })
    }

    const data = await cgRes.json()

    const list = data?.data?.attributes?.ohlcv_list as
      | [number, string, string, string, string, string][]
      | undefined

    if (!list || !list.length) {
      return res.status(200).json({
        timestamp: null,
        dayOpen: null,
        lastClose: null
      })
    }

    // 🔥 ÖNEMLİ: En sondaki eleman EN YENİ günlük mum
    const last = list[list.length - 1]
    const [timestamp, open, , , close] = last

    return res.status(200).json({
      timestamp,
      dayOpen: parseFloat(open),
      lastClose: parseFloat(close)
    })
  } catch (err) {
    console.error('day-open handler error', err)
    return res.status(500).json({ error: 'Unexpected error' })
  }
}
