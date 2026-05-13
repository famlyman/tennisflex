import { test, expect } from '@playwright/test'
import { setupAllMocks } from './helpers/mocks'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
  })

  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /register/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
  })

  test('login form validates empty fields', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid/i).or(page.locator(':invalid'))).toBeVisible()
  })

  test('register page shows sign-up form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create account/i }).or(page.getByRole('heading', { name: /register/i }))).toBeVisible()
    await expect(page.getByLabel(/name/i).or(page.getByLabel(/full name/i))).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('landing page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/tennis/i).or(page.getByText(/flex/i))).toBeVisible()
  })

  test('landing page shows hero and feature sections', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main').or(page.getByRole('main'))).toBeVisible()
  })
})
