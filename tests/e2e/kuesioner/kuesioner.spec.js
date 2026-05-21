import { expect, test } from '@playwright/test';
import { ADMIN_AUTH_FILE, PRAKTIKAN_AUTH_FILE } from '../fixtures/auth.js';

async function waitPage(page) {
    await page.waitForLoadState('load');
    await page.waitForTimeout(800);
}

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

    const judulInput = page.locator('label:has-text("Judul") + input[type="text"]').first();
    await expect(judulInput).toBeVisible({ timeout: 10_000 });
    await judulInput.fill(uniqueTitle);

    const deskripsiInput = page.locator('label:has-text("Deskripsi") + textarea').first();
    await expect(deskripsiInput).toBeVisible({ timeout: 10_000 });
    await deskripsiInput.fill('Deskripsi kuesioner untuk E2E testing');

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

    const targetSection = page.locator('div:has-text("Target Responden")').first();
    const praktikanCheckbox = targetSection.locator('label:has-text("praktikan") input[type="checkbox"]').first();
    await expect(praktikanCheckbox).toBeVisible({ timeout: 10_000 });
    await praktikanCheckbox.check();

    const wajibCheckbox = page.locator('label:has-text("Wajib Diisi") input[type="checkbox"]').first();
    await expect(wajibCheckbox).toBeVisible({ timeout: 10_000 });
    await wajibCheckbox.check();

    const pertanyaanInput = page.locator('input[placeholder="Tulis pertanyaan..."]').first();
    await expect(pertanyaanInput).toBeVisible({ timeout: 10_000 });
    await pertanyaanInput.fill('Apa pendapat Anda tentang praktikum ini?');

    const submitBtn = page.locator('button[type="submit"]:has-text("Simpan")').first();
    await expect(submitBtn).toBeVisible({ timeout: 10_000 });
    await submitBtn.click();
    await waitPage(page);

    await expect(page).toHaveURL(/\/kuesioner(\?|$)/);

    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-KUE-02: Submit jawaban kuesioner', () => {
  test.use({ storageState: PRAKTIKAN_AUTH_FILE });

  test('praktikan dapat melihat kuesioner yang ditargetkan', async ({ page }) => {
    await page.goto('/kuesioner');
    await waitPage(page);
    await expect(page.locator('h1, h2, main').first()).toBeVisible();
  });

  test('praktikan dapat mengisi dan submit kuesioner', async ({ page }) => {

    await page.goto('/kuesioner');
    await waitPage(page);

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

    await expect(page).toHaveURL(/\/kuesioner\/[^/]+\/isi/);

    const textAnswer = page.locator('input[type="text"], textarea').first();
    if (await textAnswer.count() > 0) {
      await textAnswer.fill('Jawaban E2E Test');
    }

    const radioOption = page.locator('input[type="radio"], input[type="checkbox"]').first();
    if (await radioOption.count() > 0) {
      await radioOption.check();
    }

    const submitBtn = page.locator(
      'button[type="submit"]:has-text("Kirim"), button[type="submit"]:has-text("Submit"), button[type="submit"]'
    ).last();
    await submitBtn.click();
    await waitPage(page);
  });
});

