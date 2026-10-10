import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('F01 player signs in', () => {
  test('F01-H1 landing shows the Discord login', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Torchlight/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Login com Discord/ })).toBeVisible()
  })

  test('F01-H2 login page loads', async ({ page }) => {
    const res = await page.goto('/login')
    expect(res?.status()).toBe(200)
  })

  for (const path of ['/home', '/gm', '/character-creator', '/sheet/abc', '/sheet/abc/edit']) {
    test(`F01-N1 logged out ${path} goes to /login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  }

  test('F01-H3 login page images load while logged out', async ({ request }) => {
    const res = await request.get('/skull-icon.png', { maxRedirects: 0 })
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image')
  })

  test('F01-H5 the server clock answers live, logged out, uncached', async ({ request }) => {
    const before = Date.now()
    const res = await request.get('/api/time', { maxRedirects: 0 })
    expect(res.status()).toBe(200)
    expect(res.headers()['cache-control']).toContain('no-store')
    const { now } = await res.json()
    expect(Math.abs(now - before)).toBeLessThan(10_000)
  })

  test('F01-N2 Discord relay refuses anonymous posts', async ({ request }) => {
    const res = await request.post('/api/discord', { data: { kind: 'roll' }, maxRedirects: 0 })
    expect([401, 307, 302]).toContain(res.status())
  })

  test('F01-A1 landing has no serious accessibility violations', async ({ page }) => {
    await page.goto('/')
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([])
  })
})
