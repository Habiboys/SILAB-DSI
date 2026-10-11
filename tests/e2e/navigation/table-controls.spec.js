import { expect, test } from '@playwright/test';
import { ADMIN_AUTH_FILE } from '../fixtures/auth.js';

test.use({ storageState: ADMIN_AUTH_FILE });

for (const [path, placeholder, sizeKey] of [
  ['/inventaris', 'Cari kode barang atau nama kategori...', 'perPage'],
  ['/inventaris/permohonan', 'Cari nomor permohonan...', 'perPage'],
  ['/data-master/mata-kuliah', 'Cari mata kuliah...', 'perPage'],
  ['/surat-menyurat/surat-masuk', 'Cari surat...', 'perPage'],
  ['/surat-menyurat/surat-keluar', 'Cari surat...', 'perPage'],
  ['/proker', 'Cari nama program kerja...', 'per_page'],
]) {
  test(`search and page size persist after refresh on ${path}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(path);
    const search = page.getByPlaceholder(placeholder, { exact: true });
    await search.fill('__audit_missing_record__');
    await expect(page).toHaveURL(url => url.searchParams.get('search') === '__audit_missing_record__');
    await page.reload();
    await expect(search).toHaveValue('__audit_missing_record__');
    await page.getByRole('combobox', { name: 'Baris', exact: true }).selectOption('25');
    await expect(page).toHaveURL(url => url.searchParams.get(sizeKey) === '25');
    await page.reload();
    await expect(search).toHaveValue('__audit_missing_record__');
    await expect(page.getByRole('combobox', { name: 'Baris', exact: true })).toHaveValue('25');
    expect(errors).toEqual([]);
  });
}
