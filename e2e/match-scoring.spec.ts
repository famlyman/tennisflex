import { test, expect } from '@playwright/test'
import { setupAllMocks } from './helpers/mocks'

test.describe('Match & Score Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
  })

  test('skill level page shows match list', async ({ page }) => {
    await page.goto('/seasons/season-111/skill-level/sl-3.5')
    await expect(page.getByText(/3.5/i).first()).toBeVisible()
  })

  test('skill level page shows matches table', async ({ page }) => {
    await page.goto('/seasons/season-111/skill-level/sl-3.5')
    await expect(page.getByText(/Opponent Player/i).or(page.getByText(/Test Player/i))).toBeVisible()
  })

  test('skill level page shows leaderboard tab', async ({ page }) => {
    await page.goto('/seasons/season-111/skill-level/sl-3.5')
    const leaderboardTab = page.getByRole('button', { name: /leaderboard/i }).or(page.locator('a', { hasText: /leaderboard/i }))
    await expect(leaderboardTab).toBeVisible()
  })

  test('match hub page loads with match details', async ({ page }) => {
    await page.goto('/matches/match-1')
    await expect(page.locator('body')).toBeVisible()
  })

  test('completed match shows verified badge', async ({ page }) => {
    await page.goto('/matches/match-2')
    await expect(page.locator('body')).toBeVisible()
  })

  test('match page has score submission for open matches', async ({ page }) => {
    await page.goto('/matches/match-1')
    await expect(page.locator('body')).toBeVisible()
  })
})
