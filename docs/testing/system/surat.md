# Modul Surat — E2E Test Specification

**File spec:** `tests/e2e/surat/surat.spec.js`

## Prasyarat
- Seeder: `AdminAccountsSeeder`, `RolesAndPermissionsSeeder`, `KepengurusanUserSeeder`
- Auth role: `superadmin1@admin.com`

---

## TC-SURAT-01a: Buat surat keluar

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/surat-menyurat/surat-keluar')`
2. Click `Tambah Surat` / `Buat Surat`
3. Isi perihal: `Surat E2E Keluar Test`
4. Isi tujuan: `Dekan FMIPA`
5. Isi tanggal: `2025-06-15`
6. Click submit (lampiran surat bersifat opsional)

**Expected:** Toast sukses (`[data-sonner-toast]`)

**Controller:** `SuratKeluarController@store` — `POST /surat-menyurat/surat-keluar`

---

## TC-SURAT-01b: Buat surat masuk

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/surat-menyurat/surat-masuk')`
2. Click `Tambah` / `Buat Surat Masuk`
3. Isi perihal: `Surat E2E Masuk Test`
4. Isi pengirim: `Pengirim Test E2E`
5. Isi tanggal: `2025-06-15`
6. Click submit

**Expected:** Toast sukses

**Controller:** `SuratMasukController@store` — `POST /surat-menyurat/surat-masuk`

---

## TC-SURAT-02: Arsip dan kategorisasi surat

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/surat-menyurat/surat-keluar')`
2. Verifikasi daftar surat render
3. Ulangi untuk `/surat-menyurat/surat-masuk`

**Expected:** `h1/h2` dan `table`/`[data-list]` terlihat di kedua halaman

---

## TC-SURAT-03a: Pencarian surat berdasarkan perihal

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/surat-menyurat/surat-keluar')`
2. Isi `input[type="search"]` / `input[placeholder*="cari"]` dengan `Surat E2E`
3. `waitForLoadState('networkidle')`

**Expected:** Halaman tetap render (hasil bisa 0 atau lebih)

---

## TC-SURAT-03b: Filter surat berdasarkan tanggal

**Steps:**
1. `page.goto('/surat-menyurat/surat-masuk')`
2. Isi `input[type="date"]` dengan tanggal filter
3. `waitForLoadState('networkidle')`

**Expected:** Halaman tetap render

---

## TC-SURAT-04a: Ekspor surat keluar

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/surat-menyurat/surat-keluar')`
2. `Promise.all` antara `waitForEvent('download')` dan click `Ekspor`

**Expected:** Download `.xlsx`, `.csv`, atau `.pdf`

**Controller:** `SuratKeluarController@export` — `GET /surat-menyurat/surat-keluar/export`

---

## TC-SURAT-04b: Ekspor surat masuk

**Steps:** Sama dengan TC-SURAT-04a namun di halaman surat masuk

**Controller:** `SuratMasukController@export` — `GET /surat-menyurat/surat-masuk/export`
