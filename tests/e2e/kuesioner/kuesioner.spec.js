import { expect, test } from '@playwright/test';
import { ADMIN_AUTH_FILE, PRAKTIKAN_AUTH_FILE } from '../fixtures/auth.js';

// Helper - pakai 'load' bukan 'networkidle' karena Vite HMR bikin network tidak pernah idle
async function waitPage(page) {
    await page.waitForLoadState('load');
    await page.waitForTimeout(800);
}

// ── TC-KUE-01: Buat kuesioner baru dengan target role ─────────────────────────
test.describe('TC-KUE-01: Buat kuesioner baru', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('halaman kuesioner dapat diakses', async ({ page }) => {
    await page.goto('/kuesioner');
    await waitPage(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('dapat membuat kuesioner baru dengan target role praktikan', async ({ page }) => {
    await page.goto('/kuesioner');
    await waitPage(page);

    const buatBtn = page.locator(
      'button:has-text("Buat Kuesioner"), button:has-text("Tambah"), a:has-text("Buat Kuesioner")'
    ).first();
    await expect(buatBtn).toBeVisible({ timeout: 10_000 });
    await buatBtn.click();
    await waitPage(page);

    const uniqueTitle = `Kuesioner E2E Test ${Date.now()}`;

    // Isi judul
    const judulInput = page.locator('label:has-text("Judul") + input[type="text"]').first();
    await expect(judulInput).toBeVisible({ timeout: 10_000 });
    await judulInput.fill(uniqueTitle);

    // Isi deskripsi
    const deskripsiInput = page.locator('label:has-text("Deskripsi") + textarea').first();
    await expect(deskripsiInput).toBeVisible({ timeout: 10_000 });
    await deskripsiInput.fill('Deskripsi kuesioner untuk E2E testing');

    // Isi tanggal mulai & selesai (required di backend)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    const formatDate = (d) => d.toISOString().slice(0, 10);
    const tanggalMulai = page.locator('label:has-text("Tanggal Mulai")').locator('..').locator('input[type="date"]').first();
    const tanggalSelesai = page.locator('label:has-text("Tanggal Selesai")').locator('..').locator('input[type="date"]').first();
    await expect(tanggalMulai).toBeVisible({ timeout: 10_000 });
    await expect(tanggalSelesai).toBeVisible({ timeout: 10_000 });
    await tanggalMulai.fill(formatDate(startDate));
    await tanggalSelesai.fill(formatDate(endDate));

    // Set target role praktikan
    const targetSection = page.locator('div:has-text("Target Responden")').first();
    const praktikanCheckbox = targetSection.locator('label:has-text("praktikan") input[type="checkbox"]').first();
    await expect(praktikanCheckbox).toBeVisible({ timeout: 10_000 });
    await praktikanCheckbox.check();

    // Set status Aktif
    // Set status Wajib Diisi (opsional, tapi dipakai untuk skenario TC-KUE-02)
    const wajibCheckbox = page.locator('label:has-text("Wajib Diisi") input[type="checkbox"]').first();
    await expect(wajibCheckbox).toBeVisible({ timeout: 10_000 });
    await wajibCheckbox.check();

    // Isi Pertanyaan
    const pertanyaanInput = page.locator('input[placeholder="Tulis pertanyaan..."]').first();
    await expect(pertanyaanInput).toBeVisible({ timeout: 10_000 });
    await pertanyaanInput.fill('Apa pendapat Anda tentang praktikum ini?');

    const submitBtn = page.locator('button[type="submit"]:has-text("Simpan")').first();
    await expect(submitBtn).toBeVisible({ timeout: 10_000 });
    await submitBtn.click();
    await waitPage(page);

    // Harus redirect balik ke index kalau sukses
    await expect(page).toHaveURL(/\/kuesioner(\?|$)/);

    // Verifikasi data benar-benar muncul di list
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── TC-KUE-02: Submit jawaban (verifikasi visibilitas per role) ───────────────
test.describe('TC-KUE-02: Submit jawaban kuesioner', () => {
  test.use({ storageState: PRAKTIKAN_AUTH_FILE });

  test('praktikan dapat melihat kuesioner yang ditargetkan', async ({ page }) => {
    await page.goto('/kuesioner');
    await waitPage(page);
    await expect(page.locator('h1, h2, main').first()).toBeVisible();
  });

  test('praktikan dapat mengisi dan submit kuesioner', async ({ page }) => {
    // 1) Buka daftar kuesioner.
    //    Catatan: kalau praktikan punya kuesioner mandatory yang belum diisi,
    //    middleware EnsureMandatoryKuesionerCompleted akan langsung redirect
    //    ke /kuesioner/{id}/isi. Jadi kita harus adaptif terhadap dua kemungkinan
    //    state: sudah di halaman isi, atau masih di list.
    await page.goto('/kuesioner');
    await waitPage(page);

    // 2) Kalau belum di halaman isi, navigasi via Detail → Isi Kuesioner.
    if (!/\/kuesioner\/[^/]+\/isi(\?|$)/.test(page.url())) {
      const detailLink = page.locator('a[title="Detail"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10_000 });
      await detailLink.click();
      await waitPage(page);

      const isiLink = page.locator('a:has-text("Isi Kuesioner"), a[href*="/isi"]').first();
      await expect(isiLink).toBeVisible({ timeout: 10_000 });
      await isiLink.click();
      await waitPage(page);
    }

    // 3) Pastikan sekarang di halaman isi (form partisipasi)
    await expect(page).toHaveURL(/\/kuesioner\/[^/]+\/isi/);

    // 4) Isi jawaban pertama yang tersedia (text/textarea)
    const textAnswer = page.locator('input[type="text"], textarea').first();
    if (await textAnswer.count() > 0) {
      await textAnswer.fill('Jawaban E2E Test');
    }

    // 5) Pilih radio/checkbox jika ada
    const radioOption = page.locator('input[type="radio"], input[type="checkbox"]').first();
    if (await radioOption.count() > 0) {
      await radioOption.check();
    }

    // 6) Submit
    const submitBtn = page.locator(
      'button[type="submit"]:has-text("Kirim"), button[type="submit"]:has-text("Submit"), button[type="submit"]'
    ).last();
    await submitBtn.click();
    await waitPage(page);
  });
});



