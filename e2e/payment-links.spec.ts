import { expect, test } from '@playwright/test'

test('creates a payment link and filters the list by status', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/Amount/).fill('2499.50')
  await page.getByLabel(/Description/).fill('Quarterly consulting')
  await page.getByLabel(/Customer email or phone/).fill('customer@example.com')
  await page.getByRole('button', { name: /Create payment link/ }).click()

  await expect(page.getByRole('status')).toContainText('Payment link created')
  await expect(page.getByText('Quarterly consulting')).toBeVisible()
  await expect(page.getByText('customer@example.com')).toBeVisible()
  await page.getByRole('button', { name: /^Active/ }).click()
  await expect(page.getByText('Quarterly consulting')).toBeVisible()
  await page.getByRole('button', { name: /^Paid/ }).click()
  await expect(page.getByText('No paid links')).toBeVisible()
  await page.getByRole('button', { name: /^All/ }).click()
  await page.getByRole('button', { name: 'Mark Quarterly consulting as paid' }).click()
  await page.getByRole('button', { name: /^Paid/ }).click()
  await expect(page.getByText('Quarterly consulting')).toBeVisible()
})
