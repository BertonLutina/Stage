const { test, expect } = require('@playwright/test');

/**
 * The Stage web app is auth- and CORS-gated, so the screens behind login can't
 * load real data from a browser on localhost. These tests cover the public
 * (unauthenticated) screens — Welcome, Login, Signup — and assert each renders
 * its key copy, capturing a screenshot of every screen for a visual record.
 */

test.describe('Stage — public screens (Expo Web)', () => {
  test('Welcome shows the brand lockup, tagline and CTAs', async ({ page }) => {
    await page.goto('/auth/welcome');
    await expect(page.getByText('Your club, your contracts, your tournaments. All in one place.')).toBeVisible();
    await expect(page.getByText('Create Account', { exact: true })).toBeVisible();
    await expect(page.getByText('I already have an account')).toBeVisible();
    await page.screenshot({ path: 'e2e/__screenshots__/welcome.png', fullPage: true });
  });

  test('Login shows the sign-in form and social providers', async ({ page }) => {
    await page.goto('/auth/loginscreen');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Sign in to get back to your club.')).toBeVisible();
    await expect(page.getByText('Sign in', { exact: true })).toBeVisible();
    await expect(page.getByText('Don', { exact: false })).toBeVisible(); // "Don't have an account?"
    await page.screenshot({ path: 'e2e/__screenshots__/login.png', fullPage: true });
  });

  test('Signup shows the create-account form', async ({ page }) => {
    await page.goto('/auth/signupscreen');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByText('Join Stage as a player or club manager.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    await page.screenshot({ path: 'e2e/__screenshots__/signup.png', fullPage: true });
  });
});
