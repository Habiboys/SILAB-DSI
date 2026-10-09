import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

// Serve the production frontend with Inertia fixtures; no application database or login setup.
let server;
let origin;
const manifest = JSON.parse(readFileSync('public/build/manifest.json', 'utf8'));
const entry = manifest['resources/js/app.jsx'];
const buildRoot = resolve('public/build');

function fixture(path) {
    const active = path.includes('active');
    const period = { id: 'period', is_active: active };
    const page = {
        component: 'SuratMenyurat/Konfigurasi', url: path, version: null,
        props: {
            auth: { user: { id: 'reviewer', name: 'Reviewer', email: 'reviewer@example.test', roles: ['superadmin'], permissions: [], profile: {} } },
            errors: {}, flash: {}, laboratorium: [],
            selected_kepengurusan: period,
            kepengurusan_context: { id: period.id, is_active: active, is_read_only: !active },
            kepengurusanLab: period, konfigurasi: { inisial_lab: 'LAB', format_nomor: '{nomor}/{tahun}', reset_tiap_tahun: true },
        },
    };
    if (path.includes('review')) {
        page.component = 'Piket/WajahReview';
        page.props.kepengurusan_context = null;
        page.props.enrollments = [
            { id: 'active-row', name: 'Pemohon Aktif', email: 'active@example.test', created_at: '2026-01-01', preview_url: '/photo.svg', can_mutate: true },
            { id: 'archive-row', name: 'Pemohon Arsip', email: 'archive@example.test', created_at: '2025-01-01', preview_url: '/photo.svg', can_mutate: false },
        ];
    }
    if (path.includes('proker')) {
        page.component = 'Proker/Index';
        Object.assign(page.props, {
            kepengurusanlab: period, strukturList: [], tahunKepengurusan: [],
            summary: { total: 0, diajukan: 0, disetujui: 0, selesai: 0, ditolak: 0 },
            prokerData: { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, links: [] },
            can: { create: true, update: true, delete: true, approve: true, view: true }, filters: {},
        });
    }
    const data = JSON.stringify(page).replaceAll('&', '&amp;').replaceAll("'", '&#39;');
    return `<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="csrf-token" content="fixture">${(entry.css || []).map(file => `<link rel="stylesheet" href="/build/${file}">`).join('')}</head><body><div id="app" data-page='${data}'></div><script>window.Ziggy={url:location.origin,routes:{}};window.route=(name)=>name?'/fixture/'+name:{current:()=>false,has:()=>true};</script><script type="module" src="/build/${entry.file}"></script></body></html>`;
}

test.beforeAll(async () => {
    server = createServer((request, response) => {
        const path = new URL(request.url, 'http://localhost').pathname;
        if (path.startsWith('/build/')) {
            const file = resolve(buildRoot, '.' + path.slice('/build'.length));
            if (!file.startsWith(buildRoot + sep)) { response.writeHead(403).end(); return; }
            try {
                const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'application/octet-stream';
                response.writeHead(200, { 'Content-Type': type }).end(readFileSync(file));
            } catch { response.writeHead(404).end(); }
        } else if (path === '/photo.svg') {
            response.writeHead(200, { 'Content-Type': 'image/svg+xml' }).end('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#ccc"/></svg>');
        } else if (path.startsWith('/fixture/')) {
            response.writeHead(200, { 'Content-Type': 'text/html' }).end(fixture(path));
        } else {
            response.writeHead(404).end();
        }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

for (const width of [1440, 390]) {
    test(`archive configuration retains search and disables changes at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(origin + '/fixture/archive');
        await expect(page.getByText('Kepengurusan ini hanya dapat dilihat.', { exact: false })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Simpan konfigurasi' })).toHaveCount(0);
        await expect(page.locator('input[maxlength="20"]')).toHaveAttribute('readonly', '');
        await expect(page.getByRole('checkbox')).toBeDisabled();
        await page.getByPlaceholder('Cari token...').fill('romawi');
        await expect(page.getByRole('cell', { name: 'Bulan dalam angka romawi' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Inisial laboratorium' })).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
}

test('active configuration remains editable', async ({ page }) => {
    await page.goto(origin + '/fixture/active');
    await expect(page.getByRole('button', { name: 'Simpan konfigurasi' })).toBeVisible();
    await expect(page.locator('input[maxlength="20"]')).toBeEditable();
    await page.locator('input[maxlength="20"]').fill('SILAB');
    await expect(page.getByRole('checkbox')).toBeEnabled();
});

test('review actions follow each enrollment owner', async ({ page }) => {
    await page.goto(origin + '/fixture/review');
    const archive = page.getByRole('row').filter({ hasText: 'Pemohon Arsip' });
    const active = page.getByRole('row').filter({ hasText: 'Pemohon Aktif' });
    await expect(archive.getByText('Arsip', { exact: true })).toBeVisible();
    await expect(archive.getByRole('button')).toHaveCount(0);
    await expect(active.getByRole('button', { name: 'Setujui' })).toBeVisible();
});

test('program list hides creation in archives and allows it in active periods', async ({ page }) => {
    await page.goto(origin + '/fixture/proker-archive');
    await expect(page.getByRole('heading', { name: 'Program Kerja Laboratorium' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah Proker' })).toHaveCount(0);
    await page.goto(origin + '/fixture/proker-active');
    await expect(page.getByRole('button', { name: 'Tambah Proker' })).toBeVisible();
});
