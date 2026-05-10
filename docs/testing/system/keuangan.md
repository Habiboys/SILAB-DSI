# Modul Keuangan — E2E Test Specification

**File spec:** `tests/e2e/keuangan/keuangan.spec.js`

## Prasyarat
- Seeder: `AdminAccountsSeeder`, `RolesAndPermissionsSeeder`, `KepengurusanUserSeeder`
- Auth role: `superadmin1@admin.com`
- `active.kepengurusan:keuangan`: di-bypass oleh superadmin

---

## TC-KEU-01: Buat nominal kas periodik

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/riwayat-keuangan')`
2. Click `Nominal Kas` / `Tambah Nominal`
3. Isi nominal: `50000`, nama: `Kas Bulanan E2E`
4. Click submit

**Expected:** Toast sukses (`[data-sonner-toast]`)

**Controller:** `RiwayatKeuanganController@storeNominalKas` — `POST /nominal-kas`

---

## TC-KEU-02a: Tambah transaksi pemasukan

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/riwayat-keuangan')`
2. Click `Tambah Transaksi`
3. Pilih tipe `pemasukan`
4. Isi jumlah: `100000`, keterangan: `Pemasukan test E2E`, tanggal: `2025-06-01`
5. Click submit

**Expected:** Toast sukses

**Controller:** `RiwayatKeuanganController@store` — `POST /riwayat-keuangan`

---

## TC-KEU-02b: Tambah transaksi pengeluaran

**Steps:** Sama dengan TC-KEU-02a, pilih tipe `pengeluaran`, jumlah: `20000`

**Expected:** Toast sukses

---

## TC-KEU-03: Filter laporan berdasarkan periode

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/rekap-keuangan')`
2. Isi date input pertama: `2025-01-01`
3. Isi date input kedua: `2025-12-31`
4. Click `Filter` / `Cari`

**Expected:** Halaman tetap render dengan data yang difilter

**Controller:** `RekapKeuanganController@index` — `GET /rekap-keuangan`

---

## TC-KEU-04: Ekspor laporan keuangan

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/riwayat-keuangan')`
2. `Promise.all` antara `waitForEvent('download')` dan click tombol ekspor

**Expected:** Download file `.xlsx` atau `.csv`

**Controller:** `RiwayatKeuanganController@export` — `GET /riwayat-keuangan/export`

**Library:** `maatwebsite/excel` 3.1
