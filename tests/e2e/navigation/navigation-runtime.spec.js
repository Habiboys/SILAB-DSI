import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const source = readFileSync('resources/js/Utils/navigation.js', 'utf8');

test('browser URL, session history and fallback scenarios run in Chromium', async ({ page }) => {
    await page.goto('/login');
    const result = await page.evaluate(async (source) => {
        const helpers = await import(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
        const origin = location.origin;
        const routes = {
            dashboard: { uri: 'dashboard', methods: ['GET'] },
            'kegiatan.index': { uri: 'kegiatan', methods: ['GET'] },
            'kegiatan.create': { uri: 'kegiatan/create', methods: ['GET'] },
            'kegiatan.show': { uri: 'kegiatan/{kegiatan}', methods: ['GET'] },
        };
        const page = (url, lab = 'a') => ({ url, props: { navigation_context: { lab_id: lab } } });
        let history = helpers.recordPage([], page('/kegiatan?lab_id=a&search=robot&page=3'), origin);
        history = helpers.recordPage(history, page('/kegiatan/activity'), origin);
        sessionStorage.setItem('navigation-test', JSON.stringify(history));
        const refreshedHistory = JSON.parse(sessionStorage.getItem('navigation-test'));
        const back = helpers.backDestination(page('/kegiatan/activity'), '/kegiatan', refreshedHistory, routes, origin);
        const direct = helpers.backDestination(page('/kegiatan/create?lab_id=b', 'b'), '/kegiatan', [], routes, origin, 'cancel');
        const external = helpers.backDestination(page('/kegiatan/activity'), 'https://external.test/', [], routes, origin);
        sessionStorage.removeItem('navigation-test');
        return { back, direct, external };
    }, source);
    expect(result.back).toBe('/kegiatan?lab_id=a&search=robot&page=3');
    expect(result.direct).toBe('/kegiatan?lab_id=b');
    expect(result.external).toBe('/dashboard?lab_id=a');
});
