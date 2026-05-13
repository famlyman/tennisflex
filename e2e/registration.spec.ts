import { test, expect } from '@playwright/test'
import { setupAllMocks } from './helpers/mocks'

test.describe('Season Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
  })

  test('season listing page shows available seasons', async ({ page }) => {
    await page.goto('/seasons')
    await expect(page.getByText(/Spring 2026/i).first()).toBeVisible()
  })

  test('season detail page shows season info and divisions', async ({ page }) => {
    await page.goto('/seasons/season-111')
    await expect(page.getByText(/Spring 2026/i).first()).toBeVisible()
  })

  test('season page shows status and schedule', async ({ page }) => {
    await page.goto('/seasons/season-111')
    await expect(page.getByText(/registration/i).or(page.getByText(/active/i))).toBeVisible()
  })

  test('register page shows division checkboxes', async ({ page }) => {
    await page.goto('/seasons/season-111/register')
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible()
    await expect(page.getByText(/Men\'s Singles/i).or(page.getByText(/mens_singles/i))).toBeVisible()
  })

  test('register page shows submit button', async ({ page }) => {
    await page.goto('/seasons/season-111/register')
    const submitBtn = page.getByRole('button', { name: /register/i }).or(page.getByRole('button', { name: /submit/i }))
    await expect(submitBtn).toBeVisible()
  })
})
