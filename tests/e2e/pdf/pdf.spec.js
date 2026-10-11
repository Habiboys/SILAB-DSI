import { expect, test } from '@playwright/test';
import { ADMIN_AUTH_FILE } from '../fixtures/auth.js';

test.use({ storageState: ADMIN_AUTH_FILE });

for (const width of [1440, 390]) {
  test(`LPJ PDF renders with the bundled worker at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    expect(process.env.E2E_PERIOD_ID, 'An isolated audit period is required').toBeTruthy();
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    const workers = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('pdf.worker')) workers.push(request.url()); });
    const response = await page.goto(`/lpj-kepengurusan/preview-page?kepengurusan_lab_id=${process.env.E2E_PERIOD_ID}&type=rangkuman`);
    expect(response.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await page.locator('.rpv-core__viewer').scrollIntoViewIfNeeded();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/LAPORAN PERTANGGUNGJAWABAN/i).last()).toBeVisible();
    expect(workers.length).toBeGreaterThan(0);
    expect(workers.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}
