import { test, expect } from '@playwright/test';
import { ADMIN_AUTH_FILE } from '../fixtures/auth.js';

test.use({ storageState: ADMIN_AUTH_FILE });

const LAB_ID = process.env.E2E_LAB_ID || 'd04210fb-8255-11f0-b26d-bc2411aaebcd';
const KEUANGAN_URL = `/riwayat-keuangan?lab_id=${LAB_ID}`;

async function waitPage(page) {
  await expect(page).not.toHaveURL(url => url.pathname === '/login');
    await page.waitForLoadState('load');
    await page.waitForTimeout(800);
}

test.describe('TC-KEU-02: Transaksi keuangan', () => {
  test('dapat menambah transaksi pemasukan', async ({ page }) => {
    await page.goto(KEUANGAN_URL);
    await waitPage(page);

    const tambahBtn = page.locator('button:has-text("Tambah")').first();
    await expect(tambahBtn).toBeVisible({ timeout: 10_000 });
    await tambahBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const tipeSelect = dialog.getByLabel(/^Jenis Transaksi/);
    await tipeSelect.selectOption('masuk');

    const dateInput = dialog.locator('input[type="date"]').first();
    await dateInput.fill(new Date().toISOString().slice(0, 10));

    const nominalInput = dialog.getByLabel(/^Nominal/);
    await nominalInput.fill('10000');

    const deskripsiInput = dialog.getByLabel(/^Deskripsi/);
    await deskripsiInput.fill('Pemasukan test E2E');

    const submitBtn = dialog.locator('button[type="submit"]:not(.modal-backdrop button)');
    await submitBtn.click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('dapat menambah transaksi pengeluaran', async ({ page }) => {
    await page.goto(KEUANGAN_URL);
    await waitPage(page);

    const tambahBtn = page.locator('button:has-text("Tambah")').first();
    await expect(tambahBtn).toBeVisible({ timeout: 10_000 });
    await tambahBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const tipeSelect = dialog.getByLabel(/^Jenis Transaksi/);
    await tipeSelect.selectOption('keluar');

    const dateInput = dialog.locator('input[type="date"]').first();
    await dateInput.fill(new Date().toISOString().slice(0, 10));

    const nominalInput = dialog.getByLabel(/^Nominal/);
    await nominalInput.fill('10000');

    const deskripsiInput = dialog.getByLabel(/^Deskripsi/);
    await deskripsiInput.fill('Pengeluaran test E2E');

    const submitBtn = dialog.locator('button[type="submit"]:not(.modal-backdrop button)');
    await submitBtn.click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-KEU-03: Filter laporan', () => {
  test('halaman rekap keuangan dapat diakses', async ({ page }) => {
    await page.goto(`/rekap-keuangan?lab_id=${LAB_ID}`);
    await waitPage(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('rekap bulanan konsisten dengan total pemasukan dan pengeluaran', async ({ page }) => {
    await page.goto(`/rekap-keuangan?lab_id=${LAB_ID}`);
    await waitPage(page);

    const props = await page.locator('[data-page]').evaluate(element => JSON.parse(element.dataset.page).props);
    expect(props.rekapKeuangan.length).toBeGreaterThan(0);
    const income = props.rekapKeuangan.reduce((sum, month) => sum + Number(month.pemasukan), 0);
    const expense = props.rekapKeuangan.reduce((sum, month) => sum + Number(month.pengeluaran), 0);
    expect(income).toBeGreaterThanOrEqual(10000);
    expect(expense).toBeGreaterThanOrEqual(10000);
    expect(props.keuanganSummary.totalPemasukan).toBe(income);
    expect(props.keuanganSummary.totalPengeluaran).toBe(expense);
    expect(props.keuanganSummary.saldoAkhir).toBe(income - expense);
    await expect(page.getByRole('table')).toBeVisible();
  });
});

test.describe('TC-KEU-04: Ekspor laporan keuangan', () => {
  test('ekspor laporan keuangan menghasilkan file PDF', async ({ page }) => {
    await page.goto(KEUANGAN_URL);
    await waitPage(page);

    const exportBtn = page.locator('button:has-text("Download")').first();
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      exportBtn.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    expect(await download.failure()).toBeNull();
  });
});
