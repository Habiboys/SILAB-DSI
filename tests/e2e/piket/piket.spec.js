import { expect, test } from '@playwright/test';
import { ADMIN_AUTH_FILE, ASISTEN_AUTH_FILE } from '../fixtures/auth.js';

async function waitPage(page) {
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
}

async function ensureJadwalPiketUntukAsisten(browser) {
  const adminContext = await browser.newContext({ storageState: ADMIN_AUTH_FILE });
  const adminPage = await adminContext.newPage();

  try {
    await adminPage.goto('/piket/jadwal');
    await waitPage(adminPage);

    const tambahBtn = adminPage.locator('button[title="Tambah Petugas"]').first();
    await expect(tambahBtn).toBeVisible({ timeout: 10_000 });
    await tambahBtn.click();

    const dialog = adminPage.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const userCheckbox = dialog.locator('input[type="checkbox"]:not(#select-all)').first();
    const adaUser = (await userCheckbox.count()) > 0;
    if (!adaUser) {
      throw new Error('Dialog tambah petugas terbuka, tapi daftar user kosong untuk dijadwalkan.');
    }

    await userCheckbox.check();
    await dialog.locator('button[type="submit"]:has-text("Simpan")').click();
    await expect(adminPage.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  } finally {
    await adminContext.close();
  }
}

test.describe('TC-PIKET-01: Jadwal piket', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('halaman jadwal piket dapat diakses', async ({ page }) => {
    await page.goto('/piket/jadwal');
    await waitPage(page);
  });

  test('admin dapat menambah petugas piket via tombol +', async ({ page }) => {
    await page.goto('/piket/jadwal');
    await waitPage(page);

    const tambahBtn = page.locator('button[title="Tambah Petugas"]').first();
    await expect(tambahBtn, 'Tombol "+" Tambah Petugas harus tampil di kolom hari').toBeVisible({ timeout: 10_000 });
    await tambahBtn.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const userCheckbox = page.locator('[role="dialog"] input[type="checkbox"]:not(#select-all)').first();
    if (await userCheckbox.count() > 0) {
      await userCheckbox.check();
    }

    await page.locator('[role="dialog"] button[type="submit"]:has-text("Simpan")').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-PIKET-02: Asisten ambil absen check-in', () => {
  test.use({ storageState: ASISTEN_AUTH_FILE });

  test.beforeAll(async ({ browser }) => {
    await ensureJadwalPiketUntukAsisten(browser);
  });

  test('halaman absensi piket dapat diakses oleh asisten', async ({ page }) => {
    await page.goto('/piket/absensi');
    await waitPage(page);
  });

  test('asisten dapat membuka kamera dan video stream tampil', async ({ page }) => {
    await page.goto('/piket/absensi');
    await waitPage(page);

    const bukaKameraBtn = page.locator('button:has-text("Buka Kamera")').first();
    if (await bukaKameraBtn.count() === 0) {
      throw new Error('Tombol "Buka Kamera" tidak ditemukan. Asisten tidak punya jadwal piket hari ini atau sudah check-in/checkout.');
    }

    await bukaKameraBtn.click();

    await expect(page.locator('video')).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('button:has-text("Ambil Foto")')).toBeVisible({ timeout: 10_000 });
  });

  test('asisten dapat check-in piket: ambil foto + isi kegiatan + submit', async ({ page }) => {
    await page.goto('/piket/absensi');
    await waitPage(page);

    const bukaKameraBtn = page.locator('button:has-text("Buka Kamera")').first();
    if (await bukaKameraBtn.count() === 0) {
      throw new Error('Tombol "Buka Kamera" tidak ditemukan. Asisten tidak ada jadwal piket hari ini atau sudah submit.');
    }

    await bukaKameraBtn.click();
    await expect(page.locator('video')).toBeVisible({ timeout: 10_000 });

    const ambilFotoBtn = page.locator('button:has-text("Ambil Foto"):not([disabled])');
    await expect(ambilFotoBtn).toBeVisible({ timeout: 15_000 });
    await ambilFotoBtn.click();

    await page.locator('textarea[required]').first().fill('Piket E2E test - rencana kegiatan harian');

    const submitBtn = page.locator('form button[type="submit"]').last();
    await submitBtn.click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 15_000 });
  });
});







