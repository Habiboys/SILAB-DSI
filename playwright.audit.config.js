import config from './playwright.config.js';
import fs from 'node:fs';

process.env.PW_BASE_URL = 'http://127.0.0.1:8129';
const run = process.env.AUDIT_BROWSER_RUN || 'current';
if (!/^[a-z0-9-]+$/.test(run)) throw new Error('Invalid audit run name.');
const fixture = JSON.parse(fs.readFileSync('.audit/fixture.json', 'utf8'));
process.env.E2E_LAB_ID = fixture.lab_id;
process.env.E2E_PERIOD_ID = fixture.period_id;
for (const [role, prefix] of Object.entries({ admin: 'E2E_ADMIN', superadmin: 'E2E_SUPERADMIN', praktikan: 'TEST_PRAKTIKAN', asisten: 'TEST_ASISTEN', kalab: 'TEST_KALAB', kadep: 'TEST_KADEP' })) {
    process.env[`${prefix}_EMAIL`] = `${role}@audit.test`;
    process.env[`${prefix}_PASSWORD`] = 'Audit-test-2026!';
}
export default {
    ...config,
    workers: 1,
    retries: 0,
    outputDir: `.audit/playwright-${run}-results`,
    reporter: [['list'], ['json', { outputFile: `.audit/playwright-${run}.json` }], ['html', { outputFolder: `.audit/playwright-${run}-report`, open: 'never' }]],
    use: { ...config.use, baseURL: process.env.PW_BASE_URL, trace: 'retain-on-failure' },
};
