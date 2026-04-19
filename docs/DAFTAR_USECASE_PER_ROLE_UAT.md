# Daftar Fungsional Berdasarkan Use Case per Role (Untuk UAT)

Dokumen ini merangkum **fungsi per role** berdasarkan diagram use case yang ada, dengan menampilkan **kode use case + nama use case** agar mudah dipakai sebagai dasar penyusunan UAT.

> Pembaruan: untuk versi yang sudah divalidasi ulang terhadap **seluruh use case per modul pada struktur terbaru**, gunakan dokumen ini:
> - [docs/KATALOG_USECASE_UAT_PER_ROLE_DAN_FLOW.md](docs/KATALOG_USECASE_UAT_PER_ROLE_DAN_FLOW.md)
>
> Dokumen ini tetap disimpan sebagai referensi historis berbasis skema `UC_00`.

## Sumber Dokumen

- [docs/usecase/UC_00_SILAB_COMPLETE.puml](docs/usecase/UC_00_SILAB_COMPLETE.puml)
- [docs/auth/usecase/UC_AUTH.puml](docs/auth/usecase/UC_AUTH.puml)
- Referensi modul per domain: [docs/usecase/README_USECASE.md](docs/usecase/README_USECASE.md)

---

## 1) Kamus Kode Use Case (UC_00)

### Inventaris
- `I1` Lihat Daftar Aset
- `I2` Tambah Aset Baru
- `I3` Edit Data Aset
- `I4` Hapus Aset
- `I5` Tambah Kategori Aset
- `I5b` Edit Kategori Aset
- `I5c` Hapus Kategori Aset
- `I6` Ajukan Permohonan Pengadaan Aset
- `I7` Approve Permohonan Pengadaan
- `I7b` Reject Permohonan Pengadaan
- `I8` Lihat Daftar Permohonan

### Keuangan
- `F1` Lihat Riwayat Transaksi
- `F2` Catat Pemasukan
- `F3` Catat Pengeluaran
- `F4` Edit Transaksi
- `F5` Hapus Transaksi
- `F6` Kelola Nominal Kas
- `F7` Lihat Rekap Bulanan
- `F8` Export Laporan Excel
- `F9` Lihat Catatan Kas

### Praktikum
- `P1` Buat Praktikum Baru
- `P2` Edit Praktikum
- `P3` Hapus Praktikum
- `P4` Upload Modul
- `P5` Download Modul
- `P6` Import Praktikan Excel
- `P7` Tambah Praktikan Manual
- `P8` Edit Data Praktikan
- `P9` Assign Kelas
- `P10` Assign Aslab
- `P11` Buat Pertemuan
- `P12` Input Absensi
- `P13` Buat Tugas
- `P14` Submit Tugas
- `P15` Buat Rubrik Penilaian
- `P16` Input Nilai Manual
- `P17` Input Nilai Rubrik
- `P18` Export Nilai
- `P19` Generate Sertifikat Praktikum

### Kegiatan & Proker
- `K1` Buat Kegiatan Baru
- `K2` Edit Kegiatan
- `K3` Hapus Kegiatan
- `K4` Approve Kegiatan
- `K5` Reject Kegiatan
- `K6` Upload LPJ
- `K7` Tambah Peserta
- `K9` Upload Template Sertifikat
- `K10` Generate Sertifikat Kegiatan
- `K11` Lihat Kalender
- `R1` Buat Program Kerja
- `R5` Update Status Proker
- `R6` Lihat Daftar Proker

### Piket
- `T1` Buat Periode Piket
- `T2` Buat Jadwal Piket
- `T3` Lihat Jadwal Piket
- `T4` Request Ganti Jadwal
- `T5` Approve Ganti Jadwal
- `T7` Input Absensi Piket
- `T8` Lihat Rekap Absen

### Surat Menyurat
- `S1` Kirim Surat
- `S2` Lihat Surat Masuk
- `S3` Lihat Surat Keluar
- `S4` Tandai Dibaca
- `S5` Download Lampiran
- `S6` Upload Lampiran

### Kepengurusan & Data Master
- `N2` Buat Periode Baru
- `N3` Set Periode Aktif
- `N4` Lihat Anggota
- `N5` Tambah Anggota
- `N6` Edit Struktur Anggota
- `N7` Hapus Anggota
- `N8` Transfer Periode Lama
- `N9` Upload SK
- `M1` Kelola Struktur Jabatan
- `M3` Kelola Tahun Kepengurusan
- `M4` Kelola Data Lab
- `M5` Kelola Role & Permissions
- `M7` User Management

### Sertifikat
- `C1` Lihat Sertifikat Saya
- `C2` Download Sertifikat
- `C5` Upload Template

### Kuesioner
- `Q1` Buat Kuesioner
- `Q2` Edit Kuesioner
- `Q3` Hapus Kuesioner
- `Q4` Isi Kuesioner
- `Q5` Lihat Hasil
- `Q6` Export Hasil

---

## 2) Daftar Use Case per Role (UC_00)

## 2.1 Superadmin

| Kode | Nama Use Case |
|---|---|
| I7 | Approve Permohonan Pengadaan |
| I7b | Reject Permohonan Pengadaan |
| I8 | Lihat Daftar Permohonan |
| F2 | Catat Pemasukan |
| F6 | Kelola Nominal Kas |
| P1 | Buat Praktikum Baru |
| P19 | Generate Sertifikat Praktikum |
| K4 | Approve Kegiatan |
| R1 | Buat Program Kerja |
| T1 | Buat Periode Piket |
| N2 | Buat Periode Baru |
| N3 | Set Periode Aktif |
| N5 | Tambah Anggota |
| M1 | Kelola Struktur Jabatan |
| M5 | Kelola Role & Permissions |
| M7 | User Management |
| Q1 | Buat Kuesioner |
| Q5 | Lihat Hasil |

## 2.2 Kadep

| Kode | Nama Use Case |
|---|---|
| I1 | Lihat Daftar Aset |
| F1 | Lihat Riwayat Transaksi |
| F7 | Lihat Rekap Bulanan |
| F8 | Export Laporan Excel |
| P5 | Download Modul |
| K4 | Approve Kegiatan |
| K5 | Reject Kegiatan |
| K11 | Lihat Kalender |
| R6 | Lihat Daftar Proker |
| T3 | Lihat Jadwal Piket |
| T8 | Lihat Rekap Absen |
| S1 | Kirim Surat |
| S2 | Lihat Surat Masuk |
| N2 | Buat Periode Baru |
| N4 | Lihat Anggota |
| M1 | Kelola Struktur Jabatan |
| M7 | User Management |
| Q4 | Isi Kuesioner |
| Q5 | Lihat Hasil |

## 2.3 Admin

| Kode | Nama Use Case |
|---|---|
| I1 | Lihat Daftar Aset |
| I2 | Tambah Aset Baru |
| I3 | Edit Data Aset |
| I4 | Hapus Aset |
| I5 | Tambah Kategori Aset |
| I5b | Edit Kategori Aset |
| I5c | Hapus Kategori Aset |
| I7 | Approve Permohonan Pengadaan |
| I7b | Reject Permohonan Pengadaan |
| I8 | Lihat Daftar Permohonan |
| F1 | Lihat Riwayat Transaksi |
| F2 | Catat Pemasukan |
| F3 | Catat Pengeluaran |
| F4 | Edit Transaksi |
| F5 | Hapus Transaksi |
| F6 | Kelola Nominal Kas |
| F7 | Lihat Rekap Bulanan |
| P1 | Buat Praktikum Baru |
| P2 | Edit Praktikum |
| P3 | Hapus Praktikum |
| P4 | Upload Modul |
| P6 | Import Praktikan Excel |
| P7 | Tambah Praktikan Manual |
| P8 | Edit Data Praktikan |
| P9 | Assign Kelas |
| P10 | Assign Aslab |
| P11 | Buat Pertemuan |
| P12 | Input Absensi |
| P13 | Buat Tugas |
| P15 | Buat Rubrik Penilaian |
| P16 | Input Nilai Manual |
| P18 | Export Nilai |
| P19 | Generate Sertifikat Praktikum |
| K1 | Buat Kegiatan Baru |
| K2 | Edit Kegiatan |
| K3 | Hapus Kegiatan |
| K4 | Approve Kegiatan |
| K6 | Upload LPJ |
| K7 | Tambah Peserta |
| K9 | Upload Template Sertifikat |
| K10 | Generate Sertifikat Kegiatan |
| R1 | Buat Program Kerja |
| R5 | Update Status Proker |
| R6 | Lihat Daftar Proker |
| T1 | Buat Periode Piket |
| T2 | Buat Jadwal Piket |
| T3 | Lihat Jadwal Piket |
| T5 | Approve Ganti Jadwal |
| T8 | Lihat Rekap Absen |
| N4 | Lihat Anggota |
| N5 | Tambah Anggota |
| N6 | Edit Struktur Anggota |
| N7 | Hapus Anggota |
| C5 | Upload Template |
| Q1 | Buat Kuesioner |
| Q2 | Edit Kuesioner |
| Q3 | Hapus Kuesioner |
| Q5 | Lihat Hasil |

## 2.4 Asisten

| Kode | Nama Use Case |
|---|---|
| I1 | Lihat Daftar Aset |
| I6 | Ajukan Permohonan Pengadaan Aset |
| I8 | Lihat Daftar Permohonan |
| F1 | Lihat Riwayat Transaksi |
| F7 | Lihat Rekap Bulanan |
| P5 | Download Modul |
| P12 | Input Absensi |
| P13 | Buat Tugas |
| P16 | Input Nilai Manual |
| P17 | Input Nilai Rubrik |
| K1 | Buat Kegiatan Baru |
| K2 | Edit Kegiatan |
| K6 | Upload LPJ |
| K7 | Tambah Peserta |
| K11 | Lihat Kalender |
| R6 | Lihat Daftar Proker |
| T3 | Lihat Jadwal Piket |
| T4 | Request Ganti Jadwal |
| T7 | Input Absensi Piket |
| S1 | Kirim Surat |
| S2 | Lihat Surat Masuk |
| S3 | Lihat Surat Keluar |
| S4 | Tandai Dibaca |
| S5 | Download Lampiran |
| N4 | Lihat Anggota |
| C1 | Lihat Sertifikat Saya |
| C2 | Download Sertifikat |
| Q4 | Isi Kuesioner |

## 2.5 Praktikan

| Kode | Nama Use Case |
|---|---|
| P5 | Download Modul |
| P14 | Submit Tugas |
| C1 | Lihat Sertifikat Saya |
| C2 | Download Sertifikat |
| Q4 | Isi Kuesioner |

## 2.6 Dosen

| Kode | Nama Use Case |
|---|---|
| K4 | Approve Kegiatan |
| K5 | Reject Kegiatan |
| K11 | Lihat Kalender |
| R6 | Lihat Daftar Proker |
| Q4 | Isi Kuesioner |

---

## 3) Use Case Modul Auth (Tambahan untuk UAT Login/Akses)

Berdasarkan [docs/auth/usecase/UC_AUTH.puml](docs/auth/usecase/UC_AUTH.puml):

### Untuk Publik (belum login)
- `UC01` Login
- `UC02` Register
- `UC03` Lupa & Reset Password

### Untuk Pengguna Terautentikasi
- `UC04` Logout
- `UC05` Ganti Password
- `UC06` Verifikasi Email
- `UC07` Konfirmasi Password

Catatan:
- Di diagram Auth, aktor turunan yang ditulis eksplisit: Admin, Asisten, Kadep, Praktikan.
- Untuk UAT operasional SILAB, `UC04`–`UC07` umumnya juga diterapkan untuk Dosen dan role terautentikasi lain jika menggunakan guard/auth flow yang sama.

---

## 4) Format Siap Pakai untuk Mapping UAT

| Role | Kode Use Case | Nama Use Case | ID UAT | Status |
|---|---|---|---|---|
| Admin | I2 | Tambah Aset Baru | UAT-ADM-INV-001 |  |
| Asisten | T4 | Request Ganti Jadwal | UAT-ASN-PIK-004 |  |
| Praktikan | P14 | Submit Tugas | UAT-PRK-PRAK-003 |  |

---

## 5) Saran Eksekusi

- Gunakan dokumen ini sebagai **traceability matrix** awal: `Role -> Use Case -> ID UAT`.
- Prioritaskan UAT untuk use case kritikal (login, submit tugas, approval, transaksi keuangan, export laporan).
- Jika perlu, langkah berikutnya adalah membuat file lanjutan: **RTM_UAT_USECASE_TO_TESTCASE.md** yang memetakan 1 use case ke beberapa test case positif/negatif.
