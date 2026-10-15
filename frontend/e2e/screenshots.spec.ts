// This file captures page screenshots.
// Start the app and configure browser tests as described in README.md.
// Run npm run test:e2e from the frontend folder.
import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
test('capture demo screens', async ({ page }) => {
  if (!process.env.E2E_PASSWORD) throw new Error('Set E2E_PASSWORD before capturing screenshots.');
  await mkdir('../screenshots/generated', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/login');
  await page.screenshot({ path: '../screenshots/generated/01-login.png', fullPage: true });
  await page.getByLabel('Email address').fill(process.env.E2E_EMAIL ?? 'admin@example.com');
  await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading workspace…' })).toHaveCount(0);
  await page.screenshot({ path: '../screenshots/generated/02-overview.png', fullPage: true });
  await page.getByRole('link', { name: 'People', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({ path: '../screenshots/generated/03-directory.png', fullPage: true });
  await page.getByRole('table').locator('tbody tr').first().getByRole('link').first().click();
  await expect(page.getByRole('heading', { name: 'Employee profile' })).toBeVisible();
  await page.screenshot({ path: '../screenshots/generated/04-profile.png', fullPage: true });
  await page.goto('/employees/new');
  await expect(page.getByRole('heading', { name: 'Add employee' })).toBeVisible();
  await page.screenshot({ path: '../screenshots/generated/05-add-employee.png', fullPage: true });
  await page.getByRole('link', { name: 'Departments', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Departments', exact: true })).toBeVisible();
  await page.screenshot({ path: '../screenshots/generated/06-departments.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/employees');
  await expect(page.getByRole('textbox', { name: 'Search employees' })).toBeVisible();
  await page.screenshot({ path: '../screenshots/generated/07-mobile.png', fullPage: true });
});
