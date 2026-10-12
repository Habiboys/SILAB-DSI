import { expect, test } from '@playwright/test';
import { SUPERADMIN_AUTH_FILE } from '../fixtures/auth.js';

test.use({ storageState: SUPERADMIN_AUTH_FILE });

test('category actions display exactly one backend notification and validation remains visible', async ({ page }) => {
    const name = `Notification audit ${Date.now()}`;
    await page.goto('/data-master/kategori-aset');
    await page.getByRole('button', { name: 'Tambah kategori', exact: true }).click();
    let dialog = page.getByRole('dialog');
    await dialog.locator('input').fill(name);
    await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    let toasts = page.locator('[data-sonner-toast]');
    await expect(toasts).toHaveCount(1);
    await expect(toasts).toContainText('Kategori aset berhasil ditambahkan');
    await toasts.getByRole('button', { name: 'Close toast' }).click();
    await expect(toasts).toHaveCount(0);

    await page.getByRole('button', { name: 'Tambah kategori', exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.locator('input').fill('x'.repeat(256));
    await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
    await expect(toasts).toHaveCount(1);
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[class*="text-error"]').first()).toBeVisible();
    await dialog.getByRole('button', { name: 'Batal', exact: true }).click();
    await toasts.getByRole('button', { name: 'Close toast' }).click();

    await page.getByPlaceholder('Cari aset...', { exact: true }).fill(name);
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toHaveCount(1);
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Hapus', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(toasts).toHaveCount(1);
    await expect(toasts).toContainText('Kategori aset berhasil dihapus');
    await expect(row).toHaveCount(0);
    await page.reload();
    await expect(toasts).toHaveCount(0);
});

