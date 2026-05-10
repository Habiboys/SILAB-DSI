# Modul Kuesioner — E2E Test Specification

**File spec:** `tests/e2e/kuesioner/kuesioner.spec.js`

## Prasyarat
- Seeder: `AdminAccountsSeeder`, `RolesAndPermissionsSeeder`, `E2ETestPraktikanSeeder`
- Auth role admin: `superadmin1@admin.com`
- Auth role praktikan: `12345678_testuser@student.unand.ac.id`
- Middleware: `EnsureMandatoryKuesionerCompleted` (bisa memblokir navigasi jika ada kuesioner wajib belum diisi)

---

## TC-KUE-01: Buat kuesioner baru dengan target role

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/kuesioner')`
2. Click `Buat Kuesioner`
3. Isi judul: `Kuesioner E2E Test`, deskripsi
4. Centang target role `praktikan` (`input[type="checkbox"][value*="praktikan"]`)
5. Click submit

**Expected:** Redirect ke halaman detail kuesioner atau list kuesioner

**Controller:** `KuesionerController@store` — `POST /kuesioner`

---

## TC-KUE-02: Submit jawaban (verifikasi visibilitas per role)

**Auth:** Praktikan (`PRAKTIKAN_AUTH_FILE`)

**Steps:**
1. `page.goto('/kuesioner')`
2. Kuesioner yang ditargetkan ke `praktikan` harus tampil
3. Click `Isi` / `Isi Sekarang`
4. Isi jawaban (text field atau radio button)
5. Click `Kirim` / `Submit`

**Expected:** Submission berhasil, tidak ada error

**Controller:** `ResponKuesionerController@store` — `POST /kuesioner/{kuesioner}/submit`

---

## TC-KUE-03: Cegah submit duplikat

**Auth:** Praktikan (`PRAKTIKAN_AUTH_FILE`)

**Steps:**
1. `page.goto('/kuesioner')`
2. Kuesioner yang sudah diisi tidak menampilkan link `Isi` lagi
3. Atau link `Isi` diarahkan ke halaman "sudah diisi"

**Expected:** Salah satu kondisi terpenuhi:
- Indikator `Sudah Diisi` / `Sudah Dijawab` tampil
- Link `Isi` tidak ada
- Percobaan submit kedua menghasilkan error/redirect

**Implementasi backend:** `ResponKuesioner` model menyimpan `user_id + kuesioner_id` sebagai kombinasi unik

---

## TC-KUE-04: Ekspor hasil kuesioner

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/kuesioner')`
2. Masuk ke detail kuesioner
3. Click `Ekspor` / link `export`
4. `Promise.all` antara `waitForEvent('download')` dan click ekspor

**Expected:** Download file `.xlsx` atau `.csv`

**Controller:** `KuesionerController@export` — `GET /kuesioner/{kuesioner}/export`

**Library:** `maatwebsite/excel` 3.1
