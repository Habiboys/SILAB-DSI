# Lampiran Audit Role, Permission, dan Route

Tanggal audit: 04 April 2026  
Sumber audit: route aktif sistem + hasil pemeriksaan database permission melalui `php artisan tinker`.

---

## 1) Ringkasan Hasil Audit Tinker

Role yang diperiksa:

- `admin`
- `asisten`
- `dosen`
- `kadep`
- `praktikan`

Temuan utama:

- Total permission di sistem: **114**.
- Jumlah permission unik per role:
    - `admin`: **114**
    - `asisten`: **114**
    - `dosen`: **22**
    - `kadep`: **114**
    - `praktikan`: **114**

Catatan penting:

- Saat ini `admin`, `asisten`, `kadep`, dan `praktikan` memiliki set permission yang sama (114). Ini menandakan konfigurasi permission antar role belum tersegmentasi sesuai prinsip least-privilege.

---

## 2) Detail Permission per Role

## 2.1 Role `dosen` (22 permission)

- `disposisi.create`
- `disposisi.update-status`
- `disposisi.view`
- `kegiatan.approve`
- `kegiatan.view`
- `konfigurasi-surat.edit`
- `konfigurasi-surat.view`
- `proker.approve`
- `proker.view`
- `surat-keluar.create`
- `surat-keluar.delete`
- `surat-keluar.edit`
- `surat-keluar.export`
- `surat-keluar.view`
- `surat-keluar.viewAny`
- `surat-masuk.create`
- `surat-masuk.delete`
- `surat-masuk.edit`
- `surat-masuk.export`
- `surat-masuk.view`
- `surat-masuk.viewAny`
- `survey.participate`

## 2.2 Role `admin`, `asisten`, `kadep`, `praktikan` (set permission identik, 114 permission)

Daftar permission kanonik:

- `absensi.create`
- `absensi.delete`
- `absensi.manual.create`
- `absensi.manual.delete`
- `absensi.manual.update`
- `absensi.update`
- `absensi.verify`
- `absensi.view`
- `disposisi.create`
- `disposisi.update-status`
- `disposisi.view`
- `inventaris.approve-permohonan`
- `inventaris.manage-items`
- `inventaris.manage-kategori`
- `inventaris.manage-permohonan`
- `inventaris.view`
- `kegiatan.approve`
- `kegiatan.create`
- `kegiatan.delete`
- `kegiatan.edit`
- `kegiatan.view`
- `kepengurusan.manage-anggota`
- `kepengurusan.manage-struktur`
- `kepengurusan.transfer-anggota`
- `kepengurusan.view`
- `keuangan.create-transaksi`
- `keuangan.delete-transaksi`
- `keuangan.update-transaksi`
- `keuangan.view`
- `konfigurasi-surat.edit`
- `konfigurasi-surat.view`
- `modul.create`
- `modul.create-modul`
- `modul.delete`
- `modul.delete-modul`
- `modul.publish`
- `modul.update`
- `modul.update-modul`
- `modul.view`
- `piket.approve-ganti-jadwal`
- `piket.manage-jadwal`
- `piket.manage-periode`
- `piket.request-ganti-jadwal`
- `piket.view`
- `piket.view-jadwal`
- `praktikan.create`
- `praktikan.delete`
- `praktikan.import`
- `praktikan.update`
- `praktikan.view`
- `praktikum.assign-aslab`
- `praktikum.create`
- `praktikum.delete`
- `praktikum.pertemuan.create`
- `praktikum.pertemuan.delete`
- `praktikum.pertemuan.update`
- `praktikum.pertemuan.view`
- `praktikum.sertifikat.create`
- `praktikum.sertifikat.generate`
- `praktikum.sertifikat.view`
- `praktikum.update`
- `praktikum.view`
- `proker.approve`
- `proker.create`
- `proker.delete`
- `proker.update`
- `proker.update-progress`
- `proker.view`
- `rubrik.create`
- `rubrik.delete`
- `rubrik.grade`
- `rubrik.update`
- `rubrik.view`
- `sertifikat.create`
- `sertifikat.delete`
- `sertifikat.generate`
- `sertifikat.update`
- `sertifikat.view`
- `surat-keluar.create`
- `surat-keluar.delete`
- `surat-keluar.edit`
- `surat-keluar.export`
- `surat-keluar.view`
- `surat-keluar.viewAny`
- `surat-masuk.create`
- `surat-masuk.delete`
- `surat-masuk.edit`
- `surat-masuk.export`
- `surat-masuk.view`
- `surat-masuk.viewAny`
- `surat.create`
- `surat.create_resmi`
- `surat.delete`
- `surat.update`
- `surat.view`
- `surat.view_all`
- `survey.create`
- `survey.delete`
- `survey.edit`
- `survey.participate`
- `survey.view`
- `survey.view_results`
- `tugas.create`
- `tugas.delete`
- `tugas.grade`
- `tugas.submit`
- `tugas.update`
- `tugas.view`
- `user-management.create`
- `user-management.delete`
- `user-management.manage-permissions`
- `user-management.manage-roles`
- `user-management.update`
- `user-management.view`

---

## 3) Referensi Route Sistem (Named Route)

Ringkasan grup route bernama (hasil pembacaan route runtime):

- `praktikum=75`
- `piket=25`
- `inventaris=20`
- `surat-menyurat=17`
- `kegiatan=16`
- `data-master=15`
- `kuesioner=11`
- `detail-inventaris=10`
- `proker=8`
- `praktikan=8`
- `lpj-kepengurusan=8`
- `riwayat-keuangan=7`
- `user-management=4`
- `struktur-permissions=4`
- serta route pendukung lain (`dashboard`, `profile`, `auth`, dll).

---

## 4) Pemetaan Role ke Akses Route (Berdasarkan Constraint Route)

## 4.1 Akses eksplisit berbasis middleware role

- Group `role:praktikan`:
    - `praktikan.daftar-tugas`
    - `praktikan.tugas.show`
    - `praktikan.tugas.view-instruksi`
    - `praktikan.praktikum.tugas`
    - `praktikan.riwayat`
    - `praktikan.riwayat.show`
    - `praktikan.modul.index`
    - `praktikum.tugas.pengumpulan.store`
    - `praktikum.pengumpulan.cancel`

- Group `role:superadmin|kadep`:
    - `user-management.*`
    - `struktur-permissions.*`
    - `data-master.struktur.*`
    - `data-master.kategori-aset.*` (subgroup `role:superadmin` untuk sebagian route)
    - `laboratorium.index`
    - `laboratorium.update`

## 4.2 Akses berbasis policy/permission (tidak hardcoded role tunggal)

Route utama modul seperti `proker.*`, `praktikum.*`, `piket.*`, `inventaris.*`, `kuesioner.*`, `riwayat-keuangan.*`, `surat-menyurat.*`, `lpj-kepengurusan.*` banyak menggunakan kombinasi:

- middleware `auth`
- middleware `active.kepengurusan:*`
- middleware `aslab.access` (khusus praktikum)
- gate/policy (`->can(...)`)

Sehingga, akses final ditentukan oleh gabungan:

1. role user,
2. permission user,
3. konteks lab/kepengurusan aktif,
4. policy object (mis. pemilik/ruang lingkup data).

---

## 5) Implikasi untuk Dokumen Rangkuman Fungsional

- Narasi fungsional per role pada laporan sudah dapat disusun berdasarkan route + permission saat ini.
- Namun, untuk akurasi keamanan, disarankan melakukan normalisasi assignment permission agar:
    - `praktikan` hanya memiliki permission kebutuhan praktikan,
    - `asisten` fokus operasional,
    - `admin` fokus manajemen,
    - `kadep` fokus approval/monitoring strategis,
    - `dosen` fokus fungsi akademik yang ditetapkan.

---

## 6) Rekomendasi Tindak Lanjut

1. Lakukan review seeder role-permission (`RolesAndPermissionsSeeder`, `RolePermissionSeeder`, seeder permission per modul).
2. Terapkan matriks target **Role × Permission** sebagai baseline resmi.
3. Jalankan audit ulang tinker setelah normalisasi.
4. Sinkronkan dokumen ringkasan fungsional dengan hasil normalisasi final.
