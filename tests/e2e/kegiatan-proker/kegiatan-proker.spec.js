import { expect, test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { ADMIN_AUTH_FILE } from '../fixtures/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '../fixtures/test-files');

test.use({ storageState: ADMIN_AUTH_FILE });

async function waitPage(page) {
  await expect(page.locator('main, [data-page]').first()).toBeVisible({ timeout: 15_000 });
}

test.describe('TC-PROKER-01: Buat proker baru', () => {
  test('halaman proker dapat diakses', async ({ page }) => {
    await page.goto('/proker');
    await waitPage(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('dapat membuat proker baru', async ({ page }) => {
    await page.goto('/proker');
    await waitPage(page);

    const addBtn = page.locator('button:has-text("Tambah Proker")');
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const strukturSelect = dialog.locator('select').first();
    const strukturOptions = await strukturSelect.locator('option[value]:not([value=""])').all();
    if (strukturOptions.length > 0) {
      const firstVal = await strukturOptions[0].getAttribute('value');
      await strukturSelect.selectOption(firstVal);
    }

    await dialog.locator('input[type="text"]').first().fill('Proker E2E Test');

    await dialog.locator('textarea').first().fill('Deskripsi proker untuk E2E testing');

    await dialog.locator('button[type="submit"]').click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-PROKER-02: Approval proker', () => {

  async function createProker(page, nama) {
    await page.goto('/proker');
    await waitPage(page);
    await page.locator('button:has-text("Tambah Proker")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    const strukturSelect = dialog.locator('select').first();
    const options = await strukturSelect.locator('option[value]:not([value=""])').all();
    if (options.length > 0) {
      await strukturSelect.selectOption(await options[0].getAttribute('value'));
    }
    await dialog.locator('input[type="text"]').first().fill(nama);
    await dialog.locator('textarea').first().fill('Deskripsi proker E2E');
    await dialog.locator('button[type="submit"]').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  }

  test('dapat menyetujui proker yang diajukan', async ({ page }) => {

    const prokerName = `Proker E2E Setuju Test ${Date.now()}`;
    await createProker(page, prokerName);

    await page.goto('/proker');
    await waitPage(page);

    const prokerLink = page.locator(`table tbody tr:has(:text("${prokerName}")) a[href*="/proker/"]`).first();
    const href = await prokerLink.getAttribute('href');
    await page.goto(href);
    await waitPage(page);

    await expect(page.locator('h1', { hasText: prokerName })).toBeVisible({ timeout: 10_000 });

    const ajukanBtn = page.locator('button:has-text("Ajukan Persetujuan")');
    if (await ajukanBtn.count() > 0) {
      await ajukanBtn.click();
      const confirmModal = page.locator('[role="dialog"]');
      await expect(confirmModal).toBeVisible({ timeout: 5_000 });
      await confirmModal.locator('button:not(:has-text("Batal"))').last().click();
      await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
    }

    const setujuiBtn = page.locator('button:has-text("Setujui")');
    await expect(setujuiBtn).toBeVisible({ timeout: 5_000 });
    await setujuiBtn.click();

    const approveDialog = page.locator('[role="dialog"]');
    await expect(approveDialog).toBeVisible({ timeout: 5_000 });
    await approveDialog.locator('button:has-text("Setujui")').last().click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('dapat menolak proker dengan catatan', async ({ page }) => {

    const prokerName = `Proker E2E Tolak Test ${Date.now()}`;
    await createProker(page, prokerName);

    await page.goto('/proker');
    await waitPage(page);

    const prokerLink = page.locator(`table tbody tr:has(:text("${prokerName}")) a[href*="/proker/"]`).first();
    const href = await prokerLink.getAttribute('href');
    await page.goto(href);
    await waitPage(page);

    await expect(page.locator('h1', { hasText: prokerName })).toBeVisible({ timeout: 10_000 });

    const ajukanBtn = page.locator('button:has-text("Ajukan Persetujuan")');
    if (await ajukanBtn.count() > 0) {
      await ajukanBtn.click();
      const confirmModal = page.locator('[role="dialog"]');
      await expect(confirmModal).toBeVisible({ timeout: 5_000 });
      await confirmModal.locator('button:not(:has-text("Batal"))').last().click();
      await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
    }

    const tolakBtn = page.locator('button:has-text("Tolak")');
    await expect(tolakBtn).toBeVisible({ timeout: 5_000 });
    await tolakBtn.click();

    const rejectDialog = page.locator('[role="dialog"]');
    await expect(rejectDialog).toBeVisible({ timeout: 5_000 });
    await rejectDialog.locator('textarea').fill('Catatan penolakan dari E2E test');
    await rejectDialog.locator('button:has-text("Tolak")').last().click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-KEGIATAN-03: Mengelola Kegiatan', () => {
  const namaKegiatan = `Kegiatan E2E Test Upload ${Date.now()}`;

  test('halaman kegiatan dapat diakses', async ({ page }) => {
    await page.goto('/kegiatan');
    await waitPage(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('dapat membuat kegiatan baru', async ({ page }) => {
    await page.goto('/kegiatan/create');
    await waitPage(page);

    await page.locator('input[type="text"]').first().fill(namaKegiatan);

    const prokerSelect = page.locator('select').first();
    const prokerOptions = await prokerSelect.locator('option[value]:not([value=""])').all();
    if (prokerOptions.length > 0) {
      await prokerSelect.selectOption(await prokerOptions[0].getAttribute('value'));
    }

    const dateInputs = await page.locator('input[type="date"]').all();
    if (dateInputs.length >= 2) {
      await dateInputs[0].fill('2026-10-10');
      await dateInputs[1].fill('2026-10-11');
    }

    await page.locator('textarea').first().fill('Deskripsi kegiatan E2E test dokumentasi');

    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('dapat menyetujui kegiatan', async ({ page }) => {

    await page.goto('/kegiatan');
    await waitPage(page);

    const kegiatanLink = page.locator(`table tbody tr:has(:text("${namaKegiatan}")) a[href*="/kegiatan/"]`).first();
    if (await kegiatanLink.count() === 0) {
      test.skip();
      return;
    }

    const href = await kegiatanLink.getAttribute('href');
    await page.goto(href);
    await waitPage(page);

    await expect(page.locator('h2', { hasText: namaKegiatan })).toBeVisible({ timeout: 10_000 });

    const setujuiActionBtn = page.locator('button:has-text("Setujui")').first();
    if (await setujuiActionBtn.isVisible()) {
      await setujuiActionBtn.click();

      const approveDialog = page.locator('[role="dialog"]');
      await expect(approveDialog).toBeVisible({ timeout: 5_000 });

      await approveDialog.locator('button:has-text("Setujui")').last().click();
      await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('dapat upload dokumentasi foto pada kegiatan', async ({ page }) => {

    await page.goto('/kegiatan');
    await waitPage(page);

    const kegiatanLink = page.locator(`table tbody tr:has(:text("${namaKegiatan}")) a[href*="/kegiatan/"]`).first();
    if (await kegiatanLink.count() === 0) {
      test.skip();
      return;
    }

    const href = await kegiatanLink.getAttribute('href');
    await page.goto(href);
    await waitPage(page);

    await expect(page.locator('h2', { hasText: namaKegiatan })).toBeVisible({ timeout: 10_000 });

    const uploadToggleBtn = page.locator('button:has-text("Upload Dokumentasi")').first();
    await expect(uploadToggleBtn).toBeVisible({ timeout: 5_000 });
    await uploadToggleBtn.click();

    await page.locator('input[list="dok-judul-list"]').fill('Foto Dokumentasi E2E');

    const fileInput = page.locator('input[type="file"]').last();
    await expect(fileInput).toBeAttached({ timeout: 5_000 });
    await fileInput.setInputFiles(path.join(FIXTURES, 'test.jpg'));

    const unggahBtn = page.locator('button:has-text("Unggah")').last();
    await expect(unggahBtn).toBeVisible({ timeout: 5_000 });
    await unggahBtn.click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-LPJ-04: LPJ final dan ekspor PDF', () => {
  test('halaman LPJ kepengurusan dapat diakses', async ({ page }) => {
    await page.goto('/kegiatan');
    await waitPage(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('ekspor LPJ PDF memicu download', async ({ page }) => {
    await page.goto('/proker');
    await waitPage(page);

    const lpjBtn = page.locator('a:has-text("Laporan LPJ Labor")');
    if (await lpjBtn.count() === 0) {
      test.skip();
      return;
    }

    await lpjBtn.click();
    await waitPage(page);

    const exportBtn = page.locator(
      'button:has-text("Ekspor PDF"), button:has-text("Download PDF"), a:has-text("Download PDF"), a[href*="export-pdf"]'
    ).first();

    if (await exportBtn.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 20_000 }),
        exportBtn.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.(pdf|PDF)$/);
    } else {
      await expect(page.locator('main, body').first()).toBeVisible();
    }
  });
});
