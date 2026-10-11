import { expect, test } from '@playwright/test';
import {
    ADMIN_AUTH_FILE,
    ASISTEN_AUTH_FILE,
    KADEP_AUTH_FILE,
    KALAB_AUTH_FILE,
} from '../fixtures/auth.js';

async function waitPage(page) {
  await expect(page).not.toHaveURL(url => url.pathname === '/login');
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
}

test.describe('TC-INV-01: Daftarkan aset baru', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('halaman inventaris dapat diakses', async ({ page }) => {
    await page.goto('/inventaris');
    await waitPage(page);
  });

  test('admin dapat mendaftarkan aset baru', async ({ page }) => {
    await page.goto('/inventaris');
    await waitPage(page);

    await page.getByRole('button', { name: 'Tambah Aset', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const nativeSelect = page.getByRole('dialog').locator('select').first();
    if (await nativeSelect.count() > 0) {
      const opts = await nativeSelect.locator('option').count();
      if (opts > 1) await nativeSelect.selectOption({ index: 1 });
    }

    const code = `E2E-${Date.now()}`;
    await page.getByRole('dialog').locator('input:not([type])').first().fill(`Aset ${code}`);
    await page.getByRole('dialog').locator('input[required]').first().fill(code);

    const [created] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/detail-inventaris') && response.request().method() === 'POST'),
      page.getByRole('dialog').getByRole('button', { name: 'Simpan', exact: true }).click(),
    ]);
    expect(created.status()).toBeLessThan(400);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.reload();
    await page.locator('input[placeholder*="Cari"]').first().fill(code);
    await expect(page.locator('tr', { hasText: code })).toBeVisible();
  });
});

test.describe('TC-INV-02: QR Code aset', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('halaman detail aset publik valid dapat diakses via URL QR', async ({ page, browser }) => {
    await page.goto('/inventaris');
    await waitPage(page);

    const asset = await page.locator('#app').evaluate(element => JSON.parse(element.dataset.page).props.inventaris.data[0]);
    expect(asset?.id).toBeTruthy();
    const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    try {
      const guestPage = await guest.newPage();
      const response = await guestPage.goto(`${new URL(page.url()).origin}/aset/${asset.id}/detail`);
      expect(response.status()).toBe(200);
      await expect(guestPage.getByText(asset.kode_barang, { exact: false }).first()).toBeVisible();
    } finally {
      await guest.close();
    }
  });

  test('UUID aset tidak valid mengembalikan 404', async ({ page }) => {
    const response = await page.goto('/aset/00000000-0000-0000-0000-000000000000/detail');
    expect(response?.status()).toBe(404);
  });
});

test.describe('TC-INV-03: Peminjaman aset (multi barang)', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: ADMIN_AUTH_FILE });

  const tag = `E2E-PINJAM-${Date.now()}`;

  test('drawer aset menampilkan tab Peminjaman untuk aset tersedia', async ({ page }) => {
    await page.goto('/inventaris');
    await waitPage(page);

    const tersediaRow = page.locator('tr:has-text("Tersedia")').first();
    await expect(tersediaRow).toBeVisible();

    await tersediaRow.getByRole('button', { name: 'Detail dan Aksi', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('dialog').getByRole('tab', { name: 'Peminjaman', exact: true })).toBeVisible();
  });

  test('admin dapat mendaftarkan peminjaman berisi banyak aset', async ({ page }) => {
    await page.goto('/inventaris/peminjaman');
    await waitPage(page);

    await page.locator('button:has-text("Tambah Peminjaman")').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    const modal = page.getByRole('dialog');
    const checkboxes = modal.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThanOrEqual(2);

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await modal.locator('input:is([type="text"], :not([type]))[required]').first().fill(`Mahasiswa ${tag}`);
    await modal.locator('textarea[required]').first().fill(`Keperluan ${tag}`);

    const dateInputs = modal.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) await dateInputs.nth(1).fill('2027-12-31');

    await modal.locator('button[type="submit"]:not(.modal-backdrop button)').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder*="Cari nama peminjam"]').fill(tag);
    const row = page.locator('tr', { hasText: tag }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText(/2\s+aset/i);
  });

  test('admin dapat mencatat pengembalian per-item (sesuai skema items)', async ({ page }) => {
    await page.goto(`/inventaris/peminjaman?status=dipinjam&search=${encodeURIComponent(tag)}`);
    await waitPage(page);

    const row = page.locator('tr', { hasText: tag }).first();
    await expect(row, 'Transaksi peminjaman hasil test sebelumnya harus muncul').toBeVisible({ timeout: 10_000 });

    const expandBtn = row.getByRole('button', { name: /^Lihat daftar aset/ });
    await expect(expandBtn).toBeVisible({ timeout: 10_000 });
    await expandBtn.click();

    const kembalikanItemBtn = row.getByRole('button', { name: 'Kembalikan', exact: true }).first();
    await expect(kembalikanItemBtn).toBeVisible();
    await kembalikanItemBtn.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await modal.getByLabel(/^Kondisi Setelah Kembali/).selectOption('baik');
    await modal.locator('button[type="submit"]:not(.modal-backdrop button)').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
    await expect(modal).not.toBeVisible();
    await page.reload();
    await expect(page.locator('tr', { hasText: tag }).first()).toContainText('1 belum kembali');
  });
});

test.describe('TC-INV-04: Permohonan pengadaan (alur Kalab → Kadep)', () => {
  const tag = `E2E-INV-${Date.now()}`;

  test.describe('Tahap 1: Asisten membuat draft & mengajukan', () => {
    test.use({ storageState: ASISTEN_AUTH_FILE });

    test('halaman permohonan dapat diakses', async ({ page }) => {
      await page.goto('/inventaris/permohonan');
      await waitPage(page);
    });

    test('asisten membuat draft permohonan & mengajukan ke Kalab', async ({ page }) => {
      await page.goto('/inventaris/permohonan');
      await waitPage(page);

      const buatBtn = page.locator(
        'button:has-text("Buat Draft Permohonan"), button:has-text("Buat Permohonan")'
      ).first();
      await expect(buatBtn, 'Tombol Buat Draft Permohonan harus terlihat untuk asisten').toBeVisible({ timeout: 10_000 });

      await buatBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('dialog').locator('textarea').first().fill(`Alasan pengadaan ${tag}`);

      await page.getByRole('dialog').locator('input:is([type="text"], :not([type]))[required]').first()
        .fill(`Laptop ${tag}`);

      await page.getByRole('dialog').locator('button[type="submit"]:not(.modal-backdrop button)').click();

      await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });

      await page.goto('/inventaris/permohonan');
      await waitPage(page);

      const detailBtn = page.getByRole('link', { name: 'Detail', exact: true }).first();
      await expect(detailBtn, 'Daftar permohonan harus berisi minimal 1 item setelah draft dibuat').toBeVisible({ timeout: 10_000 });
      await detailBtn.click();
      await waitPage(page);

      const ajukanBtn = page.locator('button:has-text("Ajukan ke Kalab")');
      await expect(ajukanBtn, 'Tombol Ajukan ke Kalab harus tampil di detail draft').toBeVisible({ timeout: 10_000 });
      await ajukanBtn.click();

      await page.locator('button:has-text("Ya, Ajukan")').click();
      await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Tahap 2: Kepala Lab mereview', () => {
    test.use({ storageState: KALAB_AUTH_FILE });

    test('kalab dapat melihat daftar permohonan yang menunggu review', async ({ page }) => {
      await page.goto('/inventaris/permohonan?status=diajukan');
      await waitPage(page);
    });

    test('kalab menyetujui permohonan yang diajukan', async ({ page }) => {
      await page.goto('/inventaris/permohonan?status=diajukan');
      await waitPage(page);

      const detailBtn = page.getByRole('link', { name: 'Detail', exact: true }).first();
      await expect(detailBtn, 'Kalab harus melihat minimal 1 permohonan dengan status=diajukan').toBeVisible({ timeout: 10_000 });
      await detailBtn.click();
      await waitPage(page);

      const simpanBtn = page.locator('button:has-text("Simpan Keputusan Kalab")');
      await expect(simpanBtn, 'Panel review Kalab harus tampil di detail permohonan').toBeVisible({ timeout: 10_000 });
      await simpanBtn.click();

      await page.locator('button:has-text("Simpan Review")').click();
      await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Tahap 3: Kepala Departemen ACC final', () => {
    test.use({ storageState: KADEP_AUTH_FILE });

    test('kadep dapat melihat permohonan yang menunggu ACC', async ({ page }) => {
      await page.goto('/inventaris/permohonan?status=disetujui_kalab');
      await waitPage(page);
    });

    test('kadep memberikan ACC final untuk permohonan yang sudah disetujui kalab', async ({ page }) => {
      await page.goto('/inventaris/permohonan?status=disetujui_kalab');
      await waitPage(page);

      const detailBtn = page.getByRole('link', { name: 'Detail', exact: true }).first();
      await expect(detailBtn, 'Kadep harus melihat minimal 1 permohonan dengan status=disetujui_kalab').toBeVisible({ timeout: 10_000 });
      await detailBtn.click();
      await waitPage(page);

      const accBtn = page.locator('button:has-text("ACC (Setujui)"), button:has-text("✓ ACC")').first();
      await expect(accBtn, 'Tombol ACC harus tampil di detail permohonan untuk Kadep').toBeVisible({ timeout: 10_000 });
      await accBtn.click();

      await page.locator('button:has-text("Konfirmasi Keputusan Kadep")').click();
      await page.locator('button:has-text("Ya, Konfirmasi")').click();
      await expect(page.locator('[data-sonner-toast][data-type="success"]').first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
