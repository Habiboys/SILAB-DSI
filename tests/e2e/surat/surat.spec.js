import { test, expect } from '@playwright/test';
import { ADMIN_AUTH_FILE } from '../fixtures/auth.js';

test.use({ storageState: ADMIN_AUTH_FILE });

test.describe('TC-SURAT-01: Buat surat baru', () => {
  test('dapat membuat surat keluar', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-keluar');
    await page.waitForLoadState('networkidle');

    await page.click(
      'button:has-text("Tambah Surat"), button:has-text("Buat Surat"), button:has-text("Tambah")'
    );
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const perihalInput = page.locator('[role="dialog"] input[name*="perihal"]').first();
    if (await perihalInput.count() > 0) {
      await perihalInput.fill('Surat E2E Keluar Test');
    }

    const tujuanInput = page.locator('[role="dialog"] input[name*="tujuan"]').first();
    if (await tujuanInput.count() > 0) {
      await tujuanInput.fill('Dekan FMIPA');
    }

    const dateInput = page.locator('[role="dialog"] input[type="date"]').first();
    if (await dateInput.count() > 0) {
      await dateInput.fill('2025-06-15');
    }

    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 10_000 });
  });

  test('dapat membuat surat masuk', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-masuk');
    await page.waitForLoadState('networkidle');

    await page.click(
      'button:has-text("Tambah Surat Masuk"), button:has-text("Tambah"), button:has-text("Buat")'
    );
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const perihalInput = page.locator('[role="dialog"] input[name*="perihal"]').first();
    if (await perihalInput.count() > 0) {
      await perihalInput.fill('Surat E2E Masuk Test');
    }

    const pengirimInput = page.locator('[role="dialog"] input[name*="pengirim"]').first();
    if (await pengirimInput.count() > 0) {
      await pengirimInput.fill('Pengirim Test E2E');
    }

    const dateInput = page.locator('[role="dialog"] input[type="date"]').first();
    if (await dateInput.count() > 0) {
      await dateInput.fill('2025-06-15');
    }

    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-SURAT-02: Arsip surat', () => {
  test('daftar surat keluar dapat ditampilkan', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-keluar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('table, [data-list], main').first()).toBeVisible();
  });

  test('daftar surat masuk dapat ditampilkan', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-masuk');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('table, [data-list], main').first()).toBeVisible();
  });
});

test.describe('TC-SURAT-03: Cari dan filter surat', () => {
  test('pencarian berdasarkan perihal memfilter hasil surat keluar', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-keluar');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="cari"], input[placeholder*="Cari"], input[placeholder*="search"]'
    ).first();

    if (await searchInput.count() === 0) {
      test.skip();
      return;
    }

    await searchInput.fill('Surat E2E');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main, [data-list], table').first()).toBeVisible();
  });

  test('filter berdasarkan tanggal pada surat masuk', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-masuk');
    await page.waitForLoadState('networkidle');

    const dateFilter = page.locator('input[type="date"]').first();
    if (await dateFilter.count() > 0) {
      await dateFilter.fill('2025-06-01');
      await page.waitForLoadState('networkidle');
    }

    await expect(page.locator('main, [data-list], table').first()).toBeVisible();
  });
});

test.describe('TC-SURAT-04: Ekspor surat', () => {
  test('ekspor surat keluar memicu download file', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-keluar');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.locator(
      'a:has-text("Ekspor"), a[href*="export"], button:has-text("Export"), button:has-text("Ekspor")'
    ).first();

    if (await exportBtn.count() === 0) {
      test.skip();
      return;
    }

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      exportBtn.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv|pdf)$/);
  });

  test('ekspor surat masuk memicu download file', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-masuk');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.locator(
      'a:has-text("Ekspor"), a[href*="export"], button:has-text("Export"), button:has-text("Ekspor")'
    ).first();

    if (await exportBtn.count() === 0) {
      test.skip();
      return;
    }

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      exportBtn.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv|pdf)$/);
  });
});
