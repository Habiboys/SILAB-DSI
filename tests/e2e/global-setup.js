import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ADMIN_AUTH_FILE = path.join(__dirname, 'fixtures/.auth/admin.json');
export const PRAKTIKAN_AUTH_FILE = path.join(__dirname, 'fixtures/.auth/praktikan.json');
export const ASISTEN_AUTH_FILE = path.join(__dirname, 'fixtures/.auth/asisten.json');
export const KALAB_AUTH_FILE = path.join(__dirname, 'fixtures/.auth/kalab.json');
export const KADEP_AUTH_FILE = path.join(__dirname, 'fixtures/.auth/kadep.json');
export const SUPERADMIN_AUTH_FILE = path.join(__dirname, 'fixtures/.auth/superadmin.json');

// Admin lab (single-lab admin, BUKAN superadmin) — agar test mencerminkan
// realita: admin sebuah lab yang ditest end-to-end alur permohonan ke kalab/kadep lab yang sama.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin.lsd@silab.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'adminlsd123';

// Praktikan saja
const PRAKTIKAN_EMAIL = process.env.TEST_PRAKTIKAN_EMAIL || '2111522007_ahmad@student.unand.ac.id';
const PRAKTIKAN_PASSWORD = process.env.TEST_PRAKTIKAN_PASSWORD || '2111522007';

// Asisten + praktikan (akun ganda)
const ASISTEN_EMAIL = process.env.TEST_ASISTEN_EMAIL || '2311522022_laila@student.unand.ac.id';
const ASISTEN_PASSWORD = process.env.TEST_ASISTEN_PASSWORD || '2311522022';

// Dosen kepala lab
const KALAB_EMAIL = process.env.TEST_KALAB_EMAIL || 'nisadwi@it.unand.ac.id';
const KALAB_PASSWORD = process.env.TEST_KALAB_PASSWORD || '199206042024062001';

// Kadep
const KADEP_EMAIL = process.env.TEST_KADEP_EMAIL || 'kadepsi@admin.com';
const KADEP_PASSWORD = process.env.TEST_KADEP_PASSWORD || 'adminlsd123';

// Superadmin
const SUPERADMIN_EMAIL = process.env.E2E_SUPERADMIN_EMAIL || 'superadmin1@admin.com';
const SUPERADMIN_PASSWORD = process.env.E2E_SUPERADMIN_PASSWORD || 'adminlsd123';

async function loginAndSave(page, email, password, authFile) {
  await page.goto('/login');
  await expect(page.locator('input#email')).toBeVisible({ timeout: 10_000 });

  // Type character-by-character to ensure React onChange fires
  await page.locator('input#email').click({ clickCount: 3 });
  await page.keyboard.type(email);

  await page.locator('input#password').click({ clickCount: 3 });
  await page.keyboard.type(password);

  // Wait until the submit button is no longer disabled (React state updated)
  await expect(page.locator('button[type="submit"]:not([disabled])')).toBeVisible({ timeout: 5_000 });
  await page.locator('button[type="submit"]').click();

  // Wait for redirect away from /login with generous timeout
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 60_000 });

  await page.context().storageState({ path: authFile });
}

setup('create admin auth state', async ({ page }) => {
  await loginAndSave(page, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_AUTH_FILE);
});

setup('create praktikan auth state', async ({ page }) => {
  await loginAndSave(page, PRAKTIKAN_EMAIL, PRAKTIKAN_PASSWORD, PRAKTIKAN_AUTH_FILE);
});

setup('create asisten auth state', async ({ page }) => {
  await loginAndSave(page, ASISTEN_EMAIL, ASISTEN_PASSWORD, ASISTEN_AUTH_FILE);
});

setup('create kalab auth state', async ({ page }) => {
  await loginAndSave(page, KALAB_EMAIL, KALAB_PASSWORD, KALAB_AUTH_FILE);
});

setup('create kadep auth state', async ({ page }) => {
  await loginAndSave(page, KADEP_EMAIL, KADEP_PASSWORD, KADEP_AUTH_FILE);
});

setup('create superadmin auth state', async ({ page }) => {
  await loginAndSave(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_AUTH_FILE);
});
