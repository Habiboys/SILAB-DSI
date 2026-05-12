import { expect, test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { ADMIN_AUTH_FILE, PRAKTIKAN_AUTH_FILE } from '../fixtures/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '../fixtures/test-files');
const LAB_ID = 'd04210fb-8255-11f0-b26d-bc2411aaebcd';

// Helper: tunggu halaman siap berinteraksi tanpa `networkidle`.
// Inertia + Vite sering punya koneksi background sehingga `networkidle` bisa gantung.
async function waitPage(page) {
  await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 });
}

async function getInertiaProps(page) {
  const data = await page.evaluate(() => {
    try {
      const el = document.getElementById('app');
      if (!el) return null;
      const raw = el.getAttribute('data-page');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  return data?.props ?? null;
}

async function getCsrfToken(page) {
  return page.evaluate(() => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? null;
  });
}

async function postForm(page, url, form) {
  const csrfToken = await getCsrfToken(page);
  const headers = csrfToken ? { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' } : undefined;
  const response = await page.request.post(url, { form, headers });

  // Laravel biasanya balas 302 (redirect back) untuk submit form.
  if (response.status() === 302) return response;
  if (response.ok()) return response;

  const body = await response.text();
  throw new Error(`POST ${url} gagal: status=${response.status()} body=${body.slice(0, 500)}`);
}

// Helper: pastikan halaman /praktikum punya konteks kepengurusan aktif.
// Controller akan memilih kepengurusan aktif untuk lab itu.
async function navigatePraktikumWithContext(page) {
  await page.goto(`/praktikum?lab_id=${LAB_ID}`);
  await waitPage(page);

  let props = await getInertiaProps(page);
  let kepId = props?.filters?.kepengurusan_lab_id ?? null;
  if (kepId) return kepId;

  throw new Error('Tidak menemukan kepengurusan_lab_id aktif. Pastikan ada kepengurusan_lab.is_active=true untuk lab terkait');
}

function formatDateYYYYMMDD(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDatetimeLocal(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Helpers untuk membuat data prasyarat per test (mirip gaya inventaris: tiap TC berdiri sendiri)
async function openOrCreatePraktikumShow(page) {
  const kepengurusanLabId = await navigatePraktikumWithContext(page);

  // Pastikan ada minimal 1 mata kuliah aktif (kalau kosong, bikin via endpoint praktikum)
  let props = await getInertiaProps(page);
  const existingPraktikumIds = new Set((props?.praktikumData ?? []).map((item) => item.id));
  let mataKuliahId = props?.mataKuliah?.[0]?.id ?? null;
  if (!mataKuliahId) {
    const tag = Date.now();
    await postForm(page, '/praktikum/mata-kuliah', {
      kode_mata_kuliah: `E2E-${tag}`,
      nama: `E2E Mata Kuliah ${tag}`,
      sks: '1',
      semester: '1',
    });

    await page.goto(`/praktikum?kepengurusan_lab_id=${kepengurusanLabId}`);
    await waitPage(page);
    props = await getInertiaProps(page);
    mataKuliahId = props?.mataKuliah?.[0]?.id ?? null;
    if (!mataKuliahId) {
      throw new Error('Gagal membuat mata kuliah via /praktikum/mata-kuliah (list mataKuliah masih kosong)');
    }
  }

  // Buat praktikum via endpoint (lebih deterministik daripada UI modal)
  await postForm(page, '/praktikum', {
    mata_kuliah_id: String(mataKuliahId),
    kepengurusan_lab_id: String(kepengurusanLabId),
  });

  // Refresh list dan buka praktikum yang baru dibuat (atau minimal yang pertama)
  await page.goto(`/praktikum?kepengurusan_lab_id=${kepengurusanLabId}`);
  await waitPage(page);

  props = await getInertiaProps(page);
  const praktikumList = props?.praktikumData ?? [];
  if (!praktikumList.length) {
    throw new Error('Daftar praktikum kosong setelah pembuatan. Pastikan praktikum berhasil dibuat.');
  }

  let target = praktikumList.find((item) => !existingPraktikumIds.has(item.id));
  if (!target) {
    target = praktikumList[praktikumList.length - 1];
  }
  if (!target?.id) {
    throw new Error('Tidak bisa menentukan praktikum yang baru dibuat.');
  }

  const targetUrl = `/praktikum/${target.id}`;
  await page.goto(targetUrl);
  await waitPage(page);
  await expect(page.locator('button:has-text("Tambah Kelas")').first()).toBeVisible({ timeout: 10_000 });

  return targetUrl;
}

async function openKelasFeature(page, kelasName, label) {
  const kelasHeading = page.getByRole('heading', { name: kelasName });
  await expect(kelasHeading).toBeVisible({ timeout: 10_000 });
  await kelasHeading.scrollIntoViewIfNeeded();

  const kelasCard = page.locator('div.p-5').filter({ has: kelasHeading }).first();
  await expect(kelasCard).toBeVisible({ timeout: 10_000 });

  const menuButton = kelasCard.locator('button:has(svg.lucide-more-horizontal)').first();
  if (await menuButton.count()) {
    await menuButton.click();
  } else {
    const fallbackButton = kelasCard.locator('button').first();
    await expect(fallbackButton).toBeVisible({ timeout: 10_000 });
    await fallbackButton.click();
  }
  await page.locator('div.absolute button').filter({ hasText: label }).first().click();
  await waitPage(page);
}

async function createKelas(page, praktikumUrl, kelasName) {
  await page.goto(praktikumUrl);
  await waitPage(page);

  await page.locator('button:has-text("Tambah Kelas")').click();
  const modal = page.locator('[role="dialog"]').filter({ hasText: 'Tambah Kelas' }).first();
  await expect(modal).toBeVisible({ timeout: 10_000 });

  await modal.locator('input[type="text"]').first().fill(kelasName);
  await modal.locator('select').first().selectOption('Senin');
  await modal.locator('input[type="text"]').nth(1).fill('Lab 1');
  await modal.locator('input[type="time"]').nth(0).fill('08:00');
  await modal.locator('input[type="time"]').nth(1).fill('10:00');
  await modal.locator('button[type="submit"]:has-text("Simpan")').click();

  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('heading', { name: kelasName })).toBeVisible({ timeout: 10_000 });
}

async function addPraktikanToKelas(page, praktikumUrl, kelasName, praktikanSearchKey) {
  await page.goto(praktikumUrl);
  await waitPage(page);
  await openKelasFeature(page, kelasName, 'Peserta');

  await page.locator('button:has-text("Tambah Existing User")').click();
  const existingModal = page.locator('[role="dialog"]').filter({ hasText: 'Tambah Existing User' }).first();
  await expect(existingModal).toBeVisible({ timeout: 10_000 });

  const searchInput = existingModal.locator('input[placeholder*="Cari berdasarkan"]').first();

  // Coba cari dengan NIM-prefix dulu, fallback ke email.
  await searchInput.fill(praktikanSearchKey);
  const firstRadio = existingModal.locator('input[type="radio"][name="user_id"]').first();
  if (await firstRadio.count() === 0) {
    await searchInput.fill(praktikanEmail);
  }

  await expect(
    existingModal.locator('input[type="radio"][name="user_id"]').first(),
    `User praktikan tidak ditemukan saat search "${praktikanSearchKey}" / "${praktikanEmail}"`
  ).toBeVisible({ timeout: 10_000 });

  await existingModal.locator('input[type="radio"][name="user_id"]').first().check();
  await existingModal.locator('button[type="submit"]:has-text("Tambah")').click();
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
}

async function createPertemuan(page, praktikumUrl, kelasName, pertemuanJudul) {
  await page.goto(praktikumUrl);
  await waitPage(page);
  await openKelasFeature(page, kelasName, 'Pertemuan');

  await page.locator('button:has-text("Buat Pertemuan")').first().click();
  const pertemuanModal = page.locator('[role="dialog"]').filter({ hasText: 'Tambah Pertemuan' }).first();
  await expect(pertemuanModal).toBeVisible({ timeout: 10_000 });

  await pertemuanModal.locator('input[type="text"]').first().fill(pertemuanJudul);
  await pertemuanModal.locator('input[type="date"]').first().fill(formatDateYYYYMMDD(new Date()));
  await pertemuanModal.locator('button[type="submit"]').filter({ hasText: 'Simpan Pertemuan' }).click();

  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(`text=${pertemuanJudul}`).first()).toBeVisible({ timeout: 10_000 });
}

async function createTugas(page, praktikumUrl, kelasName, pertemuanJudul, tugasJudul) {
  await page.goto(praktikumUrl);
  await waitPage(page);
  await openKelasFeature(page, kelasName, 'Tugas');

  await page.locator('button:has-text("Tambah Tugas")').click();
  const tugasModal = page.locator('[role="dialog"]').filter({ hasText: 'Tambah Tugas Praktikum' }).first();
  await expect(tugasModal).toBeVisible({ timeout: 10_000 });

  await tugasModal.locator('input[type="text"]').first().fill(tugasJudul);

  const selects = tugasModal.locator('select');
  if (await selects.count() > 0) {
    const pertemuanSelect = selects.first();
    const hasOption = (await pertemuanSelect.locator('option').filter({ hasText: pertemuanJudul }).count()) > 0;
    if (hasOption) {
      await pertemuanSelect.selectOption({ label: pertemuanJudul });
    }
  }

  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await tugasModal.locator('input[type="datetime-local"]').fill(formatDatetimeLocal(deadline));
  await tugasModal.locator('button[type="submit"]:has-text("Tambah")').click();

  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(`text=${tugasJudul}`).first()).toBeVisible({ timeout: 10_000 });
}

// Praktikan yang dipakai oleh global-setup Playwright.
// Default: 2111522007_ahmad@student.unand.ac.id → search pakai NIM prefix.
const praktikanEmail = process.env.TEST_PRAKTIKAN_EMAIL || '2111522007_ahmad@student.unand.ac.id';
const praktikanSearchKey = (praktikanEmail.split('_')[0] || praktikanEmail).trim();

test.describe('TC-PRAK-01: buat praktikum', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('admin dapat membuat / membuka praktikum', async ({ page }) => {
    const praktikumUrl = await openOrCreatePraktikumShow(page);
    await expect(page).toHaveURL(/\/praktikum\//);
  });
});

test.describe('TC-PRAK-02: buat kelas', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('admin dapat membuat kelas', async ({ page }) => {
    const uniq = Date.now();
    const kelasName = `E2E-KLS-${uniq}`;

    const praktikumUrl = await openOrCreatePraktikumShow(page);

    await createKelas(page, praktikumUrl, kelasName);
  });
});

test.describe('TC-PRAK-03: tambah praktikan', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('admin dapat menambahkan praktikan ke kelas', async ({ page }) => {
    const uniq = Date.now();
    const kelasName = `E2E-KLS-${uniq}`;

    const praktikumUrl = await openOrCreatePraktikumShow(page);

    await createKelas(page, praktikumUrl, kelasName);
    await addPraktikanToKelas(page, praktikumUrl, kelasName, praktikanSearchKey);
  });
});

test.describe('TC-PRAK-04: buat pertemuan', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('admin dapat membuat pertemuan', async ({ page }) => {
    const uniq = Date.now();
    const kelasName = `E2E-KLS-${uniq}`;
    const pertemuanJudul = `E2E-PRTM-${uniq}`;

    const praktikumUrl = await openOrCreatePraktikumShow(page);

    await createKelas(page, praktikumUrl, kelasName);
    await createPertemuan(page, praktikumUrl, kelasName, pertemuanJudul);
  });
});

test.describe('TC-PRAK-05: buat tugas', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('admin dapat membuat tugas', async ({ page }) => {
    const uniq = Date.now();
    const kelasName = `E2E-KLS-${uniq}`;
    const pertemuanJudul = `E2E-PRTM-${uniq}`;
    const tugasJudul = `E2E-TGS-${uniq}`;

    const praktikumUrl = await openOrCreatePraktikumShow(page);

    await createKelas(page, praktikumUrl, kelasName);
    await createPertemuan(page, praktikumUrl, kelasName, pertemuanJudul);
    await createTugas(page, praktikumUrl, kelasName, pertemuanJudul, tugasJudul);
  });
});

test.describe('TC-PRAK-06: praktikan lihat tugas', () => {
  test.use({ storageState: PRAKTIKAN_AUTH_FILE });

  test('praktikan dapat melihat tugas yang dibuat', async ({ page, browser }) => {
    const uniq = Date.now();
    const kelasName = `E2E-KLS-${uniq}`;
    const pertemuanJudul = `E2E-PRTM-${uniq}`;
    const tugasJudul = `E2E-TGS-${uniq}`;

    // Setup data oleh admin di context terpisah
    const adminContext = await browser.newContext({ storageState: ADMIN_AUTH_FILE });
    const adminPage = await adminContext.newPage();
    const praktikumUrl = await openOrCreatePraktikumShow(adminPage);
    await createKelas(adminPage, praktikumUrl, kelasName);
    await addPraktikanToKelas(adminPage, praktikumUrl, kelasName, praktikanSearchKey);
    await createPertemuan(adminPage, praktikumUrl, kelasName, pertemuanJudul);
    await createTugas(adminPage, praktikumUrl, kelasName, pertemuanJudul, tugasJudul);
    await adminContext.close();

    await page.goto('/praktikan/daftar-tugas', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/praktikan/daftar-tugas', { timeout: 10_000 });
    await waitPage(page);
    const searchInput = page.getByPlaceholder('Cari judul tugas...');
    if (await searchInput.count()) {
      await expect(searchInput).toBeVisible({ timeout: 10_000 });
      await searchInput.fill(tugasJudul);
    }
    await expect(page.locator('main').getByText(tugasJudul).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-PRAK-07: praktikan submit tugas', () => {
  test.use({ storageState: PRAKTIKAN_AUTH_FILE });

  test('praktikan dapat submit tugas (PDF)', async ({ page, browser }) => {
    const uniq = Date.now();
    const kelasName = `E2E-KLS-${uniq}`;
    const pertemuanJudul = `E2E-PRTM-${uniq}`;
    const tugasJudul = `E2E-TGS-${uniq}`;

    // Setup data oleh admin di context terpisah
    const adminContext = await browser.newContext({ storageState: ADMIN_AUTH_FILE });
    const adminPage = await adminContext.newPage();
    const praktikumUrl = await openOrCreatePraktikumShow(adminPage);
    await createKelas(adminPage, praktikumUrl, kelasName);
    await addPraktikanToKelas(adminPage, praktikumUrl, kelasName, praktikanSearchKey);
    await createPertemuan(adminPage, praktikumUrl, kelasName, pertemuanJudul);
    await createTugas(adminPage, praktikumUrl, kelasName, pertemuanJudul, tugasJudul);
    await adminContext.close();

    await page.goto('/praktikan/daftar-tugas', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/praktikan/daftar-tugas', { timeout: 10_000 });
    await waitPage(page);

    await expect(page.getByRole('heading', { name: 'Daftar Tugas Praktikum' })).toBeVisible({ timeout: 10_000 });

    const searchInput = page.getByPlaceholder('Cari judul tugas...');
    if (await searchInput.count()) {
      await expect(searchInput).toBeVisible({ timeout: 10_000 });
      await searchInput.fill(tugasJudul);
    }

    const tugasHeading = page.getByRole('heading', { name: tugasJudul }).first();
    await expect(tugasHeading).toBeVisible({ timeout: 10_000 });

    const tugasCard = page.locator('main').locator('div', { has: tugasHeading }).first();
    const detailLink = tugasCard.getByRole('link', { name: /Lihat & Kumpulkan/i }).first();
    await expect(detailLink, 'Link detail tugas tidak ditemukan di kartu tugas').toBeVisible({ timeout: 10_000 });
    await detailLink.click();
    await page.waitForURL('**/praktikan/tugas/**', { timeout: 10_000 });
    await waitPage(page);
    await expect(page.getByRole('heading', { name: tugasJudul }).first()).toBeVisible({ timeout: 10_000 });

    const fileInput = page.locator('input#file-upload');
    await expect(fileInput, 'Input upload tugas (#file-upload) tidak ditemukan').toHaveCount(1, { timeout: 10_000 });
    await fileInput.setInputFiles(path.join(FIXTURES, 'test.pdf'));
    await expect(page.getByText('test.pdf').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('button:has-text("Kumpulkan Tugas")').click();
    await expect(page.getByText(/Dikumpulkan/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
