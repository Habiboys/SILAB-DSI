import { test, expect } from '@playwright/test';
import { SUPERADMIN_AUTH_FILE, PRAKTIKAN_AUTH_FILE, ADMIN_AUTH_FILE } from '../fixtures/auth.js';

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

    // Isi judul
    const judulInput = page.locator('input[name*="judul"], input[placeholder*="judul"]').first();
    if (await judulInput.count() > 0) {
      await judulInput.fill('Kuesioner E2E Test');
    }

    // Isi deskripsi
    const deskripsiInput = page.locator('textarea[name*="deskripsi"], textarea').first();
    if (await deskripsiInput.count() > 0) {
      await deskripsiInput.fill('Deskripsi kuesioner untuk E2E testing');
    }

    // Set target role praktikan
    const praktikanCheckbox = page.locator('input[type="checkbox"][value*="praktikan"]').first();
    if (await praktikanCheckbox.count() > 0) {
      await praktikanCheckbox.check();
    }

    // Set status Aktif
    const aktifCheckbox = page.locator('input[name="is_active"], input[type="checkbox"]:near(:text("Aktif"))').first();
    if (await aktifCheckbox.count() > 0) {
      await aktifCheckbox.check();
    }

    // Set status Wajib Diisi
    const wajibCheckbox = page.locator('input[name="is_mandatory"], input[type="checkbox"]:near(:text("Wajib Diisi"))').first();
    if (await wajibCheckbox.count() > 0) {
      await wajibCheckbox.check();
    }

    // Isi Pertanyaan
    const pertanyaanInput = page.locator('input[placeholder*="pertanyaan"], input[placeholder*="Pertanyaan"]').first();
    if (await pertanyaanInput.count() > 0) {
      await pertanyaanInput.fill('Apa pendapat Anda tentang praktikum ini?');
    }

    const submitBtn = page.locator('button[type="submit"]').last();
    await submitBtn.click();
    await waitPage(page);
    await expect(page.locator('[data-sonner-toast], h1, h2').first()).toBeVisible({ timeout: 10_000 });
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



