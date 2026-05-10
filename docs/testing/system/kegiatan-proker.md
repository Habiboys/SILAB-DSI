# Modul Kegiatan & Proker — E2E Test Specification

**File spec:** `tests/e2e/kegiatan-proker/kegiatan-proker.spec.js`

## Prasyarat
- Seeder: `AdminAccountsSeeder`, `RolesAndPermissionsSeeder`, `KepengurusanUserSeeder`, `ProkerKegiatanSeeder`
- Auth role: `superadmin1@admin.com`
- `active.kepengurusan:proker`: di-bypass oleh superadmin
- Fixture file: `test.jpg` (untuk dokumentasi)

---

## TC-PROKER-01: Buat proker baru

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/proker')`
2. Click `Tambah Proker` / `Buat`
3. Isi nama proker: `Proker E2E Test`
4. Isi deskripsi
5. Click submit

**Expected:** Toast sukses (`[data-sonner-toast]`)

**Controller:** `ProkerController@store` — `POST /proker`

---

## TC-PROKER-02a: Setujui proker yang diajukan

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/proker')`
2. Cari baris dengan status `diajukan`
3. Masuk ke detail proker
4. Click `Setujui` / `Approve`

**Expected:** Toast sukses, status proker berubah

**Controller:** `ProkerController@approve` — `POST /proker/{proker}/approve`

---

## TC-PROKER-02b: Tolak proker dengan catatan

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. Di detail proker dengan status `diajukan`
2. Click `Tolak` / `Reject`
3. Dialog muncul — isi catatan: `Catatan penolakan dari E2E test`
4. Click submit

**Controller:** `ProkerController@approve` dengan status `ditolak`

---

## TC-KEGIATAN-03: Upload dokumentasi kegiatan

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/kegiatan')`
2. Masuk ke kegiatan pertama
3. Click `Unggah Dokumentasi` / `Upload`
4. `setInputFiles` dengan `test.jpg`
5. Click submit

**Expected:** Toast sukses

**Controller:** `DokumentasiKegiatanController@store` — `POST /kegiatan/{kegiatan}/dokumentasi`

---

## TC-LPJ-04: Kunci LPJ final dan ekspor PDF

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/lpj-kepengurusan/export-pdf')` secara langsung
2. Atau navigasi dari menu → LPJ Kepengurusan → Export PDF

**Expected:** File PDF di-download otomatis

**Controller:** `LpjKepengurusanController@exportPdf` — `GET /lpj-kepengurusan/export-pdf`

**Library:** `barryvdh/laravel-dompdf` 3.1

**Catatan:** Export PDF langsung via URL redirect — Playwright akan mendeteksi download event.
