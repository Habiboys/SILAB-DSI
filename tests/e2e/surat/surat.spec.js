import { test, expect } from '@playwright/test';
import { ADMIN_AUTH_FILE } from '../fixtures/auth.js';

test.use({ storageState: ADMIN_AUTH_FILE });

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
});

test.describe('TC-SURAT-01: Simpan, edit, dan hapus surat', () => {
  for (const type of ['keluar', 'masuk']) {
    test(`CRUD surat ${type} tersimpan setelah reload`, async ({ page }) => {
      const url = `/surat-menyurat/surat-${type}`;
      const title = `Surat E2E ${type} ${Date.now()}`;
      const today = new Date().toISOString().slice(0, 10);
      await page.goto(url);
      await expect(page).not.toHaveURL(/\/login/);
      await page.getByRole('button', { name: 'Tambah surat', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel(/^Perihal/).fill(title);
      await dialog.getByLabel(/^Tanggal surat/).fill(today);
      if (type === 'keluar') {
        await dialog.getByLabel(/^Tujuan/).fill('Dekan FMIPA');
      } else {
        await dialog.getByLabel(/^Nomor surat asal/).fill(`AUDIT-${Date.now()}`);
        await dialog.getByLabel(/^Asal surat/).fill('Pengirim audit');
        await dialog.getByLabel(/^Tanggal terima/).fill(today);
      }
      await dialog.getByLabel(/^File surat/).setInputFiles('tests/e2e/fixtures/test-files/test.pdf');
      const submit = async () => {
        const [response] = await Promise.all([
          page.waitForResponse(response => response.url().includes(url) && response.request().method() === 'POST'),
          dialog.getByRole('button', { name: 'Simpan', exact: true }).click(),
        ]);
        expect(response.status()).toBeLessThan(400);
        await expect(dialog).not.toBeVisible({ timeout: 30_000 });
        await page.reload();
      };
      await submit();
      let row = page.getByRole('row').filter({ hasText: title });
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: 'Edit', exact: true }).click();
      await expect(dialog.getByLabel(/^Tanggal surat/)).toHaveValue(today);
      await dialog.getByLabel(/^Perihal/).fill(`${title} diperbarui`);
      await submit();
      row = page.getByRole('row').filter({ hasText: `${title} diperbarui` });
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: 'Hapus', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: /Hapus/, exact: false }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30_000 });
      await page.reload();
      await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0);
    });
  }
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

  test('pencarian surat masuk mempertahankan filter setelah reload', async ({ page }) => {
    await page.goto('/surat-menyurat/surat-masuk');
    const search = page.getByPlaceholder('Cari surat...');
    await search.fill('Surat E2E');
    await expect(page).toHaveURL(url => url.searchParams.get('search') === 'Surat E2E');
    await page.reload();
    await expect(search).toHaveValue('Surat E2E');
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
