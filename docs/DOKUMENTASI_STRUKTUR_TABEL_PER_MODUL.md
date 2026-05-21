# Dokumentasi Struktur Tabel per Modul

Dokumen ini disusun dari file `silabdbnow.sql` dan merangkum **semua tabel** ke dalam modul fungsional.

- Total tabel terdeteksi: **70**
- Tanggal generate: **2026-04-25**

## Modul: Sistem & Auth

### Tabel: `users`

> Data akun pengguna aplikasi.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `name` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `email` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `email_verified_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `password` | `varchar(255)` | Wajib (NOT NULL) |
| FK | `access_lab_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `laboratorium.id` |
| Field | `remember_token` | `varchar(100)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `profile`

> Menyimpan data terkait `profile`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| Field | `nomor_induk` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `jenis_kelamin` | `enum('laki-laki','perempuan')` | Wajib (NOT NULL) |
| Field | `foto_profile` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `tanda_tangan` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `alamat` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `no_hp` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `tempat_lahir` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `tanggal_lahir` | `date` | Boleh NULL; Default: NULL |
| Field | `nomor_anggota` | `varchar(255)` | Boleh NULL; Default: NULL |
| PK, FK | `user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `roles`

> Daftar peran (role) pengguna sistem.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `name` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `guard_name` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `permissions`

> Daftar hak akses granular sistem.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `name` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `guard_name` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `model_has_roles`

> Menyimpan data terkait `model has roles`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK, FK | `role_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `roles.id` |
| PK | `model_type` | `varchar(255)` | Wajib (NOT NULL) |
| PK | `model_uuid` | `char(36)` | Wajib (NOT NULL) |

### Tabel: `model_has_permissions`

> Menyimpan data terkait `model has permissions`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK, FK | `permission_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `permissions.id` |
| PK | `model_type` | `varchar(255)` | Wajib (NOT NULL) |
| PK | `model_uuid` | `char(36)` | Wajib (NOT NULL) |

### Tabel: `role_has_permissions`

> Menyimpan data terkait `role has permissions`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK, FK | `permission_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `permissions.id` |
| PK, FK | `role_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `roles.id` |

### Tabel: `sessions`

> Menyimpan data terkait `sessions`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `user_id` | `char(36)` | Boleh NULL; Default: NULL |
| Field | `ip_address` | `varchar(45)` | Boleh NULL; Default: NULL |
| Field | `user_agent` | `text` | Boleh NULL |
| Field | `payload` | `longtext` | Wajib (NOT NULL) |
| Field | `last_activity` | `int` | Wajib (NOT NULL) |

### Tabel: `password_reset_tokens`

> Menyimpan data terkait `password reset tokens`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `email` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `token` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `cache`

> Menyimpan data terkait `cache`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `key` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `value` | `mediumtext` | Wajib (NOT NULL) |
| Field | `expiration` | `int` | Wajib (NOT NULL) |

### Tabel: `cache_locks`

> Menyimpan data terkait `cache locks`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `key` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `owner` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `expiration` | `int` | Wajib (NOT NULL) |

### Tabel: `jobs`

> Menyimpan data terkait `jobs`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `bigint` | Wajib (NOT NULL) |
| Field | `queue` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `payload` | `longtext` | Wajib (NOT NULL) |
| Field | `attempts` | `tinyint` | Wajib (NOT NULL) |
| Field | `reserved_at` | `int` | Boleh NULL; Default: NULL |
| Field | `available_at` | `int` | Wajib (NOT NULL) |
| Field | `created_at` | `int` | Wajib (NOT NULL) |

### Tabel: `job_batches`

> Menyimpan data terkait `job batches`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `name` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `total_jobs` | `int` | Wajib (NOT NULL) |
| Field | `pending_jobs` | `int` | Wajib (NOT NULL) |
| Field | `failed_jobs` | `int` | Wajib (NOT NULL) |
| Field | `failed_job_ids` | `longtext` | Wajib (NOT NULL) |
| Field | `options` | `mediumtext` | Boleh NULL |
| Field | `cancelled_at` | `int` | Boleh NULL; Default: NULL |
| Field | `created_at` | `int` | Wajib (NOT NULL) |
| Field | `finished_at` | `int` | Boleh NULL; Default: NULL |

### Tabel: `failed_jobs`

> Menyimpan data terkait `failed jobs`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `bigint` | Wajib (NOT NULL) |
| Field | `uuid` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `connection` | `text` | Wajib (NOT NULL) |
| Field | `queue` | `text` | Wajib (NOT NULL) |
| Field | `payload` | `longtext` | Wajib (NOT NULL) |
| Field | `exception` | `longtext` | Wajib (NOT NULL) |
| Field | `failed_at` | `timestamp` | Wajib (NOT NULL); Default: CURRENT_TIMESTAMP |

### Tabel: `migrations`

> Riwayat migrasi database Laravel.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `int` | Wajib (NOT NULL) |
| Field | `migration` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `batch` | `int` | Wajib (NOT NULL) |

## Modul: Master Kepengurusan

### Tabel: `laboratorium`

> Menyimpan data terkait `laboratorium`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `nama` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `logo` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `tahun_kepengurusan`

> Menyimpan data terkait `tahun kepengurusan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `tahun` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `isactive` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| Field | `mulai` | `date` | Wajib (NOT NULL) |
| Field | `selesai` | `date` | Wajib (NOT NULL) |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `kepengurusan_lab`

> Menyimpan data terkait `kepengurusan lab`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `tahun_kepengurusan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `tahun_kepengurusan.id` |
| FK | `laboratorium_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `laboratorium.id` |
| Field | `sk` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `is_active` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `struktur`

> Menyimpan data terkait `struktur`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `struktur` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `jabatan_tunggal` | `tinyint(1)` | Wajib (NOT NULL); Default: '1' |
| FK | `default_role_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `roles.id` |
| FK | `parent_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `struktur.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `kepengurusan_user`

> Menyimpan data terkait `kepengurusan user`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| FK | `user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| FK | `struktur_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `struktur.id` |
| Field | `is_active` | `tinyint(1)` | Wajib (NOT NULL); Default: '1' |
| Field | `tanggal_bergabung` | `date` | Wajib (NOT NULL); Default: '2025-08-16' |
| Field | `tanggal_keluar` | `date` | Boleh NULL; Default: NULL |
| Field | `catatan` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `struktur_permissions`

> Menyimpan data terkait `struktur permissions`. Composite PK `(struktur_id, permission_id)` — tidak ada kolom `id` terpisah.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK, FK | `struktur_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `struktur.id` |
| PK, FK | `permission_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `permissions.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

## Modul: Praktikum

### Tabel: `mata_kuliah`

> Menyimpan data terkait `mata kuliah`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `kode_mata_kuliah` | `varchar(30)` | Wajib (NOT NULL) |
| Field | `nama` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `sks` | `tinyint` | Wajib (NOT NULL) |
| Field | `semester` | `tinyint` | Wajib (NOT NULL) |
| Field | `status` | `enum('aktif','nonaktif')` | Wajib (NOT NULL); Default: 'aktif' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `praktikum`

> Menyimpan data terkait `praktikum`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `mata_kuliah` | `varchar(255)` | Wajib (NOT NULL) |
| FK | `mata_kuliah_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `mata_kuliah.id` |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `kelas`

> Menyimpan data terkait `kelas`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `nama_kelas` | `varchar(255)` | Wajib (NOT NULL) |
| FK | `praktikum_id` | `varchar(255)` | Wajib (NOT NULL); Relasi ke `praktikum.id` |
| FK | `parent_kelas_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `kelas.id` |
| Field | `status` | `enum('aktif','nonaktif')` | Wajib (NOT NULL); Default: 'aktif' |
| Field | `hari` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `jam_mulai` | `time` | Boleh NULL; Default: NULL |
| Field | `jam_selesai` | `time` | Boleh NULL; Default: NULL |
| Field | `ruangan` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `pertemuan_praktikum`

> Menyimpan data terkait `pertemuan praktikum`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kelas_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kelas.id` |
| Field | `judul` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `deskripsi` | `text` | Boleh NULL |
| Field | `tanggal` | `datetime` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `aslab_praktikum`

> Menyimpan data terkait `aslab praktikum`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `bigint` | Wajib (NOT NULL) |
| FK | `praktikum_id` | `varchar(255)` | Wajib (NOT NULL); Relasi ke `praktikum.id` |
| FK | `user_id` | `varchar(255)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `catatan` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `praktikan`

> Menyimpan data terkait `praktikan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `nim` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `nama` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `angkatan` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `no_hp` | `varchar(255)` | Boleh NULL; Default: NULL |
| FK | `user_id` | `varchar(255)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `praktikan_praktikum`

> Menyimpan data terkait `praktikan praktikum`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `praktikan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `praktikan.id` |
| FK | `praktikum_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `praktikum.id` |
| FK | `kelas_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kelas.id` |
| Field | `status` | `enum('aktif','nonaktif')` | Wajib (NOT NULL); Default: 'aktif' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `absensi_aslab`

> Menyimpan data terkait `absensi aslab`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `pertemuan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `pertemuan_praktikum.id` |
| FK | `aslab_praktikum_id` | `bigint` | Wajib (NOT NULL); Relasi ke `aslab_praktikum.id` |
| Field | `status` | `enum('hadir','sakit','izin','alpa')` | Wajib (NOT NULL); Default: 'alpa' |
| Field | `waktu_absen` | `datetime` | Boleh NULL; Default: NULL |
| Field | `keterangan` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `absensi_praktikan`

> Menyimpan data terkait `absensi praktikan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `pertemuan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `pertemuan_praktikum.id` |
| FK | `praktikan_praktikum_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `praktikan_praktikum.id` |
| Field | `status` | `enum('hadir','sakit','izin','alpa')` | Wajib (NOT NULL); Default: 'alpa' |
| Field | `waktu_absen` | `datetime` | Boleh NULL; Default: NULL |
| Field | `keterangan` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `tugas_praktikum`

> Menyimpan data terkait `tugas praktikum`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `pertemuan_id` | `varchar(255)` | Boleh NULL; Default: NULL; Relasi ke `pertemuan_praktikum.id` |
| FK | `kelas_id` | `varchar(255)` | Boleh NULL; Default: NULL; Relasi ke `kelas.id` |
| Field | `judul_tugas` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `deskripsi` | `text` | Boleh NULL |
| Field | `file_tugas` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `deadline` | `datetime` | Wajib (NOT NULL) |
| Field | `status` | `enum('aktif','nonaktif')` | Wajib (NOT NULL); Default: 'aktif' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `pengumpulan_tugas`

> Menyimpan data terkait `pengumpulan tugas`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `tugas_praktikum_id` | `varchar(255)` | Wajib (NOT NULL); Relasi ke `tugas_praktikum.id` |
| FK | `praktikan_praktikum_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `praktikan_praktikum.id` |
| Field | `file_pengumpulan` | `longtext` | Boleh NULL |
| Field | `catatan` | `text` | Boleh NULL |
| Field | `feedback` | `text` | Boleh NULL |
| Field | `nilai` | `decimal(5,2)` | Boleh NULL; Default: NULL |
| Field | `status` | `enum('dikumpulkan','dinilai','terlambat')` | Wajib (NOT NULL); Default: 'dikumpulkan' |
| Field | `submitted_at` | `timestamp` | Wajib (NOT NULL); Default: CURRENT_TIMESTAMP |
| Field | `dinilai_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `komponen_rubrik`

> Menyimpan data terkait `komponen rubrik`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `tugas_praktikum_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `tugas_praktikum.id` |
| Field | `nama_komponen` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `deskripsi` | `text` | Boleh NULL |
| Field | `bobot` | `decimal(5,2)` | Wajib (NOT NULL) |
| Field | `nilai_maksimal` | `decimal(5,2)` | Wajib (NOT NULL); Default: '100.00' |
| Field | `urutan` | `int` | Wajib (NOT NULL); Default: '1' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `nilai_rubrik`

> Menyimpan data terkait `nilai rubrik`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `pengumpulan_tugas_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `pengumpulan_tugas.id` |
| FK | `komponen_rubrik_id` | `varchar(255)` | Wajib (NOT NULL); Relasi ke `komponen_rubrik.id` |
| Field | `nilai` | `decimal(5,2)` | Wajib (NOT NULL) |
| Field | `catatan` | `text` | Boleh NULL |
| FK | `dinilai_oleh` | `varchar(255)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `dinilai_at` | `timestamp` | Wajib (NOT NULL); Default: CURRENT_TIMESTAMP |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `nilai_tambahan`

> Menyimpan data terkait `nilai tambahan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `pengumpulan_tugas_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `pengumpulan_tugas.id` |
| Field | `nilai` | `decimal(5,2)` | Wajib (NOT NULL) |
| Field | `kategori` | `varchar(255)` | Wajib (NOT NULL); Default: 'bonus' |
| Field | `keterangan` | `text` | Boleh NULL |
| FK | `diberikan_oleh` | `varchar(255)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `diberikan_at` | `timestamp` | Wajib (NOT NULL); Default: CURRENT_TIMESTAMP |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `modul_praktikum`

> Menyimpan data terkait `modul praktikum`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `pertemuan_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `pertemuan_praktikum.id` |
| Field | `judul` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `modul` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `nomor_pertemuan` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `is_public` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| Field | `hash` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

## Modul: Inventaris Aset

### Tabel: `kategori_aset`

> Menyimpan data terkait `kategori aset`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `nama` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `deskripsi` | `text` | Wajib (NOT NULL) |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `aset`

> Menyimpan data detail aset/inventaris laboratorium. (Sebelumnya bernama `detail_aset`.)

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kategori_aset_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kategori_aset.id` |
| FK | `laboratorium_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `laboratorium.id` |
| Field | `nama` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `keterangan` | `text` | Boleh NULL |
| Field | `tanggal_perolehan` | `date` | Boleh NULL; Default: NULL |
| Field | `harga_perolehan` | `decimal(15,2)` | Boleh NULL; Default: NULL |
| Field | `asal_barang` | `enum('pengadaan','hibah','pembelian_mandiri','lainnya')` | Boleh NULL; Default: NULL |
| FK | `wishlist_aset_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `wishlist_aset.id` |
| Field | `kode_barang` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `foto` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `qr_code_path` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `status` | `enum('tersedia','dipinjam')` | Wajib (NOT NULL) |
| Field | `keadaan` | `enum('baik','rusak','hilang')` | Wajib (NOT NULL); Default: 'baik' |
| Field | `jumlah` | `int` | Wajib (NOT NULL); Default: '1' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `riwayat_kondisi_aset`

> Menyimpan data terkait `riwayat kondisi aset`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `aset_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `aset.id` |
| Field | `kondisi_sebelum` | `enum('baik','rusak','hilang')` | Boleh NULL; Default: NULL |
| Field | `kondisi_sesudah` | `enum('baik','rusak','hilang')` | Wajib (NOT NULL) |
| Field | `catatan` | `text` | Boleh NULL |
| FK | `dicatat_oleh` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `permohonan_aset`

> Menyimpan data terkait `permohonan aset`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `user_pemohon_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| FK | `laboratorium_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `laboratorium.id` |
| Field | `nomor_permohonan` | `varchar(100)` | Wajib (NOT NULL) |
| Field | `tanggal_permohonan` | `date` | Wajib (NOT NULL) |
| Field | `alasan_umum_pengadaan` | `text` | Wajib (NOT NULL) |
| Field | `status_permohonan` | `enum('diajukan','disetujui','ditolak')` | Wajib (NOT NULL); Default: 'diajukan' |
| Field | `catatan_approval` | `text` | Boleh NULL |
| FK | `approved_by` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `approved_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `wishlist_aset`

> Menyimpan data terkait `wishlist aset`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `permohonan_aset_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `permohonan_aset.id` |
| Field | `nama_barang` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `jenis_barang` | `varchar(100)` | Boleh NULL; Default: NULL |
| Field | `spesifikasi_teknis` | `text` | Boleh NULL |
| Field | `perkiraan_harga` | `decimal(15,2)` | Boleh NULL; Default: NULL |
| Field | `jumlah_diminta` | `int` | Wajib (NOT NULL); Default: '1' |
| Field | `satuan` | `varchar(50)` | Boleh NULL; Default: NULL |
| Field | `urgensi` | `enum('rendah','sedang','tinggi','sangat_tinggi')` | Wajib (NOT NULL); Default: 'sedang' |
| Field | `referensi_url` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `status_item` | `enum('diajukan','disetujui','ditolak','dipesan','diterima')` | Wajib (NOT NULL); Default: 'diajukan' |
| Field | `jumlah_disetujui` | `int` | Boleh NULL; Default: NULL |
| Field | `catatan_item` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `peminjaman_aset`

> Menyimpan data terkait `peminjaman aset`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `aset_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `aset.id` |
| FK | `peminjam_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `nama_peminjam` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `institusi` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `keperluan` | `text` | Wajib (NOT NULL) |
| Field | `tanggal_pinjam` | `date` | Wajib (NOT NULL) |
| Field | `tanggal_kembali_rencana` | `date` | Wajib (NOT NULL) |
| Field | `tanggal_kembali_aktual` | `date` | Boleh NULL; Default: NULL |
| Field | `status` | `enum('dipinjam','dikembalikan','terlambat')` | Wajib (NOT NULL); Default: 'dipinjam' |
| Field | `surat_peminjaman_path` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `catatan` | `text` | Boleh NULL |
| FK | `diproses_oleh` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `peminjaman_aset_items`

> Menyimpan item-item aset per transaksi peminjaman (relasi many-to-many antara peminjaman dan aset).

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `peminjaman_aset_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `peminjaman_aset.id` |
| FK | `aset_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `aset.id` |
| Field | `tanggal_kembali_aktual` | `date` | Boleh NULL; Default: NULL |
| Field | `kondisi_setelah_kembali` | `enum('baik','rusak')` | Boleh NULL; Default: NULL |
| Field | `catatan_item` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `template_surat_peminjaman`

> Menyimpan data terkait `template surat peminjaman`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `nama_template` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `file_path` | `varchar(255)` | Wajib (NOT NULL) |
| FK | `laboratorium_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `laboratorium.id` |
| Field | `deskripsi` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

## Modul: Keuangan

### Tabel: `nominal_kas`

> Menyimpan data terkait `nominal kas`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `nominal` | `decimal(10,2)` | Wajib (NOT NULL) |
| Field | `periode` | `enum('mingguan','bulanan')` | Wajib (NOT NULL) |
| Field | `periode_mulai` | `date` | Boleh NULL; Default: NULL |
| Field | `periode_berakhir` | `date` | Boleh NULL; Default: NULL |
| Field | `is_active` | `tinyint(1)` | Wajib (NOT NULL); Default: '1' |
| Field | `deskripsi` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `pemasukan_keuangan`

> Menyimpan data terkait `pemasukan keuangan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `tanggal` | `date` | Wajib (NOT NULL) |
| Field | `nominal` | `bigint` | Wajib (NOT NULL) |
| Field | `deskripsi` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `bukti` | `varchar(255)` | Boleh NULL; Default: NULL |
| FK | `user_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| FK | `nominal_kas_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `nominal_kas.id` |
| Field | `is_uang_kas` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| Field | `jenis_pembayaran_kas` | `enum('normal','lebih')` | Boleh NULL; Default: NULL |
| Field | `catatan_pembayaran` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `pengeluaran_keuangan`

> Menyimpan data terkait `pengeluaran keuangan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `tanggal` | `date` | Wajib (NOT NULL) |
| Field | `nominal` | `bigint` | Wajib (NOT NULL) |
| Field | `deskripsi` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `bukti` | `varchar(255)` | Boleh NULL; Default: NULL |
| FK | `user_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

## Modul: Kegiatan & Proker

### Tabel: `proker`

> Menyimpan data terkait `proker`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `struktur_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `struktur.id` |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `nama_proker` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `tujuan` | `text` | Boleh NULL |
| Field | `sasaran` | `text` | Boleh NULL |
| Field | `output_kegiatan` | `text` | Boleh NULL |
| Field | `deskripsi` | `text` | Wajib (NOT NULL) |
| Field | `status` | `enum('belum_mulai','sedang_berjalan','selesai','ditunda')` | Wajib (NOT NULL); Default: 'belum_mulai' |
| Field | `status_pengajuan` | `varchar(255)` | Wajib (NOT NULL); Default: 'draft' |
| Field | `tanggal_mulai` | `date` | Boleh NULL; Default: NULL |
| Field | `tanggal_selesai` | `date` | Boleh NULL; Default: NULL |
| Field | `keterangan` | `text` | Boleh NULL |
| Field | `kendala` | `text` | Boleh NULL |
| Field | `solusi` | `text` | Boleh NULL |
| Field | `saran` | `text` | Boleh NULL |
| Field | `status_evaluasi` | `varchar(255)` | Boleh NULL; Default: NULL; Nilai: `terlaksana`, `sebagian`, `tidak_terlaksana` |
| Field | `file_proker` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `proker_parameter`

> Menyimpan data terkait `proker parameter`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `proker_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `proker.id` |
| Field | `nama_parameter` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `bobot` | `smallint` | Wajib (NOT NULL); Default: '0' |
| Field | `capaian` | `smallint` | Boleh NULL; Default: NULL |
| Field | `urutan` | `smallint` | Wajib (NOT NULL); Default: '0' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `proker_pj`

> Menyimpan data penanggung jawab proker. Composite PK `(proker_id, user_id)` — tidak ada kolom `id` terpisah.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK, FK | `proker_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `proker.id` |
| PK, FK | `user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `kegiatan`

> Menyimpan data terkait `kegiatan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `proker_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `proker.id` |
| Field | `nama_kegiatan` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `deskripsi_kegiatan` | `text` | Boleh NULL |
| Field | `tipe_kegiatan` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `lokasi` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `link_meeting` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `tanggal_mulai` | `date` | Boleh NULL; Default: NULL |
| Field | `tanggal_selesai` | `date` | Boleh NULL; Default: NULL |
| Field | `status_approval` | `enum('diajukan','disetujui','ditolak')` | Wajib (NOT NULL); Default: 'diajukan' |
| FK | `approved_by` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `approved_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `kegiatan_peserta`

> Menyimpan data terkait `kegiatan peserta`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kegiatan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kegiatan.id` |
| FK | `user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `peran` | `enum('peserta','panitia')` | Wajib (NOT NULL); Default: 'peserta' |
| Field | `is_lulus` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| Field | `no_sertifikat` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `file_sertifikat` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `dokumentasi_kegiatan`

> Menyimpan data terkait `dokumentasi kegiatan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kegiatan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kegiatan.id` |
| Field | `judul` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `file_path` | `varchar(255)` | Wajib (NOT NULL) |
| FK | `uploaded_by` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `laporan_kegiatan`

> Menyimpan data terkait `laporan kegiatan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kegiatan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kegiatan.id` |
| Field | `jenis_laporan` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `periode_bulan` | `int` | Boleh NULL; Default: NULL |
| Field | `periode_tahun` | `int` | Boleh NULL; Default: NULL |
| Field | `deskripsi_capaian` | `text` | Wajib (NOT NULL) |
| Field | `file_lpj` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

## Modul: Piket

### Tabel: `periode_piket`

> Menyimpan data terkait `periode piket`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `nama` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `tanggal_mulai` | `date` | Wajib (NOT NULL) |
| Field | `tanggal_selesai` | `date` | Wajib (NOT NULL) |
| Field | `isactive` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| Field | `lama_piket` | `int` | Wajib (NOT NULL); Default: '120' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `jadwal_piket`

> Menyimpan data terkait `jadwal piket`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `hari` | `varchar(255)` | Wajib (NOT NULL) |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| FK | `kepengurusan_user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_user.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `absensi`

> Menyimpan data terkait `absensi`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `tanggal` | `date` | Wajib (NOT NULL) |
| Field | `jam_masuk` | `time` | Wajib (NOT NULL) |
| Field | `jam_keluar` | `time` | Boleh NULL; Default: NULL |
| Field | `foto_checkout` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `foto_checkin` | `varchar(255)` | Wajib (NOT NULL) |
| FK | `jadwal_piket_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `jadwal_piket.id` |
| Field | `kegiatan` | `text` | Wajib (NOT NULL) |
| Field | `is_manual` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| FK | `manual_input_by` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `verification_status` | `varchar(20)` | Wajib (NOT NULL); Default: 'approved' |
| FK | `verified_by` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `verified_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `verification_note` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `ganti_jadwal_piket`

> Menyimpan data terkait `ganti jadwal piket`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `jadwal_piket_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `jadwal_piket.id` |
| FK | `periode_piket_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `periode_piket.id` |
| FK | `kepengurusan_user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_user.id` |
| Field | `hari_lama` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `hari_baru` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `alasan` | `text` | Wajib (NOT NULL) |
| Field | `status` | `enum('pending','approved','rejected')` | Wajib (NOT NULL); Default: 'pending' |
| FK | `approved_by` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `users.id` |
| Field | `approved_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `catatan_admin` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `pengaturan_piket`

> Menyimpan konfigurasi piket per kepengurusan. PK adalah `kepengurusan_lab_id` — tidak ada kolom `id` terpisah.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK, FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `ada_denda` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| Field | `nominal_denda` | `decimal(12,2)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

## Modul: Surat Menyurat

### Tabel: `konfigurasi_surat`

> Menyimpan konfigurasi penomoran surat per kepengurusan. PK adalah `kepengurusan_lab_id` — tidak ada kolom `id` terpisah.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK, FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `inisial_lab` | `varchar(20)` | Wajib (NOT NULL); Default: 'LAB' |
| Field | `format_nomor` | `varchar(200)` | Wajib (NOT NULL); Default: '{nomor}/LAB.{inisial_lab}/{bulan_romawi}/{tahun}' |
| Field | `variabel_aktif` | `json` | Boleh NULL; Default: NULL |
| Field | `reset_tiap_tahun` | `tinyint(1)` | Wajib (NOT NULL); Default: '1' |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `surat_masuk`

> Menyimpan data terkait `surat masuk`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `nomor_agenda` | `int` | Wajib (NOT NULL) |
| Field | `nomor_surat_asal` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `asal_surat` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `perihal` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `tanggal_surat` | `date` | Wajib (NOT NULL) |
| Field | `tanggal_terima` | `date` | Wajib (NOT NULL) |
| Field | `isi_ringkas` | `text` | Boleh NULL |
| Field | `file_surat` | `varchar(255)` | Boleh NULL; Default: NULL |
| FK | `diterima_oleh` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `surat_keluar`

> Menyimpan data terkait `surat keluar`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kepengurusan_lab_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kepengurusan_lab.id` |
| Field | `nomor_urut` | `int` | Wajib (NOT NULL) |
| Field | `nomor_surat` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `perihal` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `tujuan` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `tanggal_surat` | `date` | Wajib (NOT NULL) |
| Field | `isi_ringkas` | `text` | Boleh NULL |
| Field | `file_surat` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `kode_klasifikasi` | `varchar(50)` | Boleh NULL; Default: NULL |
| FK | `dibuat_oleh` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `disposisi_surat`

> Menyimpan data terkait `disposisi surat`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `surat_masuk_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `surat_masuk.id` |
| FK | `dari_user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| FK | `kepada_user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `catatan` | `text` | Boleh NULL |
| Field | `status` | `enum('belum_dibaca','sudah_dibaca','selesai')` | Wajib (NOT NULL); Default: 'belum_dibaca' |
| Field | `dibaca_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `diselesaikan_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

## Modul: Sertifikat

### Tabel: `sertifikat`

> Menyimpan data terkait `sertifikat`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `nomor_sertifikat` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `jenis_sertifikat` | `enum('asisten','praktikan','kepengurusan')` | Wajib (NOT NULL) |
| FK | `user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| FK | `kepengurusan_lab_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `kepengurusan_lab.id` |
| FK | `praktikum_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `praktikum.id` |
| Field | `tanggal_terbit` | `date` | Wajib (NOT NULL) |
| Field | `file_path` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `created_at` | `timestamp` | Wajib (NOT NULL); Default: CURRENT_TIMESTAMP |

### Tabel: `sertifikat_templates`

> Menyimpan data terkait `sertifikat templates`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `nama` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `file_path` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `kategori` | `enum('kegiatan','praktikum','aslab','umum')` | Wajib (NOT NULL) |
| Field | `ref_id` | `char(36)` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

## Modul: Kuesioner

### Tabel: `kuesioner`

> Menyimpan data terkait `kuesioner`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| Field | `judul` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `deskripsi` | `text` | Boleh NULL |
| Field | `tipe` | `enum('internal','eksternal')` | Wajib (NOT NULL) |
| Field | `link_eksternal` | `varchar(255)` | Boleh NULL; Default: NULL |
| Field | `tanggal_mulai` | `datetime` | Boleh NULL; Default: NULL |
| Field | `tanggal_selesai` | `datetime` | Boleh NULL; Default: NULL |
| Field | `is_active` | `tinyint(1)` | Wajib (NOT NULL); Default: '1' |
| Field | `is_mandatory` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| FK | `dibuat_oleh` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `deleted_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `pertanyaan_kuesioner`

> Menyimpan data terkait `pertanyaan kuesioner`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kuesioner_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kuesioner.id` |
| Field | `pertanyaan` | `text` | Wajib (NOT NULL) |
| Field | `tipe_pertanyaan` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `wajib_diisi` | `tinyint(1)` | Wajib (NOT NULL); Default: '0' |
| Field | `urutan` | `int` | Wajib (NOT NULL) |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `opsi_pertanyaan`

> Menyimpan data terkait `opsi pertanyaan`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `pertanyaan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `pertanyaan_kuesioner.id` |
| Field | `teks` | `varchar(255)` | Wajib (NOT NULL) |
| Field | `urutan` | `int` | Boleh NULL; Default: NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `target_kuesioner`

> Menyimpan target role penerima kuesioner. Composite PK `(kuesioner_id, role_id)` — tidak ada kolom `id` terpisah.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK, FK | `kuesioner_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kuesioner.id` |
| PK, FK | `role_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `roles.id` |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `respon_kuesioner`

> Menyimpan data terkait `respon kuesioner`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `kuesioner_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `kuesioner.id` |
| FK | `user_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `users.id` |
| Field | `tanggal_submit` | `datetime` | Wajib (NOT NULL); Default: CURRENT_TIMESTAMP |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |

### Tabel: `jawaban_kuesioner`

> Menyimpan data terkait `jawaban kuesioner`.

| Jenis | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| PK | `id` | `char(36)` | Wajib (NOT NULL) |
| FK | `respon_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `respon_kuesioner.id` |
| FK | `pertanyaan_id` | `char(36)` | Wajib (NOT NULL); Relasi ke `pertanyaan_kuesioner.id` |
| FK | `opsi_id` | `char(36)` | Boleh NULL; Default: NULL; Relasi ke `opsi_pertanyaan.id` |
| Field | `jawaban` | `text` | Boleh NULL |
| Field | `created_at` | `timestamp` | Boleh NULL; Default: NULL |
| Field | `updated_at` | `timestamp` | Boleh NULL; Default: NULL |
