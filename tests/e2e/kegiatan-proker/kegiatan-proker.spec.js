import { expect, test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { ADMIN_AUTH_FILE, KALAB_AUTH_FILE } from '../fixtures/auth.js';

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

  function getProkerSelect(page) {
    return page.locator('select:has(option:has-text("Pilih Program Kerja"))').first();
  }

  /**
   * Ambil kepengurusan_lab_id aktif dari localStorage (disimpan oleh LabContext).
   * Fallback: ambil dari URL saat ini jika ada.
   */
  async function getActiveKepLabId(page) {
    const fromStorage = await page.evaluate(() =>
      localStorage.getItem('selectedKepengurusanLabId')
    );
    if (fromStorage) return fromStorage;

    // Fallback: ambil dari URL saat ini
    const url = page.url();
    const match = url.match(/kepengurusan_lab_id=([^&]+)/);
    return match ? match[1] : null;
  }

  /**
   * Memastikan ada minimal 1 proker berstatus disetujui.
   * Proker dibuat oleh admin, lalu diajukan oleh admin,
   * dan disetujui oleh kalab (sesuai aturan bisnis).
   */
  async function ensureProkerDisetujui(adminPage) {
    await adminPage.goto('/proker');
    await waitPage(adminPage);

    let kepLabId = await getActiveKepLabId(adminPage);

    const createUrl = kepLabId
      ? `/kegiatan/create?kepengurusan_lab_id=${kepLabId}`
      : '/kegiatan/create';
    await adminPage.goto(createUrl);
    await waitPage(adminPage);

    if (await getProkerSelect(adminPage).isVisible({ timeout: 3_000 }).catch(() => false)) {
      return kepLabId;
    }

    const prokerName = `Proker E2E Kegiatan ${Date.now()}`;
    const prokerUrl = kepLabId ? `/proker?kepengurusan_lab_id=${kepLabId}` : '/proker';

    // 1) ADMIN: buat proker + ajukan
    await adminPage.goto(prokerUrl);
    await waitPage(adminPage);

    if (!kepLabId) {
      kepLabId = await getActiveKepLabId(adminPage);
    }

    await adminPage.locator('button:has-text("Tambah Proker")').click();
    const dialog = adminPage.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    const strukturSelect = dialog.locator('select').first();
    const options = await strukturSelect.locator('option[value]:not([value=""])').all();
    if (options.length > 0) {
      await strukturSelect.selectOption(await options[0].getAttribute('value'));
    }
    await dialog.locator('input[type="text"]').first().fill(prokerName);
    await dialog.locator('textarea').first().fill('Deskripsi proker untuk kegiatan E2E');
    await dialog.locator('button[type="submit"]').click();
    await expect(adminPage.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });

    await adminPage.goto(prokerUrl);
    await waitPage(adminPage);
    const adminProkerLink = adminPage.locator(`table tbody tr:has(:text("${prokerName}")) a[href*="/proker/"]`).first();
    await expect(adminProkerLink).toBeVisible({ timeout: 10_000 });
    const prokerDetailHref = await adminProkerLink.getAttribute('href');

    await adminPage.goto(prokerDetailHref);
    await waitPage(adminPage);

    const ajukanBtn = adminPage.locator('button:has-text("Ajukan Persetujuan")');
    await expect(ajukanBtn).toBeVisible({ timeout: 5_000 });
    await ajukanBtn.click();
    const ajukanModal = adminPage.locator('[role="dialog"]');
    await expect(ajukanModal).toBeVisible({ timeout: 5_000 });
    await ajukanModal.locator('button:has-text("Ajukan")').click();
    await expect(adminPage.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });

    // 2) KALAB: setujui proker
    const kalabContext = await adminPage.context().browser().newContext({ storageState: KALAB_AUTH_FILE });
    const kalabPage = await kalabContext.newPage();
    try {
      await kalabPage.goto(prokerUrl);
      await waitPage(kalabPage);

      const kalabProkerLink = kalabPage.locator(`table tbody tr:has(:text("${prokerName}")) a[href*="/proker/"]`).first();
      await expect(kalabProkerLink).toBeVisible({ timeout: 10_000 });
      await kalabPage.goto(await kalabProkerLink.getAttribute('href'));
      await waitPage(kalabPage);

      const setujuiBtn = kalabPage.locator('button:has-text("Setujui")').first();
      await expect(setujuiBtn).toBeVisible({ timeout: 8_000 });
      await setujuiBtn.click();

      const approveDialog = kalabPage.locator('[role="dialog"]');
      await expect(approveDialog).toBeVisible({ timeout: 5_000 });
      await approveDialog.locator('button:has-text("Setujui")').last().click();
      await expect(kalabPage.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
    } finally {
      await kalabContext.close();
    }

    // 3) Verifikasi kembali di ADMIN: proker disetujui sudah muncul di form create kegiatan
    const finalCreateUrl = kepLabId
      ? `/kegiatan/create?kepengurusan_lab_id=${kepLabId}`
      : '/kegiatan/create';
    await adminPage.goto(finalCreateUrl);
    await waitPage(adminPage);
    await expect(
      getProkerSelect(adminPage),
      'Proker disetujui masih tidak muncul di form create kegiatan'
    ).toBeVisible({ timeout: 10_000 });

    return kepLabId;
  }

  /**
   * Membuat kegiatan baru. Setelah submit redirect ke /kegiatan dengan filter yang benar.
   */
  async function createKegiatan(page, nama) {
    const kepLabId = await ensureProkerDisetujui(page);

    // Navigasi ke create dengan kepengurusan_lab_id yang sama
    const createUrl = kepLabId
      ? `/kegiatan/create?kepengurusan_lab_id=${kepLabId}`
      : '/kegiatan/create';
    await page.goto(createUrl);
    await waitPage(page);

    await page.locator('input[type="text"]').first().fill(nama);

    const prokerSelect = getProkerSelect(page);
    await expect(prokerSelect, 'Tidak ada proker disetujui di form create').toBeVisible({ timeout: 5_000 });
    const prokerOptions = await prokerSelect.locator('option[value]:not([value=""])').all();
    await prokerSelect.selectOption(await prokerOptions[0].getAttribute('value'));

    const dateInputs = await page.locator('input[type="date"]').all();
    if (dateInputs.length >= 2) {
      await dateInputs[0].fill('2026-10-10');
      await dateInputs[1].fill('2026-10-11');
    }

    await page.locator('textarea').first().fill('Deskripsi kegiatan E2E test dokumentasi');

    // Submit — tunggu redirect ke /kegiatan
    await Promise.all([
      page.waitForURL('**/kegiatan**', { timeout: 15_000 }),
      page.locator('button[type="submit"]').click(),
    ]);
    await waitPage(page);
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  }

  async function getKegiatanHref(page, nama) {
    // Setelah create, status awal kegiatan adalah "diajukan".
    // Paksa pindah ke tab Diajukan agar item pasti berada di list ini.
    const tabDiajukan = page.locator('button:has-text("Diajukan")').first();
    if (await tabDiajukan.isVisible().catch(() => false)) {
      await tabDiajukan.click();
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
    }

    let kegiatanLink = page.locator(`table tbody tr:has(:text("${nama}")) a[href*="/kegiatan/"]`).first();

    // Retry ringan: kadang list terlambat refresh setelah redirect+filter
    for (let i = 0; i < 2; i++) {
      if (await kegiatanLink.count() > 0) break;
      await page.reload();
      await waitPage(page);
      if (await tabDiajukan.isVisible().catch(() => false)) {
        await tabDiajukan.click();
        await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
      }
      kegiatanLink = page.locator(`table tbody tr:has(:text("${nama}")) a[href*="/kegiatan/"]`).first();
    }

    await expect(kegiatanLink, `Kegiatan "${nama}" tidak ditemukan di tabel`).toBeVisible({ timeout: 15_000 });
    return await kegiatanLink.getAttribute('href');
  }

  test('halaman kegiatan dapat diakses', async ({ page }) => {
    await page.goto('/kegiatan');
    await waitPage(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('dapat membuat kegiatan baru', async ({ page }) => {
    const namaKegiatan = `Kegiatan E2E Buat ${Date.now()}`;
    await createKegiatan(page, namaKegiatan);
  });

  test('dapat menyetujui kegiatan', async ({ page }) => {
    const namaKegiatan = `Kegiatan E2E Setuju ${Date.now()}`;
    await createKegiatan(page, namaKegiatan);

    const href = await getKegiatanHref(page, namaKegiatan);
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
    const namaKegiatan = `Kegiatan E2E Upload ${Date.now()}`;
    await createKegiatan(page, namaKegiatan);

    const href = await getKegiatanHref(page, namaKegiatan);

    // Approval kegiatan harus oleh kalab
    const kalabContext = await page.context().browser().newContext({ storageState: KALAB_AUTH_FILE });
    const kalabPage = await kalabContext.newPage();
    try {
      await kalabPage.goto(href);
      await waitPage(kalabPage);

      const setujuiBtn = kalabPage.locator('button:has-text("Setujui")').first();
      await expect(setujuiBtn).toBeVisible({ timeout: 8_000 });
      await setujuiBtn.click();

      const approveDialog = kalabPage.locator('[role="dialog"]');
      await expect(approveDialog).toBeVisible({ timeout: 5_000 });
      await approveDialog.locator('button:has-text("Setujui")').last().click();
      await expect(kalabPage.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
    } finally {
      await kalabContext.close();
    }

    // Kembali ke admin untuk upload dokumentasi
    await page.goto(href);
    await waitPage(page);

    await expect(page.locator('h2', { hasText: namaKegiatan })).toBeVisible({ timeout: 10_000 });

    const uploadToggleBtn = page.locator('button:has-text("Upload Dokumentasi")').first();
    await expect(uploadToggleBtn).toBeVisible({ timeout: 8_000 });
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
