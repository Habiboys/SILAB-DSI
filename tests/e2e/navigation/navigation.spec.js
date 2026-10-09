import { test, expect } from '@playwright/test';
import path from 'node:path';

test.use({ storageState: path.resolve('tests/e2e/fixtures/.auth/superadmin.json') });

async function authenticate(page) {
    await page.goto('/dashboard');
    if (new URL(page.url()).pathname === '/login') {
        await page.locator('#email').fill(process.env.E2E_SUPERADMIN_EMAIL || 'superadmin1@admin.com');
        await page.locator('#password').fill(process.env.E2E_SUPERADMIN_PASSWORD || 'adminlsd123');
        await page.locator('button[type="submit"]').click();
        await page.waitForURL(url => url.pathname !== '/login');
    }
    await expect(page.locator('main')).toBeVisible();
}

async function expectSameUrl(page, expected) {
    const target = new URL(expected);
    await expect(page).toHaveURL(url => url.pathname === target.pathname
        && JSON.stringify([...url.searchParams].sort()) === JSON.stringify([...target.searchParams].sort()));
}

async function initialProps(page) {
    return page.locator('#app').evaluate(element => JSON.parse(element.dataset.page).props);
}

test.beforeEach(async ({ page }) => authenticate(page));

test('all accessible module indexes have valid breadcrumb links and no JavaScript errors', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const paths = ['/dashboard', '/laboratorium', '/tahun-kepengurusan', '/kepengurusan-lab', '/anggota',
        '/praktikum', '/kegiatan', '/kegiatan/kalender', '/proker', '/inventaris', '/inventaris/permohonan',
        '/inventaris/peminjaman', '/riwayat-keuangan', '/catatan-kas', '/rekap-keuangan', '/kuesioner',
        '/sertifikat', '/sertifikat-saya', '/user-management', '/data-master/struktur', '/data-master/mata-kuliah',
        '/data-master/kategori-aset', '/surat-menyurat/surat-masuk', '/surat-menyurat/surat-keluar',
        '/surat-menyurat/konfigurasi', '/notifikasi', '/profile', '/about', '/piket/periode-piket',
        '/piket/jadwal', '/piket/absensi', '/piket/ganti-jadwal', '/piket/ganti-jadwal/admin',
        '/piket/absensi/riwayat', '/piket/rekap-absen', '/piket/wajah/review', '/admin/roles-permissions', '/struktur-permissions'];
    const visited = [];
    for (const path of paths) {
        const response = await page.goto(path);
        if (response.status() === 403) { console.info(`Permission denied for test role: ${path}`); continue; }
        expect(response.status(), path).toBeLessThan(400);
        expect(new URL(page.url()).pathname, `Unexpected redirect from ${path}`).toBe(path);
        await expect(page.locator('main')).toBeVisible();
        const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true });
        expect(await breadcrumb.count(), path).toBeLessThanOrEqual(1);
        for (const href of await breadcrumb.locator('a').evaluateAll(elements => elements.map(element => element.href))) {
            const response = await page.request.get(href);
            expect(response.status(), `${path} → ${href}`).toBeLessThan(400);
        }
        visited.push(path);
    }
    console.info('Audited indexes:', visited.join(', '));
    expect(errors).toEqual([]);
});

test('create and cancel restore list filters, breadcrumbs preserve lab context after refresh', async ({ page }) => {
    await page.goto('/kegiatan');
    const props = await initialProps(page);
    const lab = props.auth.user.laboratory?.id || props.laboratorium[0]?.id;
    const period = props.kepengurusanLabId || props.selected_kepengurusan?.id;
    const query = new URLSearchParams({ status: 'diajukan', page: '2', search: 'navigation-test', lab_id: String(lab) });
    if (period) query.set('kepengurusan_lab_id', period);
    await page.goto(`/kegiatan?${query}`);
    const original = page.url();
    await page.locator('a[href*="/kegiatan/create"]').first().click();
    await expect(page).toHaveURL(/\/kegiatan\/create/);
    await page.reload();
    const parent = page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Kegiatan', exact: true });
    expect(new URL(await parent.getAttribute('href'), page.url()).searchParams.get('lab_id')).toBe(String(lab));
    await page.getByRole('link', { name: 'Batal', exact: true }).click();
    await expectSameUrl(page, original);
});

test('direct access in a fresh tab uses a contextual fallback and never an external history entry', async ({ page, context }) => {
    await page.goto('/kegiatan');
    const props = await initialProps(page);
    const lab = props.auth.user.laboratory?.id || props.laboratorium[0]?.id;
    const tab = await context.newPage();
    await tab.goto(`/kegiatan/create?lab_id=${lab}`);
    await tab.getByRole('link', { name: 'Batal', exact: true }).click();
    await expect(tab).toHaveURL(/\/kegiatan\?/);
    expect(new URL(tab.url()).searchParams.get('lab_id')).toBe(String(lab));
    await tab.close();
});

test('multiple laboratories stay separate while creating and returning', async ({ page }) => {
    const props = await initialProps(page);
    test.skip(props.laboratorium.length < 2, 'Requires two laboratory fixtures.');
    for (const lab of props.laboratorium.slice(0, 2)) {
        await page.goto(`/kegiatan?lab_id=${lab.id}&status=diajukan`);
        await page.locator('a[href*="/kegiatan/create"]').first().click();
        await expect(page).toHaveURL(/\/kegiatan\/create/);
        await page.getByRole('link', { name: 'Batal', exact: true }).click();
        expect(new URL(page.url()).searchParams.get('lab_id')).toBe(String(lab.id));
    }
});

test('detail, nested certificate, application back and browser back/forward preserve origin', async ({ page }) => {
    await page.goto('/kegiatan');
    const props = await initialProps(page);
    const activity = (props.kegiatan?.data || props.kegiatan || [])[0];
    test.skip(!activity, 'Requires an activity fixture.');
    await page.goto('/kegiatan?status=all&page=2');
    const origin = page.url();
    const link = page.locator(`a[href*="/kegiatan/${activity.id}"]`).first();
    test.skip(await link.count() === 0, 'Fixture is not visible on this list page.');
    await link.click();
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('[aria-current="page"]')).toHaveCount(1);
    const detail = page.url();
    const certificates = page.getByRole('link', { name: 'Kelola Sertifikat', exact: true }).first();
    if (await certificates.count()) {
        await certificates.click();
        await expect(page).toHaveURL(/\/sertifikat/);
        await page.locator('[data-page-back]').getByRole('link', { name: 'Kembali', exact: true }).click();
        await expectSameUrl(page, detail);
    }
    await page.getByRole('link', { name: 'Kembali', exact: true }).first().click();
    await expectSameUrl(page, origin);
    await page.goto(detail);
    await page.goBack();
    await expect(page).toHaveURL(origin);
    await page.goForward();
    await expect(page).toHaveURL(detail);
});
