import { test, expect } from '@playwright/test';
import { ADMIN_AUTH_FILE, PRAKTIKAN_AUTH_FILE } from '../fixtures/auth.js';

test.describe('TC-AUTH-01: Login valid admin', () => {
  test('admin login redirects to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input#email')).toBeVisible();
    await page.fill('input#email', 'superadmin1@admin.com');
    await page.fill('input#password', 'adminlsd123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});

test.describe('TC-AUTH-01b: Login valid praktikan', () => {
  test('praktikan login redirects to /praktikan/daftar-tugas', async ({ page }) => {
    const email = process.env.TEST_PRAKTIKAN_EMAIL || '12345678_testuser@student.unand.ac.id';
    const password = process.env.TEST_PRAKTIKAN_PASSWORD || '12345678';

    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/praktikan/daftar-tugas', { timeout: 15_000 });
    await expect(page).toHaveURL(/daftar-tugas/);
  });
});

test.describe('TC-AUTH-02: Login gagal', () => {
  test('password salah menampilkan pesan error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'superadmin1@admin.com');
    await page.fill('input#password', 'passwordsalah');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page.locator('body')).toContainText(/These credentials|salah|invalid/i);
  });

  test('field kosong menampilkan validasi', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');

    await expect(page.locator('input#email')).toBeVisible();

    await expect(page).toHaveURL(/login/);
  });
});

test.describe('TC-AUTH-03: Akses tanpa autentikasi', () => {
  test('/dashboard tanpa auth redirect ke /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });

  test('/riwayat-keuangan tanpa auth redirect ke /login', async ({ page }) => {
    await page.goto('/riwayat-keuangan');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });
});

