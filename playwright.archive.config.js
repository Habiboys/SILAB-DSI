import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e/archive',
    timeout: 30_000,
    workers: 1,
    reporter: 'list',
    use: { browserName: 'chromium', screenshot: 'only-on-failure' },
});
