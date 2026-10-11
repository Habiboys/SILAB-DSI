import { test, expect } from '@playwright/test';
import { ADMIN_AUTH_FILE } from '../fixtures/auth.js';

test.use({ storageState: ADMIN_AUTH_FILE });

test('fine bills are updated explicitly and the recap survives reload', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const query = new URLSearchParams({ lab_id: process.env.E2E_LAB_ID, kepengurusan_lab_id: process.env.E2E_PERIOD_ID });
    await page.goto(`/piket/rekap-absen?${query}`);
    const props = await page.locator('#app').evaluate(element => JSON.parse(element.dataset.page).props);
    expect(props.periode?.id).toBeTruthy();
    const button = page.getByRole('button', { name: 'Perbarui tagihan denda', exact: true });
    await expect(button).toBeVisible();
    const response = page.waitForResponse(result => result.request().method() === 'POST' && result.url().includes('/denda-piket/sync/'));
    await button.click();
    expect((await response).status()).toBe(200);
    await expect(page.getByText('Tagihan denda diperbarui.', { exact: true })).toBeVisible();
    await expect(button).toBeEnabled();
    await page.reload();
    await expect(button).toBeVisible();
    expect(errors).toEqual([]);
});
