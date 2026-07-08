// Parses Bumpa's product export CSV. Only "product" rows are used for
// inventory sync — "variant" rows are skipped since Bumpa's per-variant
// pricing has no safe equivalent to write into our product schema.

export type BumpaRow = {
  bumpaId: string
  title: string
  price: number | null
  cost: number | null
  stock: number | null
}

// Full-document CSV parser: handles quoted fields containing commas,
// doubled quotes (""), and literal newlines (Bumpa descriptions embed real
// line breaks inside quoted fields, so a naive per-line split would corrupt
// rows).
function parseCSVDocument(text: string): string[][] {
  const cleaned = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field); field = ''
    } else if (ch === '\r') {
      // ignore — paired \n below ends the row
    } else if (ch === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  return rows.filter(r => r.some(v => v.trim() !== ''))
}

function toNumber(v: string | undefined): number | null {
  if (!v) return null
  const n = parseFloat(v.replace(/,/g, '').trim())
  return isNaN(n) ? null : n
}

export function parseBumpaCSV(text: string): BumpaRow[] {
  const rows = parseCSVDocument(text)
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim().toLowerCase())
  const col = (name: string) => headers.findIndex(h => h === name.toLowerCase())

  const productIdIdx = col('Product ID')
  const rowTypeIdx    = col('Row Type')
  const titleIdx      = col('Title')
  const priceIdx      = col('Price')
  const costIdx       = col('Cost')
  const stockIdx      = col('Stock')

  if (productIdIdx === -1 || titleIdx === -1) return []

  const out: BumpaRow[] = []
  for (const r of rows.slice(1)) {
    const rowType = rowTypeIdx !== -1 ? r[rowTypeIdx]?.trim().toLowerCase() : 'product'
    if (rowType !== 'product') continue // skip variant rows

    const bumpaId = r[productIdIdx]?.trim()
    const title = r[titleIdx]?.trim()
    if (!bumpaId || !title) continue

    out.push({
      bumpaId,
      title,
      price: priceIdx !== -1 ? toNumber(r[priceIdx]) : null,
      cost:  costIdx !== -1 ? toNumber(r[costIdx]) : null,
      stock: stockIdx !== -1 ? (r[stockIdx]?.trim() !== '' ? parseInt(r[stockIdx], 10) : null) : null,
    })
  }
  return out
}
