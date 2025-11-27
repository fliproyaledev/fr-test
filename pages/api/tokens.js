// pages/api/tokens.js

import { TOKENS } from '../../lib/tokens'

async function fetchPoolData(token) {
  const baseUrl = 'https://api.geckoterminal.com/api/v2'
  const url = `${baseUrl}/networks/${token.network}/pools/${token.poolId}`

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    console.error('GeckoTerminal error for', token.id, res.status)
    // hata olsa bile tokeni fallback 0 değerlerle döndürelim
    return {
      ...token,
      priceUsd: 0,
      fdvUsd: 0,
      volume24hUsd: 0,
      liquidityUsd: 0,
      priceChange24h: 0,
      updatedAt: new Date().toISOString(),
    }
  }

  const json = await res.json()
  const attrs = json?.data?.attributes || {}

  return {
    ...token,
    priceUsd: Number(attrs?.price_usd ?? 0),
    fdvUsd: Number(attrs?.fdv_usd ?? 0),
    volume24hUsd: Number(attrs?.volume_usd?.h24 ?? 0),
    liquidityUsd: Number(attrs?.reserve_usd ?? 0),
    priceChange24h: Number(attrs?.price_change_percentage?.h24 ?? 0),
    updatedAt: attrs?.updated_at || new Date().toISOString(),
  }
}

export default async function handler(req, res) {
  try {
    const results = await Promise.all(TOKENS.map(fetchPoolData))
    res.status(200).json({ tokens: results })
  } catch (err) {
    console.error('API /tokens error:', err)
    res.status(500).json({ error: 'Failed to fetch token metrics' })
  }
}
