import { expect, test } from '@playwright/test';
import { ADMIN_AUTH_FILE, PRAKTIKAN_AUTH_FILE } from '../fixtures/auth.js';

async function waitPage(page) {
  await expect(page).not.toHaveURL(url => url.pathname === '/login');
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

    const judulInput = page.getByLabel(/^Judul/);
    await expect(judulInput).toBeVisible({ timeout: 10_000 });
    await judulInput.fill(uniqueTitle);

    const deskripsiInput = page.getByLabel('Deskripsi', { exact: true });
    await expect(deskripsiInput).toBeVisible({ timeout: 10_000 });
    await deskripsiInput.fill('Deskripsi kuesioner untuk E2E testing');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    const formatDate = (d) => d.toISOString().slice(0, 10);
    const tanggalMulai = page.getByLabel('Tanggal Mulai', { exact: true });
    const tanggalSelesai = page.getByLabel('Tanggal Selesai', { exact: true });
    await expect(tanggalMulai).toBeVisible({ timeout: 10_000 });
    await expect(tanggalSelesai).toBeVisible({ timeout: 10_000 });
    await tanggalMulai.fill(formatDate(startDate));
    await tanggalSelesai.fill(formatDate(endDate));

    const praktikanCheckbox = page.getByRole('checkbox', { name: 'praktikan', exact: true });
    await expect(praktikanCheckbox).toBeVisible({ timeout: 10_000 });
    await praktikanCheckbox.check();

    const wajibCheckbox = page.getByRole('checkbox', { name: /Wajib diisi sebelum/i });
    await expect(wajibCheckbox).toBeVisible({ timeout: 10_000 });
    await wajibCheckbox.check();

    const pertanyaanInput = page.getByLabel(/^Pertanyaan \*/).first();
    await expect(pertanyaanInput).toBeVisible({ timeout: 10_000 });
    await pertanyaanInput.fill('Apa pendapat Anda tentang praktikum ini?');

    const submitBtn = page.locator('button[type="submit"]:not(.modal-backdrop button):has-text("Simpan")').first();
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
      const detailLink = page.getByRole('link', { name: 'Detail', exact: true }).first();
      await expect(detailLink).toBeVisible({ timeout: 10_000 });
      await detailLink.click();
      await waitPage(page);

      const isiLink = page.locator('a:has-text("Isi Kuesioner"), a[href*="/isi"]').first();
      await expect(isiLink).toBeVisible({ timeout: 10_000 });
      await isiLink.click();
      await waitPage(page);
    }

    await expect(page).toHaveURL(/\/kuesioner\/[^/]+\/isi/);

    const textAnswer = page.locator('input:is([type="text"], :not([type])), textarea').first();
    if (await textAnswer.count() > 0) {
      await textAnswer.fill('Jawaban E2E Test');
    }

    const radioOption = page.locator('input[type="radio"], input[type="checkbox"]').first();
    if (await radioOption.count() > 0) {
      await radioOption.check();
    }

    const submitBtn = page.locator(
      'button[type="submit"]:not(.modal-backdrop button):has-text("Kirim"), button[type="submit"]:not(.modal-backdrop button):has-text("Submit"), button[type="submit"]:not(.modal-backdrop button)'
    ).last();
    await submitBtn.click();
    await waitPage(page);
  });
});

