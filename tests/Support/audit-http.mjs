import { request } from '@playwright/test';
import fs from 'node:fs';

const baseURL = 'http://127.0.0.1:8129';
const catalog = JSON.parse(fs.readFileSync('.audit/route-catalog.json', 'utf8'));
const routes = catalog.filter(route => route.method.includes('GET') && !route.uri.includes('{')
    && route.middleware.some(value => value.startsWith('auth'))
    && (!process.env.AUDIT_ROUTE_FILTER || new RegExp(process.env.AUDIT_ROUTE_FILTER).test(route.name ?? '')));
const outputFile = process.env.AUDIT_HTTP_OUTPUT || '.audit/http-results.json';
const results = [];
for (const role of ['superadmin', 'admin', 'asisten', 'kalab', 'kadep', 'praktikan', 'dosen']) {
    const context = await request.newContext({ baseURL, timeout: 120_000 });
    const login = await context.get('/login');
    const html = await login.text();
    const encodedPage = html.match(/data-page="([^"]+)"/);
    if (!encodedPage) throw new Error(`${role} login page missing Inertia data: HTTP ${login.status()}`);
    const loginPage = JSON.parse(encodedPage[1].replaceAll('&quot;', '"').replaceAll('&#039;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&'));
    const response = await context.post('/login', { form: { email: `${role}@audit.test`, password: 'Audit-test-2026!', _token: loginPage.props.csrf_token }, maxRedirects: 0 });
    if (![302, 303].includes(response.status())) throw new Error(`${role} login failed: HTTP ${response.status()}`);
    for (const route of routes) {
        const url = `/${route.uri === '/' ? '' : route.uri}`;
        try {
            const response = await context.get(url, { headers: { 'X-Inertia': 'true', 'X-Inertia-Version': loginPage.version, Accept: 'application/json' } });
            const contentType = response.headers()['content-type'] ?? '';
            const page = contentType.includes('json') ? await response.json() : null;
            const result = { role, route: route.name, action: route.action, url, final_url: response.url(), status: response.status(), component: page?.component ?? null };
            if (page?.component === 'Auth/Login') result.issue = 'unexpected_login_redirect';
            if (response.status() >= 500) result.issue = 'server_error';
            results.push(result);
        } catch (error) {
            results.push({ role, route: route.name, url, issue: String(error) });
        }
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    }
    await context.dispose();
    console.log(`${role}: ${routes.length} authenticated GET routes probed`);
}
const errors = results.filter(result => result.issue);
console.log(JSON.stringify({ requests: results.length, errors: errors.length, forbidden: results.filter(result => result.status === 403).length }));
process.exitCode = errors.length ? 1 : 0;
