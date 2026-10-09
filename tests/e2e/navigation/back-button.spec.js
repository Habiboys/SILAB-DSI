import { test, expect } from '@playwright/test';

for (const width of [1440, 768, 390]) {
    test(`standard back position and navigation at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('/login');
        await page.locator('#email').fill(process.env.E2E_SUPERADMIN_EMAIL || 'superadmin1@admin.com');
        await page.locator('#password').fill(process.env.E2E_SUPERADMIN_PASSWORD || 'adminlsd123');
        await page.locator('button[type="submit"]').click();
        await page.waitForURL(url => url.pathname !== '/login');
        for (const path of ['/kegiatan/create', '/kuesioner/create', '/surat-menyurat/konfigurasi']) {
            await page.goto(path);
            await page.reload();
            const back = page.locator('[data-page-back] a');
            await expect(back).toHaveCount(1);
            await expect(back).toHaveText('Kembali');
            await expect(back.locator('svg')).toHaveCount(1);
            const box = await back.boundingBox();
            const main = await page.locator('main').boundingBox();
            const heading = await page.locator('main h1').first().boundingBox();
            expect(box.x - main.x).toBeLessThanOrEqual(33);
            expect(box.y + box.height).toBeLessThanOrEqual(heading.y);
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.x + box.width).toBeLessThanOrEqual(width);
            await back.click();
            await expect(page.locator('main')).toBeVisible();
        }
    });
}

test('forgot password uses the same back button above the form', async ({ page }) => {
    await page.goto('/forgot-password');
    const back = page.locator('[data-page-back] a');
    await expect(back).toHaveText('Kembali');
    await expect(back.locator('svg')).toHaveCount(1);
    await back.click();
    await expect(page).toHaveURL(/\/login$/);
});
