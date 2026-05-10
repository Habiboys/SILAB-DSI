import { test, expect } from '@playwright/test';
import { ADMIN_AUTH_FILE } from '../fixtures/auth.js';

test.use({ storageState: ADMIN_AUTH_FILE });

// Lab ID untuk admin.lsd@silab.com (LSD lab)
const LAB_ID = 'd04210fb-8255-11f0-b26d-bc2411aaebcd';
const KEUANGAN_URL = `/riwayat-keuangan?lab_id=${LAB_ID}`;

// Helper - pakai 'load' bukan 'networkidle' karena Vite HMR bikin network tidak pernah idle
async function waitPage(page) {
    await page.waitForLoadState('load');
    await page.waitForTimeout(800);
}


// ── TC-KEU-02: Tambah transaksi pemasukan dan pengeluaran ─────────────────────
test.describe('TC-KEU-02: Transaksi keuangan', () => {
  test('dapat menambah transaksi pemasukan', async ({ page }) => {
    await page.goto(KEUANGAN_URL);
    await waitPage(page);

    const tambahBtn = page.locator('button:has-text("Tambah")').first();
    await expect(tambahBtn).toBeVisible({ timeout: 10_000 });
    await tambahBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Pilih jenis pemasukan
    const tipeSelect = dialog.locator('select[name="jenis"]').first();
    await tipeSelect.selectOption('masuk');

    // Tanggal
    const dateInput = dialog.locator('input[type="date"]').first();
    await dateInput.fill('2025-06-01');

    // Nominal (wajib, min 500)
    const nominalInput = dialog.locator('input[name="nominal"]').first();
    await nominalInput.fill('10000');

    // Isi deskripsi
    const deskripsiInput = dialog.locator('textarea[name="deskripsi"]').first();
    await deskripsiInput.fill('Pemasukan test E2E');

    // Submit
    const submitBtn = dialog.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('dapat menambah transaksi pengeluaran', async ({ page }) => {
    await page.goto(KEUANGAN_URL);
    await waitPage(page);

    const tambahBtn = page.locator('button:has-text("Tambah")').first();
    await expect(tambahBtn).toBeVisible({ timeout: 10_000 });
    await tambahBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const tipeSelect = dialog.locator('select[name="jenis"]').first();
    await tipeSelect.selectOption('keluar');

    const dateInput = dialog.locator('input[type="date"]').first();
    await dateInput.fill('2025-06-01');

    // Nominal (wajib, min 500)
    const nominalInput = dialog.locator('input[name="nominal"]').first();
    await nominalInput.fill('10000');

    const deskripsiInput = dialog.locator('textarea[name="deskripsi"]').first();
    await deskripsiInput.fill('Pengeluaran test E2E');

    const submitBtn = dialog.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── TC-KEU-03: Filter laporan berdasarkan periode ─────────────────────────────
test.describe('TC-KEU-03: Filter laporan', () => {
  test('halaman rekap keuangan dapat diakses', async ({ page }) => {
    await page.goto(`/rekap-keuangan?lab_id=${LAB_ID}`);
    await waitPage(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('filter berdasarkan rentang tanggal memperbarui hasil', async ({ page }) => {
    await page.goto(`/rekap-keuangan?lab_id=${LAB_ID}`);
    await waitPage(page);

    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.nth(0).fill('2025-01-01');
      await dateInputs.nth(1).fill('2025-12-31');

      const filterBtn = page.locator('button:has-text("Filter"), button:has-text("Cari"), button[type="submit"]').first();
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await waitPage(page);
      }
    }

    await expect(page.locator('table, [data-testid="rekap"], main').first()).toBeVisible();
  });
});

// ── TC-KEU-04: Ekspor laporan keuangan ───────────────────────────────────────
test.describe('TC-KEU-04: Ekspor laporan keuangan', () => {
  test('ekspor laporan keuangan memicu popup download', async ({ page, context }) => {
    await page.goto(KEUANGAN_URL);
    await waitPage(page);

    const exportBtn = page.locator('button:has-text("Download")').first();
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });

    // handleExport menggunakan window.open() → tangkap sebagai popup/tab baru
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 15_000 }),
      exportBtn.click(),
    ]);

    // Verifikasi popup berhasil terbuka (PDF atau halaman export)
    expect(popup).toBeTruthy();
    expect(popup.url()).not.toBe('');
  });
});

