import { test, expect } from '@playwright/test'

const TIMESTAMP = Date.now()
const ADMIN_EMAIL = `admin+${TIMESTAMP}@test.subfill.dev`
const ADMIN_PASSWORD = 'TestPass123!'
const SUB_EMAIL = `sub+${TIMESTAMP}@test.subfill.dev`
const SUB_PASSWORD = 'TestPass123!'

test.describe('unauthenticated redirects', () => {
  for (const path of ['/dashboard', '/feed', '/post-absence', '/pool', '/my-shifts', '/profile']) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL('/login')
    })
  }
})

test.describe('login page', () => {
  test('renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'SubFill' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows error on bad credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('links to both signup pages', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: 'Create organisation' })).toHaveAttribute('href', '/signup')
    await expect(page.getByRole('link', { name: 'Sign up here' })).toHaveAttribute('href', '/substitute-signup')
  })
})

test.describe('admin signup', () => {
  test('renders correctly', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByText('Create your organisation account')).toBeVisible()
    await expect(page.getByLabel('Organisation name')).toBeVisible()
    await expect(page.getByLabel('Organisation type')).toBeVisible()
    await expect(page.getByLabel('Your name')).toBeVisible()
  })

  test('creates org and redirects to /dashboard', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Organisation name').fill('Test School')
    await page.getByLabel('Your name').fill('Test Admin')
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })
})

test.describe('admin dashboard', () => {
  test('is accessible after login and does not redirect to /login', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Organisation name').fill('Dashboard Test Org')
    await page.getByLabel('Your name').fill('Dashboard Admin')
    await page.getByLabel('Email').fill(`dashboardadmin+${TIMESTAMP}@test.subfill.dev`)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL('/dashboard', { timeout: 10000 })
    await page.goto('/dashboard')
    await expect(page).not.toHaveURL('/login')
  })
})

test.describe('substitute signup', () => {
  test('renders correctly', async ({ page }) => {
    await page.goto('/substitute-signup')
    await expect(page.getByText('Create your substitute account')).toBeVisible()
    await expect(page.getByLabel('Full name')).toBeVisible()
  })

  test('creates account and redirects to /feed', async ({ page }) => {
    await page.goto('/substitute-signup')
    await page.getByLabel('Full name').fill('Test Sub')
    await page.getByLabel('Email').fill(SUB_EMAIL)
    await page.getByLabel('Password').fill(SUB_PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL('/feed', { timeout: 10000 })
  })
})
