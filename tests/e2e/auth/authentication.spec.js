import { test, expect } from '@playwright/test';
import { ADMIN_AUTH_FILE, PRAKTIKAN_AUTH_FILE } from '../fixtures/auth.js';

// ── TC-AUTH-01: Login valid admin ─────────────────────────────────────────────
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

// ── TC-AUTH-01b: Login valid praktikan ───────────────────────────────────────
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

// ── TC-AUTH-02: Login gagal — password salah ──────────────────────────────────
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
    // HTML5 required validation atau server-side
    await expect(page.locator('input#email')).toBeVisible();
    // Tetap di halaman login
    await expect(page).toHaveURL(/login/);
  });
});

// ── TC-AUTH-03: Akses route tanpa auth → redirect /login ─────────────────────
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

// ── TC-AUTH-03b: Praktikan tidak bisa akses route staff ──────────────────────
test.describe('TC-AUTH-03b: Praktikan akses route staff', () => {
  test.use({ storageState: PRAKTIKAN_AUTH_FILE });

  test('praktikan GET /riwayat-keuangan mendapat 403 atau redirect', async ({ page }) => {
    const response = await page.goto('/riwayat-keuangan');
    const url = page.url();
    const isBlocked = response?.status() === 403 || !url.includes('riwayat-keuangan');
    const hasNoContent = await page.locator('button:has-text("Tambah Transaksi")').count() === 0;
    expect(isBlocked || hasNoContent).toBeTruthy();
  });
});

// ── TC-AUTH-04: Redirect dashboard sesuai role ────────────────────────────────
test.describe('TC-AUTH-04: Redirect sesuai role', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('admin GET / tidak diarahkan ke /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Superadmin bisa diarahkan ke /dashboard, atau halaman lain sesuai state
    // — yang penting tidak kembali ke /login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('h1, h2, main').first()).toBeVisible();
  });
});
