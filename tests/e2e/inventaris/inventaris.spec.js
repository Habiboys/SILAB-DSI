import { expect, test } from '@playwright/test';
import {
    ADMIN_AUTH_FILE,
    ASISTEN_AUTH_FILE,
    KADEP_AUTH_FILE,
    KALAB_AUTH_FILE,
} from '../fixtures/auth.js';

async function waitPage(page) {
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

    await page.click('button:has-text("Tambah Aset"), button:has-text("Tambah"), button:has-text("Daftarkan")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const nativeSelect = page.locator('[role="dialog"] select').first();
    if (await nativeSelect.count() > 0) {
      const opts = await nativeSelect.locator('option').count();
      if (opts > 1) await nativeSelect.selectOption({ index: 1 });
    }

    const kodeInput = page.locator('[role="dialog"] input[required]').first();
    if (await kodeInput.count() > 0) {
      await kodeInput.fill(`E2E-${Date.now()}`);
    }

    await page.locator('[role="dialog"] button[type="submit"]').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('TC-INV-02: QR Code aset', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('halaman detail aset publik valid dapat diakses via URL QR', async ({ page }) => {
    await page.goto('/inventaris');
    await waitPage(page);

    const detailLink = page.locator('a[href*="/aset/"][href*="/detail"]').first();
    if (await detailLink.count() > 0) {
      await detailLink.click();
      await waitPage(page);
    } else {
      const qrBtn = page.locator('button:has-text("QR"), a[href*="qr"]').first();
      if (await qrBtn.count() > 0) {
        await qrBtn.click();
        await expect(page.locator('h1, h2, [data-testid="qr"]').first()).toBeVisible({ timeout: 15_000 });
      }
    }
  });

  test('UUID aset tidak valid mengembalikan 404 atau pesan error', async ({ page }) => {
    const response = await page.goto('/aset/00000000-0000-0000-0000-000000000000/detail');
    if (response?.status() === 200) {
      await expect(page.locator('body')).toContainText(/tidak ditemukan|not found|404/i);
    } else {
      expect([404, 302, 500]).toContain(response?.status());
    }
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
    if (await tersediaRow.count() === 0) { test.skip(); return; }

    await tersediaRow.locator('button:has-text("Detail & Aksi")').first().click();
    await expect(page.locator('h2').nth(1)).toBeVisible({ timeout: 8_000 });
  });

  test('admin dapat mendaftarkan peminjaman berisi banyak aset', async ({ page }) => {
    await page.goto('/inventaris/peminjaman');
    await waitPage(page);

    await page.locator('button:has-text("Tambah Peminjaman")').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });

    const modal = page.locator('[role="dialog"]');
    const checkboxes = modal.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    if (checkboxCount === 0) { test.skip(); return; }

    await checkboxes.nth(0).check();
    if (checkboxCount > 1) await checkboxes.nth(1).check();

    await modal.locator('input[type="text"][required]').first().fill(`Mahasiswa ${tag}`);
    await modal.locator('textarea[required]').first().fill(`Keperluan ${tag}`);

    const dateInputs = modal.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) await dateInputs.nth(1).fill('2027-12-31');

    await modal.locator('button[type="submit"]').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder*="Cari nama peminjam"]').fill(tag);
    const row = page.locator('tr', { hasText: tag }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    if (checkboxCount > 1) {
      await expect(row).toContainText(/2\s+aset/i);
    } else {
      await expect(row).toContainText(/1\s+aset/i);
    }
  });

  test('admin dapat mencatat pengembalian per-item (sesuai skema items)', async ({ page }) => {
    await page.goto(`/inventaris/peminjaman?status=dipinjam&search=${encodeURIComponent(tag)}`);
    await waitPage(page);

    const row = page.locator('tr', { hasText: tag }).first();
    await expect(row, 'Transaksi peminjaman hasil test sebelumnya harus muncul').toBeVisible({ timeout: 10_000 });

    const expandBtn = row.locator('button[title="Lihat item"], button[title="Tutup"]').first();
    await expect(expandBtn).toBeVisible({ timeout: 10_000 });
    await expandBtn.click();

    const itemsRow = row.locator('xpath=following-sibling::tr[1]');
    await expect(itemsRow).toContainText(/Daftar aset/i, { timeout: 10_000 });

    const kembalikanItemBtn = itemsRow.locator('button:has-text("Kembalikan")').first();
    if (await kembalikanItemBtn.count() === 0) { test.skip(); return; }
    await kembalikanItemBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await modal.locator('button[type="submit"]').click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });
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
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      await page.locator('[role="dialog"] textarea').first().fill(`Alasan pengadaan ${tag}`);

      await page.locator('[role="dialog"] input[type="text"][required]').first()
        .fill(`Laptop ${tag}`);

      await page.locator('[role="dialog"] button[type="submit"]').click();

      await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10_000 });

      await page.goto('/inventaris/permohonan');
      await waitPage(page);

      const detailBtn = page.locator('button[title="Lihat Detail"]').first();
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

      const detailBtn = page.locator('button[title="Lihat Detail"]').first();
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

      const detailBtn = page.locator('button[title="Lihat Detail"]').first();
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
