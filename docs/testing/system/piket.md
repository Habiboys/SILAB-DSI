# Modul Piket — E2E Test Specification

**File spec:** `tests/e2e/piket/piket.spec.js`

## Prasyarat
- Seeder: `AdminAccountsSeeder`, `RolesAndPermissionsSeeder`, `KepengurusanUserSeeder`
- Auth role: `superadmin1@admin.com`
- `active.kepengurusan`: di-bypass oleh superadmin
- Chromium flag: `--use-fake-ui-for-media-stream` (sudah dikonfigurasi di `playwright.config.js`)

---

## TC-PIKET-01: Susun jadwal piket

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/piket/jadwal')`
2. `waitForLoadState('networkidle')`
3. Click `Tambah` / `Buat Jadwal`
4. Pilih hari dari dropdown
5. Centang minimal satu user
6. Click submit

**Expected:** Toast sukses (`[data-sonner-toast]`)

**Controller:** `JadwalPiketController@store` — `POST /piket/jadwal`

---

## TC-PIKET-02: Input absensi check-in dengan foto

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Notes:** `AmbilAbsen.jsx` menggunakan `navigator.mediaDevices.getUserMedia`. Chromium dikonfigurasi dengan `--use-fake-ui-for-media-stream` dan `--use-fake-device-for-media-stream` sehingga kamera virtual tersedia.

**Steps:**
1. `page.goto('/piket/absensi')`
2. `waitForLoadState('networkidle')`
3. Click tombol `Check In` / `Ambil Absen`
4. Click `Buka Kamera` / `Mulai Kamera`
5. Kamera fake aktif otomatis

**Expected:** Tombol `Ambil Foto` atau elemen `<video>` terlihat dalam 8 detik

**Controller:** `AbsensiController@store` — `POST /piket/absensi/simpan`

---

## TC-PIKET-03a: Pengajuan ganti jadwal

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/piket/ganti-jadwal')`
2. Click `Ajukan` / `Tambah`
3. Isi tanggal pengganti
4. Click submit

**Controller:** `GantiJadwalPiketController@store` — `POST /piket/ganti-jadwal`

---

## TC-PIKET-03b: Persetujuan ganti jadwal oleh admin

**Steps:**
1. Di halaman `/piket/ganti-jadwal`
2. Cari entri dengan status `pending`
3. Click `Setuju` / `Approve`

**Expected:** Toast sukses

**Controller:** `GantiJadwalPiketController@approveReject` — `POST /piket/ganti-jadwal/{id}/approve`

---

## TC-PIKET-04: Ekspor rekap absensi

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/piket/rekap-absen')`
2. `waitForLoadState('networkidle')`
3. `Promise.all` antara `waitForEvent('download')` dan click tombol ekspor

**Expected:** File download dengan ekstensi `.xlsx`, `.csv`, atau `.pdf`

**Controller:** `AbsensiController@rekapAbsen` — `GET /piket/rekap-absen`
