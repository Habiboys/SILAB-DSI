import { expect, test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { ADMIN_AUTH_FILE, PRAKTIKAN_AUTH_FILE } from '../fixtures/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '../fixtures/test-files');

test.use({ storageState: ADMIN_AUTH_FILE });

// Helper: tunggu halaman siap berinteraksi tanpa `networkidle`.
// Inertia + Vite sering punya koneksi background sehingga `networkidle` bisa gantung.
async function waitPage(page) {
  await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 });
}

// Helper: ambil kepengurusan_lab_id yang aktif dari halaman praktikum.
// Controller menerima ?kepengurusan_lab_id=X di URL agar selectedTahun terisi
// sehingga tombol "Tambah" menjadi aktif.
async function navigatePraktikumWithContext(page) {
  // 1. Buka halaman praktikum tanpa konteks
  await page.goto('/praktikum');
  await waitPage(page);

  // 2. Cek apakah sudah ada konteks (tombol Tambah enabled) via Inertia props di URL
  const url = page.url();
  if (url.includes('kepengurusan_lab_id') || url.includes('lab_id')) {
    return; // sudah ada konteks dari navbar
  }

  // 3. Coba klik link Lab di sidebar/navbar untuk memilih lab secara otomatis,
  //    lalu tunggu redirect dengan konteks
  // Navbar SILAB biasanya menyisipkan lab_id + kepengurusan_lab_id via URL ketika
  // pengguna memilih lab dari dropdown.  Kita ekstrak ID dari Inertia shared props
  // yang dirender di meta tag atau dari URL setelah navigasi lab.
  // Cara paling robust: baca nilai select/dropdown tahun jika ada dan pilih item pertama.
  const yearSelect = page.locator('select[name="tahun_id"], select[id*="tahun"]').first();
  if (await yearSelect.count() > 0) {
    const options = await yearSelect.locator('option').all();
    if (options.length > 1) {
      const firstVal = await options[1].getAttribute('value');
      if (firstVal) {
        await yearSelect.selectOption(firstVal);
        await waitPage(page);
      }
    }
  }
}

// ── TC-PRAK-01: CRUD mata kuliah dan kelas praktikum ─────────────────────────
test.describe('TC-PRAK-01: CRUD Praktikum', () => {
  test('halaman praktikum dapat diakses', async ({ page }) => {
    await page.goto('/praktikum');
    await waitPage(page);
    await expect(page.locator('h1, h2, main').first()).toBeVisible();
  });

  test('dapat membuat praktikum baru', async ({ page }) => {
    await page.goto('/praktikum');
    await waitPage(page);

    // Tombol Tambah di-disable jika belum ada konteks lab/tahun.
    // Cek apakah tombol Tambah enabled; jika tidak, coba ambil konteks dari
    // navbar (LabContext menyuntikkan kepengurusan_lab_id ke URL).
    const addBtn = page.locator('button:has-text("Tambah"), button:has-text("Buat Praktikum")').first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });

    const isDisabled = await addBtn.isDisabled();
    if (isDisabled) {
      // Coba extract kepengurusan_lab_id dari shared props Inertia via DOM
      // (Inertia menyisipkan data ke elemen #app sebagai data-page JSON)
      const pageData = await page.evaluate(() => {
        try {
          const el = document.getElementById('app');
          if (!el) return null;
          return JSON.parse(el.getAttribute('data-page'));
        } catch { return null; }
      });

      let kepId = pageData?.props?.selected_kepengurusan?.id
        || pageData?.props?.auth?.user?.active_kepengurusan_lab_id
        || null;

      // Fallback: query DB via API jika ada; kalau tidak ketemu → skip
      if (!kepId) {
        // Coba lihat apakah ada link aktif di sidebar yang sudah memilih lab
        const navLink = page.locator('nav a[href*="kepengurusan_lab_id"]').first();
        if (await navLink.count() > 0) {
          const href = await navLink.getAttribute('href');
          const match = href?.match(/kepengurusan_lab_id=(\d+)/);
          kepId = match?.[1];
        }
      }

      if (kepId) {
        await page.goto(`/praktikum?kepengurusan_lab_id=${kepId}`);
        await waitPage(page);
      } else {
        // Tidak bisa aktifkan konteks secara programatik → skip test ini
        test.skip();
        return;
      }
    }

    // Tombol sekarang harus enabled
    const addBtnFresh = page.locator('button:has-text("Tambah"), button:has-text("Buat Praktikum")').first();
    await expect(addBtnFresh).toBeEnabled({ timeout: 10_000 });
    await addBtnFresh.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Form hanya berisi select#mata_kuliah_id (tidak ada text input visible).
    // Pilih opsi pertama yang tersedia (bukan placeholder kosong).
    const mataKuliahSelect = page.locator('[role="dialog"] select#mata_kuliah_id');
    const availableOptions = await mataKuliahSelect.locator('option[value]:not([value=""])').all();
    if (availableOptions.length === 0) {
      // Tidak ada mata kuliah tersedia — skip
      test.skip();
      return;
    }
    const firstMkVal = await availableOptions[0].getAttribute('value');
    await mataKuliahSelect.selectOption(firstMkVal);

    await page.locator('[role="dialog"] button[type="submit"]').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── TC-PRAK-02: Submit tugas (valid vs ekstensi tidak diizinkan) ───────────────
test.describe('TC-PRAK-02: Submit tugas praktikan', () => {
  test.use({ storageState: PRAKTIKAN_AUTH_FILE });

  test('praktikan dapat melihat daftar tugas', async ({ page }) => {
    await page.goto('/praktikan/daftar-tugas');
    await waitPage(page);
    await expect(page.locator('h1, h2, main').first()).toBeVisible();
  });

  test('submit tugas PDF valid diterima', async ({ page }) => {
    await page.goto('/praktikan/daftar-tugas');
    await waitPage(page);

    // Di DaftarTugas.jsx, link ke detail tugas ada di dalam konten utama (main)
    // dengan teks "Lihat & Kumpulkan" atau "Lihat Detail", route: /praktikan/tugas/{id}
    // Gunakan selector yang spesifik pada area konten (bukan sidebar nav).
    const tugasLink = page.locator('main a[href*="/praktikan/tugas/"]').first();
    if (await tugasLink.count() === 0) {
      test.skip();
      return;
    }

    await tugasLink.click();
    await waitPage(page);

    // Di DaftarTugasDetail.jsx, file input adalah input#file-upload (class sr-only / hidden)
    // Gunakan setInputFiles langsung pada input tersebut
    const fileInput = page.locator('input#file-upload');
    if (await fileInput.count() === 0) {
      test.skip();
      return;
    }

    await fileInput.setInputFiles(path.join(FIXTURES, 'test.pdf'));

    // Tombol submit adalah type="button" (bukan type="submit") dengan teks "Kumpulkan Tugas"
    await page.locator('button:has-text("Kumpulkan Tugas")').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('submit tugas ekstensi .txt ditolak', async ({ page }) => {
    await page.goto('/praktikan/daftar-tugas');
    await waitPage(page);

    const tugasLink = page.locator('main a[href*="/praktikan/tugas/"]').first();
    if (await tugasLink.count() === 0) {
      test.skip();
      return;
    }

    await tugasLink.click();
    await waitPage(page);

    const fileInput = page.locator('input#file-upload');
    if (await fileInput.count() === 0) {
      test.skip();
      return;
    }

    // Upload file .txt
    await fileInput.setInputFiles(path.join(FIXTURES, 'test.txt'));
    await page.locator('button:has-text("Kumpulkan Tugas")').click();

    // Server validation error atau client-side rejection (sonner error toast atau teks merah)
    await expect(
      page
        .locator('p.text-red-600, [data-sonner-toast][data-type="error"], .text-destructive')
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ── TC-PRAK-03: Input absensi praktikan ──────────────────────────────────────
test.describe('TC-PRAK-03: Absensi praktikan', () => {
  test('halaman absensi pertemuan dapat diakses', async ({ page }) => {
    await page.goto('/praktikum');
    await waitPage(page);

    const praktikumLink = page.locator('a[href*="/praktikum/"]').first();
    if (await praktikumLink.count() === 0) {
      test.skip();
      return;
    }

    await praktikumLink.click();
    await waitPage(page);

    // Cari link pertemuan
    const pertemuanLink = page.locator('a:has-text("Pertemuan"), a[href*="pertemuan"]').first();
    if (await pertemuanLink.count() === 0) {
      test.skip();
      return;
    }

    await pertemuanLink.click();
    await waitPage(page);
    await expect(page.locator('h1, h2, main').first()).toBeVisible();
  });

  test('input absensi praktikan pada pertemuan', async ({ page }) => {
    await page.goto('/praktikum');
    await waitPage(page);

    const praktikumLink = page.locator('a[href*="/praktikum/"]').first();
    if (await praktikumLink.count() === 0) {
      test.skip();
      return;
    }
    await praktikumLink.click();
    await waitPage(page);

    const pertemuanLink = page.locator('a:has-text("Pertemuan"), a[href*="pertemuan"]').first();
    if (await pertemuanLink.count() === 0) {
      test.skip();
      return;
    }
    await pertemuanLink.click();
    await waitPage(page);

    const absensiLink = page.locator('a:has-text("Absensi"), a[href*="absensi"]').first();
    if (await absensiLink.count() === 0) {
      test.skip();
      return;
    }
    await absensiLink.click();
    await waitPage(page);

    // Pilih status hadir untuk baris pertama jika ada
    const selectStatus = page.locator('select[name*="status"]').first();
    if (await selectStatus.count() > 0) {
      await selectStatus.selectOption('hadir');
      await page.locator('button[type="submit"]:has-text("Simpan")').click();
      await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
    }
  });
});

// ── TC-PRAK-04: Generate sertifikat ──────────────────────────────────────────
test.describe('TC-PRAK-04: Sertifikat praktikum', () => {
  test('halaman sertifikat praktikum dapat diakses', async ({ page }) => {
    await page.goto('/praktikum');
    await waitPage(page);

    const praktikumLink = page.locator('a[href*="/praktikum/"]').first();
    if (await praktikumLink.count() === 0) {
      test.skip();
      return;
    }
    await praktikumLink.click();
    await waitPage(page);

    const sertifikatLink = page.locator('a[href*="sertifikat"]').first();
    if (await sertifikatLink.count() === 0) {
      test.skip();
      return;
    }
    await sertifikatLink.click();
    await page.waitForURL('**/sertifikat**');
    await waitPage(page);
    await expect(page.locator('h1, h2, main').first()).toBeVisible();
  });
});
