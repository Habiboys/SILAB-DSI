# Modul Autentikasi — E2E Test Specification

**File spec:** `tests/e2e/auth/authentication.spec.js`

## Prasyarat
- Seeder: `AdminAccountsSeeder`, `RolesAndPermissionsSeeder`, `E2ETestPraktikanSeeder`
- Auth role: tidak diperlukan (unauthenticated) kecuali TC-AUTH-03b dan TC-AUTH-04
- Tidak ada ketergantungan `active.kepengurusan`

---

## TC-AUTH-01: Login valid admin

**Describe:** `TC-AUTH-01: Login valid admin`

**Steps:**
1. `page.goto('/login')`
2. Fill `input#email` = `superadmin1@admin.com`
3. Fill `input#password` = `password`
4. Click `button[type="submit"]`
5. `waitForURL('**/dashboard')`

**Expected:** URL berisi `/dashboard`

---

## TC-AUTH-01b: Login valid praktikan

**Describe:** `TC-AUTH-01b: Login valid praktikan`

**Steps:**
1. `page.goto('/login')`
2. Fill `input#email` = `12345678_testuser@student.unand.ac.id`
3. Fill `input#password` = `12345678`
4. Click `button[type="submit"]`
5. `waitForURL('**/praktikan/daftar-tugas')`

**Expected:** URL berisi `/praktikan/daftar-tugas`

---

## TC-AUTH-02: Login gagal — password salah

**Describe:** `TC-AUTH-02: Login gagal`

**Steps:**
1. `page.goto('/login')`
2. Fill email valid, password = `passwordsalah`
3. Click submit
4. `waitForURL('**/login')`

**Expected:** Halaman tetap di `/login`, body mengandung teks error (`These credentials`, `salah`, atau `invalid`)

---

## TC-AUTH-02b: Login gagal — field kosong

**Steps:**
1. `page.goto('/login')`
2. Langsung click submit tanpa mengisi field
3. Tetap di `/login`

**Expected:** `input#email` masih terlihat (HTML5 required validation aktif atau server validation)

---

## TC-AUTH-03: Akses route tanpa autentikasi

**Describe:** `TC-AUTH-03: Akses tanpa autentikasi`

**Steps:**
1. Tanpa login, `page.goto('/dashboard')`
2. `waitForURL('**/login')`

**Expected:** Redirect ke `/login`

**Variasi:** `/riwayat-keuangan` juga harus redirect ke `/login`

---

## TC-AUTH-03b: Praktikan akses route staff

**Auth:** `PRAKTIKAN_AUTH_FILE`

**Steps:**
1. Login sebagai praktikan
2. `page.goto('/riwayat-keuangan')`

**Expected:** Status 403, atau redirect, atau halaman tidak menampilkan tombol "Tambah Transaksi"

---

## TC-AUTH-04: Redirect sesuai role setelah login

**Auth:** `ADMIN_AUTH_FILE`

**Steps:**
1. `page.goto('/')`
2. `waitForURL('**/dashboard')`

**Expected:** Admin diarahkan ke `/dashboard`

**Referensi kode:** `routes/web.php` baris home route, `AuthenticatedSessionController::store()`
