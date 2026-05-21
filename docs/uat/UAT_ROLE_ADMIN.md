# LEMBAR PENGUJIAN PENERIMAAN PENGGUNA
## User Acceptance Test (UAT)
## Sistem Informasi Manajemen Laboratorium (SILAB)
## Role: Admin

## A. Identitas Penguji
- Nama Lengkap:
- NIP:
- Jabatan: Admin
- Tanggal Pengujian:
- Browser / Perangkat:

## B. Skenario Simulasi Uji Coba (Admin)
1. ☐ Login ke sistem.
2. ☐ Kelola praktikum (pertemuan, modul, tugas, nilai, absensi, sertifikat).
3. ☐ Kelola inventaris (aset, kondisi, peminjaman, permohonan, kategori).
4. ☐ Kelola keuangan (riwayat, nominal kas, catatan kas, rekap).
5. ☐ Kelola kegiatan/proker dan kepengurusan.
6. ☐ Kelola piket (periode, jadwal, absensi, approval ganti jadwal).
7. ☐ Kelola surat (pribadi dan resmi).
8. ☐ Kelola kuesioner dan lihat hasil.
9. ☐ Ubah password dan logout.

## C. Tabel Pengujian (Case Modul Berbasis Use Case)

| No. | Modul | Skenario Uji | Hasil yang Diharapkan | Aspek ISO/IEC 25010 |
|---|---|---|---|---|
| 1 | Praktikum | Mengelola praktikum | Data praktikum dapat ditambah/ubah/hapus sesuai aksi | Functional Suitability |
| 2 | Praktikum | Mengelola pertemuan | Data pertemuan tersimpan dan tampil benar | Functional Suitability |
| 3 | Praktikum | Mengelola modul praktikum | Modul dapat diunggah/diubah/dihapus | Functional Suitability |
| 4 | Praktikum | Mengelola praktikan | Data praktikan terkelola sesuai aturan | Functional Suitability |
| 5 | Praktikum | Mengelola aslab | Penugasan aslab tersimpan benar | Functional Suitability |
| 6 | Praktikum | Mengelola tugas praktikum | Tugas dapat dikelola end-to-end | Functional Suitability |
| 7 | Praktikum | Mengelola komponen rubrik | Komponen/bobot rubrik tersimpan benar | Functional Suitability |
| 8 | Praktikum | Mengelola penilaian tugas | Nilai tersimpan dan rekap sesuai | Functional Suitability |
| 9 | Praktikum | Mengelola absensi praktikum | Kehadiran tercatat sesuai input | Functional Suitability |
| 10 | Praktikum | Mengelola sertifikat praktikum | Sertifikat dapat dikelola sesuai proses | Functional Suitability |
| 11 | Inventaris | Mengelola aset | Data aset (CRUD/QR/export) berjalan benar | Functional Suitability |
| 12 | Inventaris | Mengelola kondisi aset | Kondisi dan riwayat aset tercatat benar | Functional Suitability |
| 13 | Inventaris | Mengelola peminjaman aset | Proses pinjam-kembali berjalan benar | Functional Suitability |
| 14 | Inventaris | Mengelola permohonan pengadaan | Status/data permohonan terkelola benar | Functional Suitability |
| 15 | Inventaris | Mengelola kategori aset | Kategori aset terkelola benar | Functional Suitability |
| 16 | Inventaris | Melihat daftar aset | Daftar aset tampil lengkap sesuai filter | Functional Suitability |
| 17 | Keuangan | Mengelola riwayat keuangan | Transaksi tersimpan dan dapat diekspor | Functional Suitability |
| 18 | Keuangan | Mengelola nominal kas | Nominal kas terkelola sesuai aksi | Functional Suitability |
| 19 | Keuangan | Melihat catatan kas | Catatan kas tampil sesuai data | Functional Suitability |
| 20 | Keuangan | Melihat rekap keuangan | Rekap bulanan tampil benar | Functional Suitability |
| 21 | Keuangan | Melihat riwayat keuangan | Riwayat view-only tampil akurat | Functional Suitability |
| 22 | Kegiatan/Proker | Mengelola proker | Data proker terkelola benar | Functional Suitability |
| 23 | Kegiatan/Proker | Mengelola parameter penilaian proker | Parameter tersimpan dan dapat dipakai | Functional Suitability |
| 24 | Kegiatan/Proker | Mengelola dokumentasi proker | Dokumen proker terkelola benar | Functional Suitability |
| 25 | Kegiatan/Proker | Mengajukan proker | Pengajuan proker berhasil diproses | Functional Suitability |
| 26 | Kegiatan/Proker | Menyetujui/menolak proker | Status approval berubah sesuai aksi | Functional Suitability |
| 27 | Kegiatan/Proker | Mengelola kegiatan | Data kegiatan terkelola benar | Functional Suitability |
| 28 | Kegiatan/Proker | Mengelola laporan & dokumentasi kegiatan | LPJ/dokumentasi terkelola benar | Functional Suitability |
| 29 | Kegiatan/Proker | Mengelola peserta kegiatan | Data peserta kegiatan konsisten | Functional Suitability |
| 30 | Kegiatan/Proker | Mengelola sertifikat kegiatan | Sertifikat kegiatan terkelola benar | Functional Suitability |
| 31 | Kegiatan/Proker | Mengelola kepengurusan | Data kepengurusan terkelola benar | Functional Suitability |
| 32 | Kegiatan/Proker | Mengelola anggota | Data anggota terkelola benar | Functional Suitability |
| 33 | Kegiatan/Proker | Melihat kalender kegiatan | Kalender kegiatan tampil benar | Functional Suitability |
| 34 | Piket | Mengelola periode piket | Periode piket terkelola benar | Functional Suitability |
| 35 | Piket | Mengelola jadwal piket | Jadwal piket tersimpan sesuai assign | Functional Suitability |
| 36 | Piket | Mengelola absensi piket | Data absensi check-in/out valid | Functional Suitability |
| 37 | Piket | Menyetujui/menolak ganti jadwal | Status request berubah sesuai aksi | Functional Suitability |
| 38 | Piket | Melihat rekap absensi | Rekap tampil sesuai periode/filter | Functional Suitability |
| 39 | Surat | Kirim surat pribadi | Surat pribadi terkirim dan tercatat | Functional Suitability |
| 40 | Surat | Lihat surat masuk | Surat masuk tampil benar | Functional Suitability |
| 41 | Surat | Lihat surat keluar | Surat keluar tampil benar | Functional Suitability |
| 42 | Surat | Lihat detail & unduh surat | Detail/lampiran dapat diakses | Functional Suitability |
| 43 | Surat | Kirim surat resmi | Surat resmi terkirim sesuai aturan | Functional Suitability |
| 44 | Surat | Lihat arsip surat resmi | Arsip resmi tampil sesuai filter | Functional Suitability |
| 45 | Kuesioner | Mengelola kuesioner | Kuesioner dapat dibuat/diubah/dihapus | Functional Suitability |
| 46 | Kuesioner | Melihat hasil kuesioner | Hasil kuesioner tampil benar | Functional Suitability |

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
