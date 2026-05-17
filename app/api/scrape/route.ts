import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

export async function POST(req: NextRequest) {
  const { setNumber } = await req.json()
  if (!setNumber) return NextResponse.json({ error: 'setNumber required' }, { status: 400 })

  // Normalize set number: ensure it ends with -1 if no suffix given
  const normalized = /\-\d+$/.test(setNumber) ? setNumber : `${setNumber}-1`

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // First load the set page to get the slug from redirect/title
    const baseUrl = `https://www.brickeconomy.com/set/${normalized}/`
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Extract data
    const data: Record<string, string | null> = {}

    data.set_name = await page.$eval('h1', el => el.textContent?.trim() ?? null).catch(() => null)
    data.brickeconomy_url = page.url()

    // Theme
    data.theme = await page.$eval(
      'a[href*="/sets/theme-"]',
      el => el.textContent?.trim() ?? null
    ).catch(() => null)

    // Piece count
    data.piece_count = await page.$$eval('div.set-stats div', divs => {
      for (const d of divs) {
        const label = d.querySelector('.set-stats-label')?.textContent?.toLowerCase() ?? ''
        if (label.includes('piece')) {
          return d.querySelector('.set-stats-value')?.textContent?.replace(/,/g, '').trim() ?? null
        }
      }
      return null
    }).catch(() => null)

    // Current value — look for the retail/value price
    data.current_value = await page.$$eval('div', divs => {
      for (const d of divs) {
        const text = d.textContent ?? ''
        if (text.includes('Current Value') || text.includes('Value New')) {
          const match = text.match(/\$[\d,]+\.?\d*/)
          if (match) return match[0].replace(/[$,]/g, '')
        }
      }
      return null
    }).catch(() => null)

    // Screenshot of the value section
    let screenshotBase64: string | null = null
    const valueSection = await page.$('.CTAbuttons, .set-col-right, [class*="value"], #ValueNew').catch(() => null)
    if (valueSection) {
      const buf = await valueSection.screenshot({ type: 'png' })
      screenshotBase64 = buf.toString('base64')
    } else {
      // fallback: screenshot top portion of page
      const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 600 } })
      screenshotBase64 = buf.toString('base64')
    }

    return NextResponse.json({
      set_number: normalized,
      set_name: data.set_name,
      theme: data.theme,
      piece_count: data.piece_count ? parseInt(data.piece_count, 10) : null,
      current_value: data.current_value ? parseFloat(data.current_value) : null,
      brickeconomy_url: data.brickeconomy_url,
      screenshot_base64: screenshotBase64,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await browser?.close()
  }
}
