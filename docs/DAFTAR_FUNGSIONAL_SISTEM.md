# Daftar Fungsional Sistem SILAB (Detail Per Modul & Role)

> Dokumen ini menjabarkan seluruh fungsional sistem secara detail berdasarkan data **role_has_permissions** dan **struktur_permissions** yang ada di database. Setiap aksi dispesifikkan secara eksplisit per role.

---

## AKTOR SISTEM

| # | Aktor | Deskripsi |
|---|-------|-----------|
| 1 | **Superadmin** | Pengelola tertinggi, kontrol penuh semua modul & data master |
| 2 | **Kadep** | Kepala departemen — monitoring, view seluruh data, approve proker |
| 3 | **Admin** | Pengelola operasional laboratorium — CRUD sebagian besar modul |
| 4 | **Asisten** | Asisten laboratorium — operasional harian, modul & proker |
| 5 | **Kalab** | Kepala lab (jabatan/struktur) — approve kegiatan, kelola surat formal |
| 6 | **Dosen** | Dosen pembimbing — approve kegiatan & proker, view surat |
| 7 | **Praktikan** | Mahasiswa peserta praktikum — tugas, modul, sertifikat |

> **Catatan:** 5 role utama yang difokuskan adalah: **admin, asisten, kadep, dosen, dan praktikan**. Kalab adalah role jabatan struktural dengan permission tersendiri di database.

---

## MODUL 1: INVENTARIS (Manajemen Aset)

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar & detail seluruh aset | `inventaris.view` |
| 2 | Menambahkan aset baru | `inventaris.manage-items` |
| 3 | Mengedit data aset (kode, keadaan, status, foto) | `inventaris.manage-items` |
| 4 | Menghapus aset | `inventaris.manage-items` |
| 5 | Menambahkan kategori aset baru | `inventaris.manage-kategori` |
| 6 | Mengedit kategori aset | `inventaris.manage-kategori` |
| 7 | Menghapus kategori aset | `inventaris.manage-kategori` |
| 8 | Melihat daftar & detail permohonan pengadaan | `inventaris.manage-permohonan` |
| 9 | Menyetujui permohonan pengadaan | `inventaris.manage-permohonan` |
| 10 | Menolak permohonan pengadaan | `inventaris.manage-permohonan` |
| 11 | Menghapus permohonan pengadaan | `inventaris.manage-permohonan` |

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar & detail aset lab | `inventaris.view` |
| 2 | Mengajukan permohonan pengadaan aset | `inventaris.manage-permohonan` |
| 3 | Mengedit permohonan pengadaan milik sendiri | `inventaris.manage-permohonan` |
| 4 | Melihat status & riwayat permohonan sendiri | `inventaris.manage-permohonan` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar & detail aset (monitoring) | `inventaris.view` |

> **Dosen & Praktikan:** Tidak memiliki akses ke modul inventaris.

---

## MODUL 2: KEUANGAN

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar & rekap seluruh transaksi keuangan | `keuangan.view` |
| 2 | Mencatat transaksi pemasukan | `keuangan.create-transaksi` |
| 3 | Mencatat transaksi pengeluaran | `keuangan.create-transaksi` |
| 4 | Mengedit data transaksi | `keuangan.update-transaksi` |
| 5 | Menghapus transaksi | `keuangan.delete-transaksi` |
| 6 | Menambahkan nominal kas baru | `keuangan.create-transaksi` |
| 7 | Mengedit nominal kas | `keuangan.update-transaksi` |
| 8 | Menghapus nominal kas | `keuangan.delete-transaksi` |
| 9 | Mengaktifkan/menonaktifkan nominal kas | `keuangan.update-transaksi` |
| 10 | Melihat rekap keuangan bulanan | `keuangan.view` |

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat riwayat transaksi keuangan (read-only) | `keuangan.view` |
| 2 | Melihat rekap keuangan bulanan | `keuangan.view` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat riwayat seluruh transaksi keuangan | `keuangan.view` |
| 2 | Melihat rekap keuangan bulanan | `keuangan.view` |

> **Dosen & Praktikan:** Tidak memiliki akses ke modul keuangan.

---

## MODUL 3: PRAKTIKUM

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar semua praktikum | `praktikum.view` |
| 2 | Membuat praktikum baru | `praktikum.create` |
| 3 | Mengedit data praktikum | `praktikum.update` |
| 4 | Menghapus praktikum | `praktikum.delete` |
| 5 | Mengunggah modul/materi praktikum per pertemuan | `modul.create-modul` |
| 6 | Mengedit modul/materi praktikum | `modul.update-modul` |
| 7 | Menghapus modul/materi praktikum | `modul.delete-modul` |
| 8 | Mengaktifkan/menonaktifkan share link modul (publik) | `modul.publish` |
| 9 | Melihat daftar modul praktikum | `modul.view` |
| 10 | Mengimpor data praktikan dari Excel | `praktikan.import` |
| 11 | Menambahkan praktikan secara manual | `praktikan.create` |
| 12 | Mengedit data praktikan | `praktikan.update` |
| 13 | Menghapus praktikan | `praktikan.delete` |
| 14 | Melihat daftar praktikan | `praktikan.view` |
| 15 | Membuat jadwal pertemuan praktikum | `praktikum.pertemuan.create` |
| 16 | Mengedit jadwal pertemuan | `praktikum.pertemuan.update` |
| 17 | Menghapus pertemuan | `praktikum.pertemuan.delete` |
| 18 | Melihat daftar pertemuan | `praktikum.pertemuan.view` |
| 19 | Menginput absensi praktikan & aslab per pertemuan | `praktikum.pertemuan.create` |
| 20 | Membuat tugas praktikum | `tugas.create` |
| 21 | Mengedit tugas praktikum | `tugas.update` |
| 22 | Menghapus tugas praktikum | `tugas.delete` |
| 23 | Melihat daftar pengumpulan tugas & file submission | `tugas.view` |
| 24 | Memberikan nilai / grading tugas | `tugas.grade` |
| 25 | Membuat komponen rubrik penilaian | `rubrik.create` |
| 26 | Mengedit komponen rubrik | `rubrik.update` |
| 27 | Menghapus komponen rubrik | `rubrik.delete` |
| 28 | Memberikan nilai per komponen rubrik | `rubrik.grade` |
| 29 | Melihat rubrik penilaian | `rubrik.view` |
| 30 | Mengunggah template sertifikat praktikum | `praktikum.sertifikat.create` |
| 31 | Men-generate sertifikat praktikum | `praktikum.sertifikat.generate` |
| 32 | Melihat halaman sertifikat praktikum | `praktikum.sertifikat.view` |

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar praktikum yang diikuti | `praktikum.view` |
| 2 | Melihat daftar pertemuan | `praktikum.pertemuan.view` |
| 3 | Membuat pertemuan praktikum | `praktikum.pertemuan.create` |
| 4 | Mengedit pertemuan praktikum | `praktikum.pertemuan.update` |
| 5 | Menghapus pertemuan | `praktikum.pertemuan.delete` |
| 6 | Menginput absensi praktikan & aslab | `praktikum.pertemuan.create` |
| 7 | Mengunggah modul/materi praktikum | `modul.create-modul` |
| 8 | Mengedit modul/materi | `modul.update-modul` |
| 9 | Menghapus modul/materi | `modul.delete-modul` |
| 10 | Mengaktifkan/menonaktifkan share link modul | `modul.publish` |
| 11 | Melihat daftar modul | `modul.view` |
| 12 | Melihat daftar praktikan | `praktikan.view` |
| 13 | Membuat tugas praktikum | `tugas.create` |
| 14 | Melihat daftar & file pengumpulan tugas | `tugas.view` |
| 15 | Melihat rubrik penilaian | `rubrik.view` |
| 16 | Men-generate sertifikat praktikum | `praktikum.sertifikat.generate` |
| 17 | Melihat halaman sertifikat praktikum | `praktikum.sertifikat.view` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar praktikum | `praktikum.view` |
| 2 | Melihat daftar pertemuan | `praktikum.pertemuan.view` |
| 3 | Melihat daftar modul | `modul.view` |
| 4 | Melihat daftar praktikan | `praktikan.view` |
| 5 | Melihat daftar tugas | `tugas.view` |
| 6 | Melihat rubrik penilaian | `rubrik.view` |
| 7 | Melihat halaman sertifikat praktikum | `praktikum.sertifikat.view` |

### Praktikan
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar tugas aktif & riwayat tugas | `tugas.view` |
| 2 | Mengumpulkan/mengunggah file jawaban tugas | `tugas.submit` |
| 3 | Melihat daftar modul/materi praktikum | `modul.view` |
| 4 | Mengunduh modul yang dipublikasikan | `modul.view` |
| 5 | Melihat informasi pertemuan | `praktikum.pertemuan.view` |
| 6 | Melihat sertifikat yang dimiliki | `praktikum.sertifikat.view` |

> **Dosen:** Tidak memiliki akses langsung ke modul praktikum.

---

## MODUL 4: KEGIATAN & PROGRAM KERJA

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar semua proker | `proker.view` |
| 2 | Membuat proker baru | `proker.create` |
| 3 | Mengedit data proker | `proker.update` |
| 4 | Menghapus proker | `proker.delete` |
| 5 | Menyetujui/menolak pengajuan proker | `proker.approve` |
| 6 | Mengubah status proker (belum mulai/berjalan/selesai/ditunda) | `proker.update-progress` |
| 7 | Mengisi evaluasi keterlaksanaan proker (terlaksana/sebagian/tidak) | `proker.update-progress` |
| 8 | Mengunggah/menghapus dokumentasi proker (multi-file) | `proker.update-progress` |
| 9 | Mengupdate capaian parameter proker | `proker.update-progress` |

> **Catatan:** Admin tidak memiliki permission `kegiatan.*` sehingga tidak bisa membuat/mengelola kegiatan mandiri.

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar proker | `proker.view` |
| 2 | Membuat proker (untuk koordinator/jabatan ketua divisi) | `proker.create` |
| 3 | Mengedit data proker divisinya | `proker.update` |
| 4 | Menghapus proker | `proker.delete` |
| 5 | Mengubah status & evaluasi proker yang sudah disetujui | `proker.update-progress` |
| 6 | Mengunggah dokumentasi proker | `proker.update-progress` |
| 7 | Melihat daftar kegiatan | `kegiatan.view` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar proker | `proker.view` |
| 2 | Membuat proker baru | `proker.create` |
| 3 | Mengedit data proker | `proker.update` |
| 4 | Menghapus proker | `proker.delete` |
| 5 | Menyetujui/menolak pengajuan proker | `proker.approve` |
| 6 | Mengubah status & evaluasi proker | `proker.update-progress` |

### Dosen
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar proker | `proker.view` |
| 2 | Menyetujui/menolak pengajuan proker | `proker.approve` |
| 3 | Melihat daftar kegiatan | `kegiatan.view` |
| 4 | Menyetujui/menolak pengajuan kegiatan | `kegiatan.approve` |

### Kalab (jabatan struktural)
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar proker | `proker.view` |
| 2 | Menyetujui/menolak pengajuan proker | `proker.approve` |
| 3 | Melihat daftar kegiatan | `kegiatan.view` |
| 4 | Menyetujui/menolak pengajuan kegiatan | `kegiatan.approve` |

> **Praktikan:** Tidak memiliki akses ke modul proker & kegiatan.

---

## MODUL 5: PIKET

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Membuat periode piket baru | `piket.manage-periode` |
| 2 | Mengedit periode piket | `piket.manage-periode` |
| 3 | Menghapus periode piket | `piket.manage-periode` |
| 4 | Membuat jadwal piket (assign asisten ke hari) | `piket.manage-jadwal` |
| 5 | Mengedit jadwal piket | `piket.manage-jadwal` |
| 6 | Menghapus jadwal piket | `piket.manage-jadwal` |
| 7 | Melihat daftar & detail jadwal piket | `piket.view` + `piket.view-jadwal` |
| 8 | Mengajukan request ganti jadwal piket sendiri | `piket.request-ganti-jadwal` |
| 9 | Melihat rekap & riwayat absensi piket | `absensi.view` |
| 10 | Melakukan check-in piket | `absensi.create` |
| 11 | Melakukan check-out / update absensi piket | `absensi.update` |
| 12 | Menginput absensi piket secara manual (untuk asisten lain) | `absensi.manual.create` |
| 13 | Mengedit absensi manual yang sudah diinput | `absensi.manual.update` |

> **Catatan:** Hanya **superadmin** yang dapat menyetujui/menolak request ganti jadwal (`piket.approve-ganti-jadwal`) dan memverifikasi absensi (`absensi.verify`). Kalab bisa via posisi struktural jika dikonfigurasi.

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat jadwal piket | `piket.view` + `piket.view-jadwal` |
| 2 | Mengajukan request ganti jadwal piket | `piket.request-ganti-jadwal` |
| 3 | Melakukan check-in piket | `absensi.create` |
| 4 | Melihat riwayat absensi piket sendiri | `absensi.view` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat jadwal piket (monitoring) | `piket.view` + `piket.view-jadwal` |
| 2 | Melihat rekap absensi piket | `absensi.view` |

### Praktikan
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat jadwal piket lab | `piket.view` + `piket.view-jadwal` |

> **Dosen:** Tidak memiliki akses ke modul piket.

---

## MODUL 6: SURAT MENYURAT

> Modul ini terdiri dari dua sub-sistem: **Agenda Surat Resmi** (`surat-masuk`, `surat-keluar`) dan **Disposisi** (`disposisi`).

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar & detail surat masuk | `surat-masuk.viewAny` + `surat-masuk.view` |
| 2 | Mencatat surat masuk baru | `surat-masuk.create` |
| 3 | Mengedit data surat masuk | `surat-masuk.edit` |
| 4 | Menghapus surat masuk | `surat-masuk.delete` |
| 5 | Mengekspor daftar surat masuk ke Excel | `surat-masuk.export` |
| 6 | Melihat daftar & detail surat keluar | `surat-keluar.viewAny` + `surat-keluar.view` |
| 7 | Mencatat surat keluar baru | `surat-keluar.create` |
| 8 | Mengedit data surat keluar | `surat-keluar.edit` |
| 9 | Menghapus surat keluar | `surat-keluar.delete` |
| 10 | Mengekspor daftar surat keluar ke Excel | `surat-keluar.export` |
| 11 | Membuat disposisi surat | `disposisi.create` |
| 12 | Mengupdate status disposisi | `disposisi.update-status` |
| 13 | Melihat daftar disposisi | `disposisi.view` |
| 14 | Mengatur konfigurasi format penomoran surat | `konfigurasi-surat.edit` |
| 15 | Melihat konfigurasi surat | `konfigurasi-surat.view` |

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar & detail surat masuk | `surat-masuk.viewAny` + `surat-masuk.view` |
| 2 | Melihat daftar & detail surat keluar | `surat-keluar.viewAny` + `surat-keluar.view` |
| 3 | Mengupdate status disposisi yang ditujukan ke dirinya | `disposisi.update-status` |
| 4 | Melihat daftar disposisi | `disposisi.view` |
| 5 | Melihat konfigurasi surat | `konfigurasi-surat.view` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar & detail surat masuk | `surat-masuk.viewAny` + `surat-masuk.view` |
| 2 | Melihat daftar & detail surat keluar | `surat-keluar.viewAny` + `surat-keluar.view` |
| 3 | Melihat daftar disposisi | `disposisi.view` |
| 4 | Melihat konfigurasi surat | `konfigurasi-surat.view` |

### Dosen
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar & detail surat masuk | `surat-masuk.viewAny` + `surat-masuk.view` |
| 2 | Melihat daftar & detail surat keluar | `surat-keluar.viewAny` + `surat-keluar.view` |
| 3 | Melihat daftar disposisi | `disposisi.view` |
| 4 | Melihat konfigurasi surat | `konfigurasi-surat.view` |

### Kalab (jabatan struktural)
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Semua aksi CRUD surat masuk | `surat-masuk.*` |
| 2 | Semua aksi CRUD surat keluar | `surat-keluar.*` |
| 3 | Membuat & mengelola disposisi | `disposisi.*` |
| 4 | Mengatur konfigurasi penomoran surat | `konfigurasi-surat.edit` |

> **Praktikan:** Tidak memiliki akses ke modul surat menyurat.

---

## MODUL 7: KEPENGURUSAN & DATA MASTER

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar kepengurusan & anggota aktif | `kepengurusan.view` |
| 2 | Menambahkan anggota kepengurusan baru | `kepengurusan.manage-anggota` |
| 3 | Mengedit jabatan/struktur anggota | `kepengurusan.manage-anggota` |
| 4 | Menghapus anggota dari kepengurusan | `kepengurusan.manage-anggota` |
| 5 | Mentransfer anggota dari periode kepengurusan sebelumnya | `kepengurusan.transfer-anggota` |
| 6 | Melihat daftar struktur/jabatan | `kepengurusan.manage-struktur` |
| 7 | Membuat jabatan struktur baru | `kepengurusan.manage-struktur` |
| 8 | Mengedit jabatan struktur | `kepengurusan.manage-struktur` |
| 9 | Menghapus jabatan struktur | `kepengurusan.manage-struktur` |
| 10 | Mengatur permission per jabatan/struktur | `kepengurusan.manage-struktur` |
| 11 | Melihat daftar user sistem | `user-management.view` |

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar kepengurusan & anggota aktif | `kepengurusan.view` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar kepengurusan & anggota aktif | `kepengurusan.view` |
| 2 | Melihat daftar user sistem | `user-management.view` |

### Superadmin (Eksklusif)
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Menambahkan user baru ke sistem | `user-management.create` |
| 2 | Mengedit data user | `user-management.update` |
| 3 | Menghapus user | `user-management.delete` |
| 4 | Mengatur permission per role | `user-management.manage-permissions` |
| 5 | Mengatur role yang dimiliki user | `user-management.manage-roles` |
| 6 | Mengelola tahun kepengurusan & kepengurusan lab | (superadmin bypass) |

> **Dosen & Praktikan:** Tidak memiliki akses ke modul kepengurusan.

---

## MODUL 8: SERTIFIKAT

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar semua sertifikat | `sertifikat.view` |
| 2 | Mengunggah template sertifikat | `sertifikat.create` |
| 3 | Men-generate sertifikat (praktikan/aslab/kegiatan) | `sertifikat.generate` |
| 4 | Mengedit data sertifikat | `sertifikat.update` |
| 5 | Menghapus sertifikat | `sertifikat.delete` |
| 6 | Mengunggah template sertifikat praktikum | `praktikum.sertifikat.create` |
| 7 | Men-generate sertifikat praktikum per penerima | `praktikum.sertifikat.generate` |
| 8 | Melihat halaman sertifikat praktikum | `praktikum.sertifikat.view` |

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar sertifikat yang dimiliki | `sertifikat.view` |
| 2 | Men-generate sertifikat praktikum (aslab) | `praktikum.sertifikat.generate` |
| 3 | Melihat halaman sertifikat praktikum | `praktikum.sertifikat.view` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar sertifikat | `sertifikat.view` |
| 2 | Melihat halaman sertifikat praktikum | `praktikum.sertifikat.view` |

### Praktikan
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar sertifikat yang dimiliki | `sertifikat.view` |
| 2 | Mengunduh file sertifikat | `sertifikat.view` |
| 3 | Melihat informasi sertifikat praktikum | `praktikum.sertifikat.view` |

> **Dosen:** Tidak memiliki akses ke modul sertifikat.

---

## MODUL 9: KUESIONER / SURVEY

### Admin
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat daftar semua kuesioner | `survey.view` |
| 2 | Membuat kuesioner baru (internal/eksternal) | `survey.create` |
| 3 | Mengedit kuesioner (judul, pertanyaan, target, periode) | `survey.edit` |
| 4 | Menghapus kuesioner beserta semua respon | `survey.delete` |
| 5 | Melihat hasil & statistik respon kuesioner | `survey.view_results` |
| 6 | Mengisi kuesioner sebagai responden | `survey.participate` |

### Asisten
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat kuesioner yang ditargetkan ke role asisten | `survey.participate` |
| 2 | Mengisi kuesioner internal yang aktif | `survey.participate` |
| 3 | Mengakses link kuesioner eksternal | `survey.participate` |

### Kadep
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat kuesioner yang ditargetkan ke role kadep | `survey.participate` |
| 2 | Mengisi kuesioner internal yang aktif | `survey.participate` |

### Dosen
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat kuesioner yang ditargetkan ke role dosen | `survey.participate` |
| 2 | Mengisi kuesioner internal yang aktif | `survey.participate` |

### Praktikan
| # | Fungsional | Permission |
|---|-----------|------------|
| 1 | Melihat kuesioner yang ditargetkan ke role praktikan | `survey.participate` |
| 2 | Mengisi kuesioner internal yang aktif | `survey.participate` |

> **Catatan:** Kuesioner hanya bisa diisi jika: (1) status aktif, (2) dalam periode tanggal, (3) role user sesuai target kuesioner.

---

## FUNGSIONAL UMUM (Semua User yang Login)

| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat dashboard | Halaman utama setelah login |
| 2 | Melihat profil akun sendiri | Data diri, nomor induk, foto |
| 3 | Mengedit profil (nama, email, foto, tanda tangan) | Update data pribadi |
| 4 | Mengubah password | Ganti password akun |
| 5 | Menghapus akun sendiri | Self-delete akun |
| 6 | Melihat informasi laboratorium | Halaman about/info lab |

---

## RINGKASAN PERMISSION PER ROLE

| Permission | admin | asisten | kadep | dosen | praktikan | kalab | superadmin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **INVENTARIS** | | | | | | | |
| `inventaris.view` | ✓ | ✓ | ✓ | — | — | — | ✓ |
| `inventaris.manage-items` | ✓ | — | — | — | — | — | ✓ |
| `inventaris.manage-kategori` | ✓ | — | — | — | — | — | ✓ |
| `inventaris.manage-permohonan` | ✓ | ✓ | — | — | — | — | ✓ |
| `inventaris.approve-permohonan` | — | — | — | — | — | — | ✓ |
| **KEUANGAN** | | | | | | | |
| `keuangan.view` | ✓ | ✓ | ✓ | — | — | — | ✓ |
| `keuangan.create-transaksi` | ✓ | — | — | — | — | — | ✓ |
| `keuangan.update-transaksi` | ✓ | — | — | — | — | — | ✓ |
| `keuangan.delete-transaksi` | ✓ | — | — | — | — | — | ✓ |
| **PRAKTIKUM** | | | | | | | |
| `praktikum.view` | ✓ | ✓ | ✓ | — | — | — | ✓ |
| `praktikum.create/update/delete` | ✓ | — | — | — | — | — | ✓ |
| `praktikum.pertemuan.*` | ✓ | ✓(CRUD) | view | — | view | — | ✓ |
| `praktikum.sertifikat.*` | ✓ | gen+view | view | — | view | — | ✓ |
| `modul.*` | ✓(CRUD) | ✓(CRUD) | view | — | view | — | ✓ |
| `praktikan.*` | ✓(CRUD) | view | view | — | — | — | ✓ |
| `tugas.*` | ✓(CRUD+grade) | create+view | view | — | submit+view | — | ✓ |
| `rubrik.*` | ✓(CRUD+grade) | view | view | — | — | — | ✓ |
| **PROKER & KEGIATAN** | | | | | | | |
| `proker.view` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `proker.create/update/delete` | ✓ | ✓ | ✓ | — | — | — | ✓ |
| `proker.approve` | ✓ | — | ✓ | ✓ | — | ✓ | ✓ |
| `proker.update-progress` | ✓ | ✓ | ✓ | — | — | — | ✓ |
| `kegiatan.view` | — | ✓ | — | ✓ | — | ✓ | ✓ |
| `kegiatan.create/edit/delete` | — | — | — | — | — | — | ✓ |
| `kegiatan.approve` | — | — | — | ✓ | — | ✓ | ✓ |
| **PIKET** | | | | | | | |
| `piket.view` + `piket.view-jadwal` | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| `piket.manage-jadwal` | ✓ | — | — | — | — | — | ✓ |
| `piket.manage-periode` | ✓ | — | — | — | — | — | ✓ |
| `piket.request-ganti-jadwal` | ✓ | ✓ | — | — | — | — | ✓ |
| `piket.approve-ganti-jadwal` | — | — | — | — | — | posisi | ✓ |
| `absensi.view` | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| `absensi.create` + `absensi.update` | ✓ | ✓(create) | — | — | — | — | ✓ |
| `absensi.manual.create/update` | ✓ | — | — | — | — | — | ✓ |
| `absensi.manual.delete` + `absensi.verify` | — | — | — | — | — | posisi | ✓ |
| **SURAT MENYURAT** | | | | | | | |
| `surat-masuk.viewAny` + `surat-masuk.view` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `surat-masuk.create/edit/delete/export` | ✓ | — | — | — | — | ✓ | ✓ |
| `surat-keluar.viewAny` + `surat-keluar.view` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `surat-keluar.create/edit/delete/export` | ✓ | — | — | — | — | ✓ | ✓ |
| `disposisi.view` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `disposisi.create` + `disposisi.update-status` | ✓ | update-status | — | — | — | ✓ | ✓ |
| `konfigurasi-surat.view` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `konfigurasi-surat.edit` | ✓ | — | — | — | — | ✓ | ✓ |
| **KEPENGURUSAN** | | | | | | | |
| `kepengurusan.view` | ✓ | ✓ | ✓ | — | — | — | ✓ |
| `kepengurusan.manage-anggota` | ✓ | — | — | — | — | — | ✓ |
| `kepengurusan.manage-struktur` | ✓ | — | — | — | — | — | ✓ |
| `kepengurusan.transfer-anggota` | ✓ | — | — | — | — | — | ✓ |
| `user-management.view` | ✓ | — | ✓ | — | — | — | ✓ |
| `user-management.create/update/delete/manage-*` | — | — | — | — | — | — | ✓ |
| **SERTIFIKAT** | | | | | | | |
| `sertifikat.view` | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| `sertifikat.create/generate/update/delete` | ✓ | — | — | — | — | — | ✓ |
| `praktikum.sertifikat.view` | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| `praktikum.sertifikat.generate` | ✓ | ✓ | — | — | — | — | ✓ |
| `praktikum.sertifikat.create` | ✓ | — | — | — | — | — | ✓ |
| **KUESIONER** | | | | | | | |
| `survey.view` | ✓ | — | — | — | — | — | ✓ |
| `survey.create` + `survey.edit` + `survey.delete` | ✓ | — | — | — | — | — | ✓ |
| `survey.view_results` | ✓ | — | — | — | — | — | ✓ |
| `survey.participate` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## RINGKASAN STATISTIK

| Kategori | Jumlah |
|:---------|:------:|
| **Total Modul** | 9 |
| **Total Role** | 7 (admin, asisten, kadep, dosen, praktikan, kalab, superadmin) |
| **Role Utama (TA)** | 5 (admin, asisten, kadep, dosen, praktikan) |
| **Total Permission di DB** | 114 |

---

**Last Updated:** 2026-04-25
**Sumber:** Data `role_has_permissions` dan `struktur_permissions` dari database produksi (`silabdbnow.sql`) + analisis Policies Laravel
