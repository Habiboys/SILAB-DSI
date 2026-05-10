# Modul Praktikum — E2E Test Specification

**File spec:** `tests/e2e/praktikum/praktikum.spec.js`

## Prasyarat
- Seeder: `AdminAccountsSeeder`, `RolesAndPermissionsSeeder`, `E2ETestPraktikanSeeder`, `AslabPraktikumSeeder`
- Auth role admin: `superadmin1@admin.com`
- Auth role praktikan: `12345678_testuser@student.unand.ac.id`
- `active.kepengurusan`: di-bypass oleh superadmin
- Middleware: `aslab.access` pada beberapa route modul

---

## TC-PRAK-01: CRUD mata kuliah dan kelas praktikum

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/praktikum')`
2. `waitForLoadState('networkidle')`
3. Click tombol `Tambah` / `Buat Praktikum`
4. Isi nama mata kuliah di dialog
5. Click `button[type="submit"]`

**Expected:** Toast sukses muncul (`[data-sonner-toast]`)

**Controller:** `PraktikumController@store` — `POST /praktikum`

---

## TC-PRAK-02a: Submit tugas valid (PDF)

**Auth:** Praktikan (`PRAKTIKAN_AUTH_FILE`)

**Steps:**
1. `page.goto('/praktikan/daftar-tugas')`
2. Click link tugas pertama
3. `setInputFiles` dengan `test.pdf`
4. Click submit

**Expected:** Toast sukses muncul

**Controller:** `PengumpulanTugasController@store` — `POST /praktikum/{id}/tugas/{tugas}/pengumpulan`

**Allowed types:** `pdf`, `doc`, `docx`, `zip`, `rar` (max 10MB)

---

## TC-PRAK-02b: Submit tugas ekstensi tidak diizinkan (.txt)

**Auth:** Praktikan (`PRAKTIKAN_AUTH_FILE`)

**Steps:**
1. `page.goto('/praktikan/daftar-tugas')`
2. Click link tugas pertama
3. `setInputFiles` dengan `test.txt`
4. Click submit

**Expected:** Error validation muncul (`p.text-red-600` atau toast error)

---

## TC-PRAK-03: Input absensi praktikan

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/praktikum')`
2. Masuk ke praktikum → pertemuan → absensi
3. Pilih status `hadir` pada dropdown
4. Click `Simpan`

**Expected:** Toast sukses muncul

**Controller:** `PraktikumAbsensiController@storePraktikan` — `POST /praktikum/pertemuan/{id}/absensi-praktikan`

---

## TC-PRAK-04: Generate sertifikat praktikum

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/praktikum')`
2. Masuk ke detail praktikum
3. Click link sertifikat (`a[href*="sertifikat"]`)
4. `waitForURL('**/sertifikat**')`

**Expected:** Halaman sertifikat praktikum render (membutuhkan template yang sudah di-upload untuk generate aktual)

**Controller:** `PraktikumSertifikatController@index` — `GET /praktikum/{id}/sertifikat`
