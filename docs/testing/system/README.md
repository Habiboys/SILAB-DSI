# SILAB — System Testing dengan Playwright

Direktori ini berisi dokumentasi spesifikasi test case E2E (end-to-end) untuk sistem SILAB menggunakan **Playwright**.

---

## Daftar Modul

| Modul | File Spec | File Dokumentasi | Jumlah TC |
|---|---|---|---|
| Autentikasi | `tests/e2e/auth/authentication.spec.js` | [auth.md](auth.md) | 7 |
| Praktikum | `tests/e2e/praktikum/praktikum.spec.js` | [praktikum.md](praktikum.md) | 5 |
| Piket | `tests/e2e/piket/piket.spec.js` | [piket.md](piket.md) | 5 |
| Keuangan | `tests/e2e/keuangan/keuangan.spec.js` | [keuangan.md](keuangan.md) | 5 |
| Inventaris | `tests/e2e/inventaris/inventaris.spec.js` | [inventaris.md](inventaris.md) | 6 |
| Kegiatan & Proker | `tests/e2e/kegiatan-proker/kegiatan-proker.spec.js` | [kegiatan-proker.md](kegiatan-proker.md) | 6 |
| Kuesioner | `tests/e2e/kuesioner/kuesioner.spec.js` | [kuesioner.md](kuesioner.md) | 6 |
| Surat | `tests/e2e/surat/surat.spec.js` | [surat.md](surat.md) | 6 |

---

## Prasyarat

### 1. Environment

```bash
# Salin dan isi .env
cp .env.example .env
php artisan key:generate
```

Pastikan `APP_URL=http://localhost:8000` dan konfigurasi database sudah benar.

### 2. Database — seeding data uji

```bash
php artisan migrate:fresh
php artisan db:seed
```

Seeder yang penting untuk E2E testing:

| Seeder | Data yang dibuat |
|---|---|
| `AdminAccountsSeeder` | `superadmin1@admin.com` / `password` |
| `RolesAndPermissionsSeeder` | 7 role: superadmin, kadep, admin, kalab, asisten, dosen, praktikan |
| `E2ETestPraktikanSeeder` | `12345678_testuser@student.unand.ac.id` / `12345678` |
| `KepengurusanUserSeeder` | Struktur kepengurusan aktif |

### 3. Install Playwright (sekali saja)

```bash
npm install
npx playwright install chromium
```

### 4. Jalankan server aplikasi

Buka terminal terpisah:

```bash
php artisan serve --port=8000
```

---

## Cara Menjalankan Tests

```bash
# Jalankan semua test E2E
npm run test:e2e

# Jalankan dengan UI interaktif (direkomendasikan untuk development)
npm run test:e2e:ui

# Jalankan dengan browser terlihat
npm run test:e2e:headed

# Jalankan dengan debug step-by-step
npm run test:e2e:debug

# Lihat laporan HTML setelah test selesai
npm run test:e2e:report

# Refresh auth state saja (tanpa jalankan semua test)
npm run test:e2e:auth

# Jalankan satu modul saja
npx playwright test tests/e2e/keuangan/
npx playwright test tests/e2e/auth/
```

---

## Struktur Direktori

```
tests/e2e/
├── global-setup.js              ← login dan simpan session per role
├── fixtures/
│   ├── auth.js                  ← path konstanta auth state
│   ├── .auth/                   ← gitignored — session cookies
│   │   ├── admin.json           ← generated saat jalankan setup
│   │   └── praktikan.json       ← generated saat jalankan setup
│   └── test-files/
│       ├── test.pdf             ← file valid untuk upload tugas
│       ├── test.txt             ← file invalid (ekstensi ditolak)
│       └── test.jpg             ← foto untuk dokumentasi / absensi
├── auth/authentication.spec.js
├── praktikum/praktikum.spec.js
├── piket/piket.spec.js
├── keuangan/keuangan.spec.js
├── inventaris/inventaris.spec.js
├── kegiatan-proker/kegiatan-proker.spec.js
├── kuesioner/kuesioner.spec.js
└── surat/surat.spec.js
```

---

## Kredensial Test

| Role | Email | Password | Catatan |
|---|---|---|---|
| Superadmin | `superadmin1@admin.com` | `password` | Bypass semua middleware kepengurusan |
| Praktikan | `12345678_testuser@student.unand.ac.id` | `12345678` | Dibuat oleh `E2ETestPraktikanSeeder` |

> **Penting:** Jangan gunakan `admin.{lab_id}@admin.com` untuk test manipulasi karena emailnya dinamis (tergantung UUID lab yang di-seed) dan terkena `active.kepengurusan` middleware. Gunakan `superadmin1@admin.com` untuk semua test admin-side.

---

## Konfigurasi Environment Variable

| Variable | Default | Keterangan |
|---|---|---|
| `PW_BASE_URL` | `http://localhost:8000` | URL server Laravel |
| `TEST_PRAKTIKAN_EMAIL` | `12345678_testuser@student.unand.ac.id` | Override email praktikan |
| `TEST_PRAKTIKAN_PASSWORD` | `12345678` | Override password praktikan |

---

## Laporan Test

Setelah `npm run test:e2e` selesai, buka laporan HTML:

```bash
npm run test:e2e:report
```

Laporan tersimpan di `playwright-report/` (gitignored).

---

## Catatan Teknis

- **Inertia.js navigation**: Gunakan `waitForURL()` atau `waitForLoadState('networkidle')` — bukan `waitForNavigation()` yang tidak kompatibel dengan Inertia XHR.
- **Sonner toast**: Selector `[data-sonner-toast]` untuk assert notifikasi sukses/error.
- **Kamera (piket absensi)**: Chromium dikonfigurasi dengan `--use-fake-ui-for-media-stream` di `playwright.config.js` sehingga kamera virtual tersedia tanpa hardware fisik.
- **Auth state**: File `.auth/admin.json` dan `.auth/praktikan.json` berisi cookies + localStorage session. Di-gitignore, di-generate ulang tiap kali `npm run test:e2e:auth` dijalankan.
- **Workers CI**: Konfigurasi `workers: 1` saat `CI=true` untuk menghindari race condition pada database yang di-share.
