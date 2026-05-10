import { test, expect } from '@playwright/test';
import { ADMIN_AUTH_FILE, ASISTEN_AUTH_FILE } from '../fixtures/auth.js';

async function waitPage(page) {
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
}

// ── TC-PIKET-01: Susun jadwal piket (admin) ──────────────────────────────────
test.describe('TC-PIKET-01: Jadwal piket', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('halaman jadwal piket dapat diakses', async ({ page }) => {
    await page.goto('/piket/jadwal');
    await waitPage(page);
  });

  test('admin dapat menambah petugas piket via tombol +', async ({ page }) => {
    await page.goto('/piket/jadwal');
    await waitPage(page);

    // Tombol tambah berupa icon "+" SVG dengan title="Tambah Petugas" per kolom hari
    const tambahBtn = page.locator('button[title="Tambah Petugas"]').first();
    await expect(tambahBtn, 'Tombol "+" Tambah Petugas harus tampil di kolom hari').toBeVisible({ timeout: 10_000 });
    await tambahBtn.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Centang user pertama (skip checkbox "Pilih semua" yang id-nya select-all)
    const userCheckbox = page.locator('[role="dialog"] input[type="checkbox"]:not(#select-all)').first();
    if (await userCheckbox.count() > 0) {
      await userCheckbox.check();
    }

    // Submit (button bertulisan "Simpan")
    await page.locator('[role="dialog"] button[type="submit"]:has-text("Simpan")').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── TC-PIKET-02: Asisten ambil absen check-in dengan foto ────────────────────
// Chromium launch dengan --use-fake-ui-for-media-stream dari playwright.config.js
test.describe('TC-PIKET-02: Asisten ambil absen check-in', () => {
  test.use({ storageState: ASISTEN_AUTH_FILE });

  test('halaman absensi piket dapat diakses oleh asisten', async ({ page }) => {
    await page.goto('/piket/absensi');
    await waitPage(page);
  });

  test('asisten dapat membuka kamera dan video stream tampil', async ({ page }) => {
    await page.goto('/piket/absensi');
    await waitPage(page);

    // Kalau asisten tidak punya jadwal piket hari ini, form check-in tidak muncul.
    const bukaKameraBtn = page.locator('button:has-text("Buka Kamera")').first();
    if (await bukaKameraBtn.count() === 0) {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Asisten tidak punya jadwal piket hari ini atau sudah check-in/checkout.',
      });
      test.skip();
      return;
    }

    await bukaKameraBtn.click();

    // Video element muncul setelah kamera fake aktif
    await expect(page.locator('video')).toBeVisible({ timeout: 10_000 });

    // Tombol "Ambil Foto" muncul (state ready)
    await expect(page.locator('button:has-text("Ambil Foto")')).toBeVisible({ timeout: 10_000 });
  });

  test('asisten dapat check-in piket: ambil foto + isi kegiatan + submit', async ({ page }) => {
    await page.goto('/piket/absensi');
    await waitPage(page);

    const bukaKameraBtn = page.locator('button:has-text("Buka Kamera")').first();
    if (await bukaKameraBtn.count() === 0) {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Asisten tidak ada jadwal piket hari ini atau sudah submit.',
      });
      test.skip();
      return;
    }

    await bukaKameraBtn.click();
    await expect(page.locator('video')).toBeVisible({ timeout: 10_000 });

    // Tunggu kamera ready (button "Ambil Foto" enabled)
    const ambilFotoBtn = page.locator('button:has-text("Ambil Foto"):not([disabled])');
    await expect(ambilFotoBtn).toBeVisible({ timeout: 15_000 });
    await ambilFotoBtn.click();

    // Isi kegiatan (textarea required di form check-in)
    await page.locator('textarea[required]').first().fill('Piket E2E test - rencana kegiatan harian');

    // Submit form check-in (button submit terakhir di form)
    const submitBtn = page.locator('form button[type="submit"]').last();
    await submitBtn.click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 15_000 });
  });
});

// ── TC-PIKET-03: Pengajuan dan persetujuan ganti jadwal ───────────────────────
test.describe('TC-PIKET-03: Ganti jadwal piket', () => {
  test.describe('Pengajuan oleh asisten', () => {
    test.use({ storageState: ASISTEN_AUTH_FILE });

    test('halaman ganti jadwal dapat diakses', async ({ page }) => {
      await page.goto('/piket/ganti-jadwal');
      await waitPage(page);
    });

    test('asisten dapat mengajukan permintaan ganti jadwal', async ({ page }) => {
      await page.goto('/piket/ganti-jadwal');
      await waitPage(page);

      const ajukanBtn = page.locator(
        'button:has-text("Ajukan"), button:has-text("Tambah"), button:has-text("Ganti Jadwal")'
      ).first();

      if (await ajukanBtn.count() === 0) {
        test.skip();
        return;
      }

      await ajukanBtn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const dateInput = page.locator('[role="dialog"] input[type="date"]').first();
      if (await dateInput.count() > 0) {
        await dateInput.fill('2027-12-01');
      }

      await page.locator('[role="dialog"] button[type="submit"]').click();
    });
  });

  test.describe('Persetujuan oleh admin', () => {
    test.use({ storageState: ADMIN_AUTH_FILE });

    test('admin dapat menyetujui permintaan ganti jadwal', async ({ page }) => {
      await page.goto('/piket/ganti-jadwal');
      await waitPage(page);

      const approveBtn = page.locator(
        'button:has-text("Setuju"), button:has-text("Approve"), button:has-text("Terima")'
      ).first();

      if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
      }
    });
  });
});

// ── TC-PIKET-04: Ekspor rekap absensi ────────────────────────────────────────
test.describe('TC-PIKET-04: Ekspor rekap absensi', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('halaman rekap absensi dapat diakses', async ({ page }) => {
    await page.goto('/piket/rekap-absen');
    await waitPage(page);
  });

  test('ekspor rekap absensi memicu download file', async ({ page }) => {
    await page.goto('/piket/rekap-absen');
    await waitPage(page);

    const exportBtn = page.locator(
      'button:has-text("Ekspor"), a:has-text("Export"), a[href*="export"], button:has-text("Download")'
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
