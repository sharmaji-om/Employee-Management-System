// This file tests complete employee and department workflows.
// Start the app and configure browser tests as described in README.md.
// Run npm run test:e2e from the frontend folder.
import { test, expect } from '@playwright/test';
const email = process.env.E2E_EMAIL ?? 'admin@example.com';
const password = process.env.E2E_PASSWORD;
test.beforeEach(async ({ page }) => {
  if (!password) throw new Error('Set E2E_PASSWORD to your local admin password.');
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});
test('employee and department lifecycle, export, and logout', async ({ page }) => {
  const suffix = Date.now();
  const team = `QA Team ${suffix}`;
  const name = `Test Employee ${suffix}`;
  const address = `test.${suffix}@example.com`;
  await page.getByRole('link', { name: 'Departments', exact: true }).click();
  await page.getByRole('button', { name: 'Add department' }).click();
  await page.getByLabel('Department name').fill(team);
  await page.getByLabel('Description').fill('Created by automated browser verification.');
  await page.getByRole('button', { name: 'Save department' }).click();
  await expect(page.getByRole('heading', { name: team, exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'People', exact: true }).click();
  await page.getByRole('link', { name: 'Add employee', exact: true }).click();
  await page.getByRole('button', { name: 'Add employee', exact: true }).click();
  await expect(page.getByText('Enter the full name.')).toBeVisible();
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email address').fill(address);
  await page.getByLabel('Phone number').fill('+91 9876543210');
  await page.getByLabel('Department', { exact: false }).selectOption({ label: team });
  await page.getByLabel('Designation').fill('QA Engineer');
  await page.getByLabel('Date of joining').fill('2024-04-12');
  await page.getByLabel('Annual salary').fill('950000.50');
  await page.getByRole('button', { name: 'Add employee', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Edit profile' }).click();
  await page.getByLabel('Designation').fill('Senior QA Engineer');
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Keep editing' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Senior QA Engineer', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'People', exact: true }).first().click();
  await page.getByRole('textbox', { name: 'Search employees' }).fill(address);
  await expect(page.getByRole('table')).toContainText(name);
  await page.getByLabel('Filter by department').selectOption({ label: team });
  await page.getByLabel('Filter by status').selectOption('ACTIVE');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export results' }).click();
  expect((await download).suggestedFilename()).toBe('northstar-employees.csv');
  await page.getByRole('link', { name: 'Departments', exact: true }).click();
  await page.getByRole('button', { name: `Delete ${team}`, exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Reassign them');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('link', { name: `View ${team} employees` }).click();
  await page.getByRole('link', { name: `View ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Delete employee', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete employee', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'People', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Departments', exact: true }).click();
  await page.getByRole('button', { name: `Delete ${team}`, exact: true }).click();
  await page.getByRole('button', { name: 'Delete department', exact: true }).click();
  await expect(page.getByRole('heading', { name: team, exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.goto('/employees');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});
test('responsive mobile navigation and employee directory', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'People', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'People', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search employees' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
