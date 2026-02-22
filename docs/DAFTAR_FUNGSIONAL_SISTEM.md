# Daftar Fungsional Sistem SILAB (Detail Per Modul & Role)

> Dokumen ini menjabarkan seluruh fungsional sistem secara detail, tanpa generalisasi "mengelola". Setiap aksi dispesifikkan secara eksplisit.

---

## AKTOR SISTEM

| # | Aktor | Deskripsi |
|---|-------|-----------|
| 1 | **Superadmin** | Pengelola tertinggi, kontrol penuh sistem & data master |
| 2 | **Kadep** | Kepala departemen, monitoring & approval |
| 3 | **Admin** | Pengelola operasional laboratorium |
| 4 | **Asisten** | Asisten laboratorium, operasional harian |
| 5 | **Praktikan** | Mahasiswa peserta praktikum |
| 6 | **Dosen** | Pembimbing/dosen penanggung jawab |

---

## MODUL 1: INVENTARIS (Manajemen Aset)

### Admin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar seluruh aset | Menampilkan aset berdasarkan lab aktif, filter kategori & search |
| 2 | Menambahkan aset baru | Input kode barang, keadaan (baik/rusak), status (tersedia/dipinjam), foto |
| 3 | Mengedit data aset | Mengubah kode barang, keadaan, status, foto |
| 4 | Menghapus aset | Menghapus data aset beserta file foto dari storage |
| 5 | Menambahkan kategori aset baru | Membuat kategori seperti "Alat Lab", "Bahan Kimia" |
| 6 | Mengedit kategori aset | Mengubah nama kategori |
| 7 | Menghapus kategori aset | Menghapus kategori (jika tidak ada aset terkait) |
| 8 | Melihat daftar permohonan pengadaan | Lihat semua permohonan masuk & riwayat |
| 9 | Melihat detail permohonan pengadaan | Lihat alasan, daftar barang yang diminta (wishlist) |
| 10 | Menyetujui permohonan pengadaan | Approve permohonan dengan catatan |
| 11 | Menolak permohonan pengadaan | Reject permohonan dengan alasan penolakan |
| 12 | Menghapus permohonan pengadaan | Hapus permohonan dari sistem |

### Asisten
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar aset | Lihat aset lab yang tersedia |
| 2 | Mengajukan permohonan pengadaan aset | Input alasan pengadaan & daftar barang yang diminta (wishlist) |
| 3 | Mengedit permohonan pengadaan sendiri | Update permohonan sebelum diproses |
| 4 | Melihat riwayat permohonan sendiri | Cek status permohonan (pending/approved/rejected) |

### Kadep
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar aset | Monitoring stok dan kondisi aset |

---

## MODUL 2: KEUANGAN

### Admin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat riwayat seluruh transaksi | Daftar pemasukan & pengeluaran |
| 2 | Melihat detail transaksi | Bukti transfer, keterangan lengkap |
| 3 | Mencatat transaksi pemasukan | Input sumber, nominal, metode pembayaran |
| 4 | Mencatat transaksi pengeluaran | Input tujuan, nominal, bukti |
| 5 | Mengedit data transaksi | Koreksi data transaksi yang salah |
| 6 | Menghapus transaksi | Hapus transaksi (hanya kepengurusan aktif) |
| 7 | Menambahkan nominal kas | Set nominal kas baru |
| 8 | Mengedit nominal kas | Update nominal yang ada |
| 9 | Menghapus nominal kas | Hapus nominal |
| 10 | Mengaktifkan/menonaktifkan nominal kas | Toggle status aktif nominal |
| 11 | Melihat rekap keuangan bulanan | Dashboard total pemasukan, pengeluaran, saldo |
| 12 | Melihat catatan kas | Catatan ringkas per periode |

### Kadep
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat riwayat semua transaksi | Monitoring keuangan lab |
| 2 | Melihat rekap keuangan bulanan | Dashboard rekap per bulan |
| 3 | Mengekspor laporan keuangan ke Excel | Download file .xlsx |

### Superadmin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Mencatat transaksi pemasukan | Sama seperti Admin |
| 2 | Mencatat transaksi pengeluaran | Sama seperti Admin |
| 3 | Mengedit data transaksi | Sama seperti Admin |
| 4 | Menghapus transaksi | Sama seperti Admin |
| 5 | Menambahkan/mengedit/menghapus nominal kas | Sama seperti Admin |

---

## MODUL 3: PRAKTIKUM

### Admin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar semua praktikum | List praktikum di lab aktif |
| 2 | Membuat praktikum baru | Input nama, semester, SKS, dosen |
| 3 | Mengedit data praktikum | Update informasi praktikum |
| 4 | Menghapus praktikum | Cascade delete semua data terkait |
| 5 | Mengunggah modul/materi praktikum | Upload file PDF/Word/ZIP per pertemuan |
| 6 | Mengedit modul/materi praktikum | Ubah judul, file, pertemuan |
| 7 | Menghapus modul/materi praktikum | Hapus file modul |
| 8 | Mengaktifkan/menonaktifkan share link modul | Toggle bisa diakses publik atau tidak |
| 9 | Mengimpor data praktikan dari Excel | Bulk upload mahasiswa dari file .xlsx |
| 10 | Menambahkan praktikan secara manual | Input nama, NIM, email satu-satu |
| 11 | Menambahkan praktikan dari user yang sudah ada | Pilih dari database user |
| 12 | Mengedit data praktikan | Update nama/NIM/email |
| 13 | Mengubah status praktikan | Aktif/nonaktif |
| 14 | Menghapus praktikan dari praktikum | Keluarkan mahasiswa dari daftar |
| 15 | Meng-assign praktikan ke kelas | Masukkan ke kelas tertentu |
| 16 | Menghapus praktikan dari kelas | Keluarkan dari kelas |
| 17 | Menambahkan asisten lab (aslab) | Assign user ke praktikum sebagai aslab |
| 18 | Menghapus asisten lab | Hapus aslab dari praktikum |
| 19 | Membuat jadwal pertemuan baru | Input pertemuan ke-N, tanggal, topik |
| 20 | Mengedit jadwal pertemuan | Update data pertemuan |
| 21 | Menghapus pertemuan | Hapus beserta absensi terkait |
| 22 | Menginput absensi praktikan | Set status Hadir/Izin/Sakit/Alpha per praktikan |
| 23 | Menginput absensi aslab | Set status kehadiran aslab |
| 24 | Mengekspor absensi praktikan ke Excel | Download rekap per kelas |
| 25 | Mengekspor absensi aslab ke Excel | Download rekap kehadiran aslab |
| 26 | Membuat tugas praktikum | Input judul, deskripsi, deadline, file |
| 27 | Mengedit tugas praktikum | Update data tugas |
| 28 | Menghapus tugas praktikum | Hapus tugas beserta pengumpulan |
| 29 | Mengunduh file tugas | Download file soal/attachment |
| 30 | Melihat file tugas | Preview di browser |
| 31 | Melihat daftar pengumpulan tugas | List semua submission per tugas |
| 32 | Memberikan nilai secara manual | Input angka nilai langsung |
| 33 | Memberikan nilai dengan rubrik | Input per komponen rubrik, auto-calculate |
| 34 | Memberikan nilai dengan matrix rubrik | Bulk grading per kelas |
| 35 | Menolak pengumpulan tugas | Reject submission agar mahasiswa mengulang |
| 36 | Mengunduh file pengumpulan tugas | Download file submission praktikan |
| 37 | Mengekspor nilai ke Excel | Download nilai per tugas |
| 38 | Mengekspor semua nilai praktikum ke Excel | Download semua nilai semua tugas |
| 39 | Mengunduh template nilai Excel | Download template untuk import |
| 40 | Mengimpor nilai dari Excel | Bulk input nilai dari file .xlsx |
| 41 | Membuat komponen rubrik penilaian | Definisikan nama & bobot komponen |
| 42 | Mengedit komponen rubrik | Update nama/bobot |
| 43 | Menghapus komponen rubrik | Hapus komponen |
| 44 | Mengubah urutan komponen rubrik | Drag-and-drop reorder |
| 45 | Menambahkan nilai tambahan | Input bonus/penalti nilai |
| 46 | Mengedit nilai tambahan | Update nilai tambahan |
| 47 | Menghapus nilai tambahan | Hapus nilai tambahan |
| 48 | Mengunggah template sertifikat | Upload file .docx template |
| 49 | Men-generate sertifikat praktikum | Proses template per penerima |
| 50 | Melihat halaman sertifikat praktikum | Dashboard sertifikat |
| 51 | Mengunduh modul/materi | Download materi praktikum |

### Asisten (Aslab)
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Mengunduh modul/materi | Download materi |
| 2 | Menginput absensi praktikan | Mengisi kehadiran |
| 3 | Menginput absensi aslab | Mengisi kehadiran aslab |
| 4 | Membuat tugas praktikum | Membuat tugas |
| 5 | Memberikan nilai secara manual | Input nilai langsung |
| 6 | Memberikan nilai dengan rubrik | Input per komponen |

### Praktikan
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar tugas aktif | Tugas yang belum dikumpulkan |
| 2 | Melihat tugas per praktikum | Tugas spesifik ke praktikum |
| 3 | Melihat riwayat tugas | Tugas yang sudah dikumpulkan + nilai |
| 4 | Mengunggah file pengumpulan tugas | Submit jawaban tugas |
| 5 | Membatalkan pengumpulan tugas | Cancel submission sebelum dinilai |
| 6 | Mengunduh modul/materi | Download materi |
| 7 | Melihat daftar modul | Lihat semua modul praktikum |
| 8 | Mengunduh template pengumpulan | Download template jawaban |

---

## MODUL 4: KEGIATAN & PROGRAM KERJA

### Admin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar semua kegiatan | List kegiatan lab |
| 2 | Membuat kegiatan baru | Input nama, tanggal, tempat, proker terkait |
| 3 | Mengedit data kegiatan | Update informasi kegiatan |
| 4 | Menghapus kegiatan | Hapus kegiatan beserta data terkait |
| 5 | Menyetujui kegiatan | Approve pengajuan kegiatan |
| 6 | Mengunggah LPJ kegiatan | Upload file laporan pertanggungjawaban |
| 7 | Menghapus LPJ kegiatan | Hapus file LPJ |
| 8 | Mengunduh LPJ kegiatan | Download file LPJ |
| 9 | Menambahkan peserta kegiatan | Input peserta/panitia |
| 10 | Menghapus peserta kegiatan | Keluarkan peserta dari daftar |
| 11 | Mengunggah template sertifikat kegiatan | Upload .docx template (peserta / panitia) |
| 12 | Men-generate sertifikat kegiatan | Proses template per penerima |
| 13 | Melihat kalender kegiatan | View kalender per bulan |
| 14 | Membuat program kerja baru | Input nama, deskripsi, divisi |
| 15 | Mengedit program kerja | Update data proker |
| 16 | Menghapus program kerja | Hapus proker |
| 17 | Mengunggah file proker | Upload dokumen pendukung |
| 18 | Mengubah status proker | Update: Belum Mulai / Berjalan / Selesai |
| 19 | Melihat daftar proker | List semua program kerja |

### Asisten
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Membuat kegiatan baru | Mengajukan kegiatan |
| 2 | Mengedit kegiatan | Update kegiatan sendiri |
| 3 | Mengunggah LPJ kegiatan | Upload laporan |
| 4 | Menambahkan peserta | Input peserta kegiatan |
| 5 | Melihat kalender kegiatan | View kalender |
| 6 | Melihat daftar proker | List proker lab |

### Dosen / Kadep
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Menyetujui kegiatan | Approve pengajuan |
| 2 | Menolak kegiatan | Reject pengajuan |
| 3 | Melihat kalender kegiatan | View kalender |
| 4 | Melihat daftar proker | Monitoring proker |

---

## MODUL 5: PIKET

### Admin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Membuat periode piket baru | Set nama, tanggal mulai & selesai |
| 2 | Mengedit periode piket | Update data periode |
| 3 | Menghapus periode piket | Hapus periode |
| 4 | Membuat jadwal piket | Assign asisten ke slot hari & jam |
| 5 | Mengedit jadwal piket | Update jadwal |
| 6 | Menghapus jadwal piket | Hapus jadwal |
| 7 | Melihat daftar jadwal piket | Lihat semua jadwal |
| 8 | Melihat detail jadwal piket | Lihat jadwal per hari |
| 9 | Mengajukan request ganti jadwal | Minta tukar jadwal |
| 10 | Menyetujui/menolak request ganti jadwal | Approve/reject di dashboard admin |
| 11 | Melihat dashboard request ganti jadwal | Kelola semua request masuk |
| 12 | Menginput absensi piket | Catat check-in/check-out |
| 13 | Melihat rekap absensi piket | Dashboard kehadiran per asisten |
| 14 | Melihat riwayat absensi piket | History lengkap |

### Asisten
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat jadwal piket | Lihat jadwal sendiri |
| 2 | Mengajukan request ganti jadwal | Minta tukar shift |
| 3 | Menginput absensi piket | Check-in / check-out |
| 4 | Melihat absensi piket | Lihat riwayat kehadiran sendiri |

### Kadep
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat jadwal piket | Monitoring jadwal |
| 2 | Melihat rekap absensi piket | Monitoring kehadiran |

---

## MODUL 6: SURAT MENYURAT

### Admin / Asisten / Kadep
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Membuat dan mengirim surat baru | Input nomor, perihal, isi, lab tujuan |
| 2 | Mengunggah lampiran surat | Upload file sebagai lampiran |
| 3 | Melihat daftar surat masuk | Surat yang diterima oleh lab |
| 4 | Melihat daftar surat keluar | Surat yang dikirim oleh lab |
| 5 | Melihat detail/isi surat | Baca isi surat |
| 6 | Menandai surat sebagai sudah dibaca | Mark as read |
| 7 | Mengunduh lampiran surat | Download file lampiran |
| 8 | Melihat preview surat | Preview surat sebelum download |
| 9 | Melihat jumlah surat belum dibaca | Badge notifikasi |

---

## MODUL 7: KEPENGURUSAN & DATA MASTER

### Superadmin / Kadep
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar tahun kepengurusan | List semua periode (2024/2025, dst) |
| 2 | Membuat tahun kepengurusan baru | Input nama tahun |
| 3 | Mengedit tahun kepengurusan | Update nama |
| 4 | Menghapus tahun kepengurusan | Hapus tahun |
| 5 | Melihat daftar kepengurusan lab | List mapping lab + tahun |
| 6 | Membuat kepengurusan lab baru | Mapping laboratorium ke tahun kepengurusan |
| 7 | Mengedit kepengurusan lab | Update data, set aktif/nonaktif |
| 8 | Menghapus kepengurusan lab | Hapus kepengurusan |
| 9 | Mengaktifkan periode kepengurusan | Set sebagai periode aktif |
| 10 | Mengunggah SK kepengurusan | Upload file SK resmi |
| 11 | Mengunduh SK kepengurusan | Download file SK |
| 12 | Melihat daftar struktur jabatan | List jabatan (Kadep, Admin, dll) |
| 13 | Membuat struktur jabatan baru | Input nama jabatan & level |
| 14 | Mengedit struktur jabatan | Update nama/level |
| 15 | Menghapus struktur jabatan | Hapus jabatan |
| 16 | Melihat permission per jabatan | List hak akses per jabatan |
| 17 | Mengatur permission per jabatan | Assign/revoke permission ke jabatan |
| 18 | Melihat daftar laboratorium | List semua lab |
| 19 | Mengedit data laboratorium | Update nama/deskripsi lab |
| 20 | Melihat daftar user | List semua user sistem |
| 21 | Menambahkan user/admin baru | Registrasi user baru |
| 22 | Mengedit data user | Update nama/email/role |
| 23 | Menghapus user | Hapus user dari sistem |

### Superadmin (Eksklusif)
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar role & permission | List semua role (superadmin, admin, dll) |
| 2 | Membuat role baru | Input nama role |
| 3 | Mengedit role | Update nama role |
| 4 | Menghapus role | Hapus role |
| 5 | Mengatur permission per role | Assign/revoke permission ke role |
| 6 | Bulk assign permission ke role | Assign beberapa permission sekaligus |
| 7 | Melihat user per role | List user yang punya role tertentu |

### Admin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar anggota lab | List anggota kepengurusan aktif |
| 2 | Menambahkan anggota baru | Input user + jabatan |
| 3 | Mengedit jabatan/struktur anggota | Update posisi anggota |
| 4 | Menghapus anggota | Keluarkan dari kepengurusan |
| 5 | Mentransfer anggota dari periode sebelumnya | Copy anggota ke periode baru |
| 6 | Melihat anggota aktif dari periode lama | Referensi untuk transfer |

---

## MODUL 8: SERTIFIKAT

### Admin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Mengunggah template sertifikat praktikum | Upload .docx dengan placeholder |
| 2 | Men-generate sertifikat praktikum | Proses per penerima (praktikan/aslab) |
| 3 | Mengunggah template sertifikat kegiatan | Upload .docx template |
| 4 | Men-generate sertifikat kegiatan | Proses per penerima (peserta/panitia) |

### Praktikan / Asisten
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar sertifikat saya | List sertifikat yang dimiliki |
| 2 | Mengunduh file sertifikat | Download .docx sertifikat |

---

## MODUL 9: KUESIONER / SURVEY

### Admin
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar semua kuesioner | List kuesioner yang sudah dibuat |
| 2 | Membuat kuesioner baru | Input judul, deskripsi, tipe (internal/eksternal) |
| 3 | Menambahkan pertanyaan ke kuesioner | Input pertanyaan, tipe (text/radio/checkbox/scale), opsi |
| 4 | Menentukan target responden | Pilih role target (asisten/praktikan/dosen) |
| 5 | Mengatur periode kuesioner | Set tanggal mulai & selesai |
| 6 | Mengatur status wajib/opsional | Set kuesioner sebagai mandatory atau tidak |
| 7 | Melihat detail kuesioner | Lihat pertanyaan & konfigurasi |
| 8 | Mengedit kuesioner | Update judul, deskripsi, pertanyaan, target |
| 9 | Menghapus kuesioner | Hapus beserta semua respon terkait |
| 10 | Melihat hasil/statistik kuesioner | Dashboard jawaban, distribusi, chart |
| 11 | Melihat data responden | Siapa yang sudah/belum mengisi |
| 12 | Mengekspor hasil kuesioner ke Excel | Download data jawaban |
| 13 | Mengisi kuesioner | Mengisi sebagai responden jika termasuk target |

### User Target (Asisten / Praktikan / Dosen / Kadep)
| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat daftar kuesioner yang tersedia | Kuesioner yang ditargetkan ke role user |
| 2 | Mengisi kuesioner internal | Isi form pertanyaan & submit |
| 3 | Mengakses kuesioner eksternal | Redirect ke link Google Form/lainnya |

---

## FUNGSIONAL UMUM (Semua User yang Login)

| # | Fungsional | Keterangan |
|---|-----------|------------|
| 1 | Melihat dashboard | Halaman utama setelah login |
| 2 | Melihat halaman profil | Data akun sendiri |
| 3 | Mengedit profil | Update nama, email, foto |
| 4 | Mengubah password | Ganti password akun |
| 5 | Menghapus akun | Self-delete akun |
| 6 | Melihat halaman About | Informasi tentang sistem |
| 7 | Melihat sertifikat saya | Daftar sertifikat pribadi |
| 8 | Mengunduh sertifikat | Download file sertifikat |

---

## RINGKASAN STATISTIK

| Kategori | Jumlah |
|:---------|:------:|
| **Total Modul** | 9 |
| **Total Aktor** | 6 |
| **Total Fungsional (Detail)** | 170+ |
| **Modul Terbanyak** | Praktikum (51 fungsional) |
| **Aktor Paling Aktif** | Admin |

---

**Created by:** AI Assistant
**Last Updated:** 2026-02-18
**Sumber:** Analisis langsung dari `routes/web.php`, Controllers, Middleware, dan Model
