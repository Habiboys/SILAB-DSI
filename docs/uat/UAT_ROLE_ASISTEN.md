# LEMBAR PENGUJIAN PENERIMAAN PENGGUNA
## User Acceptance Test (UAT)
## Sistem Informasi Manajemen Laboratorium (SILAB)
## Role: Asisten

## A. Identitas Penguji
- Nama Lengkap:
- NIM/NIP:
- Jabatan: Asisten
- Tanggal Pengujian:
- Browser / Perangkat:

## B. Skenario Simulasi Uji Coba (Asisten)
1. ☐ Login ke sistem.
2. ☐ Akses praktikum sesuai penugasan.
3. ☐ Akses inventaris (lihat aset, pinjam, ajukan permohonan, lihat status).
4. ☐ Akses keuangan (lihat catatan kas/riwayat).
5. ☐ Akses kegiatan (laporan/dokumentasi/peserta/kalender).
6. ☐ Ajukan ganti jadwal piket.
7. ☐ Akses surat pribadi (dan surat resmi jika sekretaris).
8. ☐ Isi kuesioner.
9. ☐ Ubah password dan logout.

## C. Tabel Pengujian (Case Modul Berbasis Use Case)

| No. | Modul | Skenario Uji | Hasil yang Diharapkan | Aspek ISO/IEC 25010 |
|---|---|---|---|---|
| 1 | Praktikum | Melihat daftar praktikum | Daftar praktikum tampil sesuai akses | Functional Suitability |
| 2 | Praktikum | Mengelola pertemuan | Pertemuan dapat dikelola sesuai hak | Functional Suitability |
| 3 | Praktikum | Mengelola modul praktikum | Modul dapat dikelola sesuai hak | Functional Suitability |
| 4 | Praktikum | Mengelola praktikan | Data praktikan terkelola sesuai penugasan | Functional Suitability |
| 5 | Praktikum | Mengelola tugas praktikum | Tugas dapat dibuat/diubah/dihapus | Functional Suitability |
| 6 | Praktikum | Mengelola komponen rubrik | Rubrik tersimpan sesuai input | Functional Suitability |
| 7 | Praktikum | Mengelola penilaian tugas | Penilaian tersimpan dan tampil benar | Functional Suitability |
| 8 | Praktikum | Mengelola absensi praktikum | Absensi tercatat sesuai input | Functional Suitability |
| 9 | Praktikum | Mengelola sertifikat praktikum | Sertifikat dapat dikelola sesuai izin | Functional Suitability |
| 10 | Kegiatan/Proker | Mengelola proker | Data proker terkelola benar | Functional Suitability |
| 11 | Inventaris | Melihat daftar aset | Daftar aset tampil sesuai filter | Functional Suitability |
| 12 | Inventaris | Melihat detail aset publik (scan QR) | Detail aset tampil dari QR valid | Functional Suitability |
| 13 | Inventaris | Mengelola peminjaman aset | Proses pinjam-kembali tercatat benar | Functional Suitability |
| 14 | Inventaris | Mengajukan permohonan pengadaan | Pengajuan tersimpan status pending | Functional Suitability |
| 15 | Inventaris | Melihat permohonan pengadaan | Status permohonan tampil akurat | Functional Suitability |
| 16 | Keuangan | Melihat catatan kas | Catatan kas tampil sesuai data | Functional Suitability |
| 17 | Keuangan | Melihat riwayat keuangan | Riwayat transaksi tampil akurat | Functional Suitability |
| 18 | Kegiatan/Proker | Mengelola parameter penilaian proker | Parameter tersimpan dan dapat dipakai | Functional Suitability |
| 19 | Kegiatan/Proker | Mengajukan proker | Pengajuan proker berhasil diproses | Functional Suitability |
| 20 | Kegiatan/Proker | Melihat daftar proker | Daftar proker tampil sesuai akses | Functional Suitability |
| 21 | Kegiatan/Proker | Mengelola laporan & dokumentasi kegiatan | LPJ/dokumentasi dapat dikelola | Functional Suitability |
| 22 | Kegiatan/Proker | Mengelola peserta kegiatan | Data peserta terkelola benar | Functional Suitability |
| 23 | Kegiatan/Proker | Melihat kalender kegiatan | Kalender tampil sesuai jadwal | Functional Suitability |
| 24 | Piket | Melihat jadwal piket | Jadwal piket tampil sesuai periode/filter | Functional Suitability |
| 25 | Piket | Mengambil absensi piket (check-in/check-out) | Data kehadiran tercatat sesuai aksi | Functional Suitability |
| 26 | Piket | Melihat rekap/riwayat absensi piket | Rekap dan riwayat absensi tampil akurat | Functional Suitability |
| 27 | Piket | Mengajukan ganti jadwal | Permintaan ganti jadwal tersimpan | Functional Suitability |
| 28 | Surat | Kirim surat pribadi | Surat pribadi terkirim dan tercatat | Functional Suitability |
| 29 | Surat | Lihat surat masuk | Surat masuk tampil sesuai akses | Functional Suitability |
| 30 | Surat | Lihat surat keluar | Surat keluar tampil sesuai akses | Functional Suitability |
| 31 | Surat | Lihat detail & unduh surat | Detail/lampiran dapat diakses | Functional Suitability |
| 32 | Surat | Kirim surat resmi (jika sekretaris) | Surat resmi terkirim sesuai izin | Functional Suitability |
| 33 | Kuesioner | Mengisi kuesioner | Respon tersimpan sukses | Functional Suitability |

## D. Tambahan Aspek Umum (Ikuti Template)

| No. | Modul | Skenario Uji | Hasil yang Diharapkan | Aspek ISO/IEC 25010 |
|---|---|---|---|---|
| 12 | Umum | Antarmuka mudah dipahami | Seluruh tampilan antarmuka sistem dapat dipahami dan dinavigasi secara intuitif tanpa panduan tambahan. | Usability |
| 13 | Umum | Validasi input dan notifikasi sistem | Pesan sukses dan pesan kesalahan ditampilkan dengan jelas pada setiap interaksi yang relevan. | Usability |
| 14 | Umum | Kecepatan pemuatan data | Sistem mampu memuat data dari setiap modul secara cepat dan lengkap. | Performance Efficiency |
| 15 | Umum | Autentikasi akses sistem | Sistem hanya dapat diakses oleh pengguna yang telah melalui proses autentikasi yang valid. | Security |
| 16 | Umum | Otorisasi hak akses pengguna | Pengguna hanya dapat mengakses fitur dan data sesuai otoritas yang ditetapkan untuk perannya. | Security |
| 17 | Umum | Ubah password akun | Password berhasil diperbarui dan pengguna dapat login kembali menggunakan password baru. | Security |
| 18 | Umum | Logout dari sistem | Sesi pengguna berakhir normal, akses sistem tertutup, dan pengguna diarahkan ke halaman login. | Security |
| 19 | Umum | Integrasi antar modul | Seluruh data laboratorium dapat diakses lintas modul dan pertukaran data antar modul berjalan dengan baik. | Compatibility |
