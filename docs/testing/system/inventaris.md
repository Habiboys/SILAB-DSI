# Modul Inventaris — E2E Test Specification

**File spec:** `tests/e2e/inventaris/inventaris.spec.js`

## Prasyarat
- Seeder: `AdminAccountsSeeder`, `RolesAndPermissionsSeeder`, `AsetSeeder`
- Auth role: `superadmin1@admin.com`
- Public route QR scan: tidak memerlukan auth

---

## TC-INV-01: Daftarkan aset baru

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/inventaris')`
2. Click `Tambah Aset`
3. Isi kode barang: `E2E-ASET-001`
4. Pilih kategori dari dropdown
5. Click submit

**Expected:** Toast sukses (`[data-sonner-toast]`)

**Controller:** `DetailInventarisController@store` — `POST /detail-inventaris`

---

## TC-INV-02a: QR Code valid — halaman publik detail aset

**Auth:** Tidak diperlukan (public route)

**Steps:**
1. Dari `/inventaris`, ambil link detail aset pertama
2. Navigate ke `a[href*="/aset/"][href*="/detail"]`
3. `waitForLoadState('networkidle')`

**Expected:** Halaman detail aset publik render dengan informasi aset

**Route:** `GET /aset/{id}/detail` (public, tanpa auth)

---

## TC-INV-02b: QR Code invalid — UUID tidak valid

**Steps:**
1. `page.goto('/aset/00000000-0000-0000-0000-000000000000/detail')`

**Expected:** HTTP 404, atau halaman menampilkan pesan `tidak ditemukan` / `not found`

---

## TC-INV-03a: Buat peminjaman aset

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/inventaris/peminjaman')`
2. Click `Tambah` / `Buat Peminjaman`
3. Isi nama peminjam: `E2E Tester`
4. Isi tanggal pinjam
5. Click submit

**Controller:** `PeminjamanAsetController@store` — `POST /inventaris/peminjaman`

---

## TC-INV-03b: Pengembalian aset

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/inventaris/peminjaman')`
2. Click `Kembalikan` pada baris peminjaman aktif

**Expected:** Toast sukses

**Controller:** `PeminjamanAsetController@kembalikan` — `POST /inventaris/peminjaman/{id}/kembalikan`

---

## TC-INV-04a: Ajukan permohonan pengadaan aset

**Auth:** Admin (`ADMIN_AUTH_FILE`)

**Steps:**
1. `page.goto('/inventaris/permohonan')`
2. Click `Buat Permohonan` / `Tambah`
3. Isi nama barang: `Laptop E2E Test`
4. Click submit

**Controller:** `PermohonanAsetController@store` — `POST /inventaris/permohonan`

**Workflow permohonan:** draft → submit → review kalab → approve kadep → convert ke aset

---

## TC-INV-04b: Approval permohonan pengadaan

**Auth:** Admin (`ADMIN_AUTH_FILE`) — superadmin memiliki akses semua workflow

**Steps:**
1. `page.goto('/inventaris/permohonan')`
2. Click `Review` / `Setujui` pada permohonan yang tersedia

**Controller:**
- `PermohonanAsetController@reviewKalab` — `POST /inventaris/permohonan/{id}/review-kalab`
- `PermohonanAsetController@approveKadep` — `POST /inventaris/permohonan/{id}/approve-kadep`
