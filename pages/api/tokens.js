// pages/api/tokens.js

import { TOKENS } from '../../lib/tokens'

async function fetchPoolData(token) {
  const baseUrl = 'https://api.geckoterminal.com/api/v2'
  const url = `${baseUrl}/networks/${token.network}/pools/${token.poolId}`

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      console.error('GeckoTerminal error for', token.id, res.status)
      throw new Error(`status ${res.status}`)
    }

    const json = await res.json()
    const attrs = json?.data?.attributes || {}

    // ---- FİYAT (USD) ----
    // Çoğu pool için alt token base_token olduğu için base_token_price_usd bizim token fiyatımız
    const priceUsd = Number(
      attrs.base_token_price_usd ??
        attrs.token_price_usd ?? // bazı endpointlerde bu isimle gelebiliyor
        attrs.quote_token_price_usd ??
        0
    )

    // ---- LİKİDİTE (USD) ----
    const liquidityUsd = Number(
      attrs.reserve_in_usd ??
        attrs.reserve_usd ??
        0
    )

    // ---- 24 SAATLİK HACİM (USD) ----
    const volume24hUsd = Number(
      (attrs.volume_usd &&
        (attrs.volume_usd.h24 ?? attrs.volume_usd['24h'])) ??
        0
    )

    // ---- FDV ----
    const fdvUsd = Number(attrs.fdv_usd ?? attrs.fdv ?? 0)

    // ---- 24 SAATLİK FİYAT DEĞİŞİMİ (%) ----
    const priceChange24h = Number(
      (attrs.price_change_percentage &&
        (attrs.price_change_percentage.h24 ??
          attrs.price_change_percentage['24h'])) ??
        0
    )

    return {
      ...token,
      priceUsd,
      fdvUsd,
      volume24hUsd,
      liquidityUsd,
      priceChange24h,
      updatedAt: attrs.updated_at || new Date().toISOString(),
    }
  } catch (e) {
    console.error('Pool fetch error for', token.id, e.message)
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
