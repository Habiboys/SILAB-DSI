# Dokumentasi Pengujian Fungsional (Black Box Testing)

> **Catatan:** Nomor tabel (5.X) dan nomor subbab (5.2.3.X) disesuaikan dengan urutan di dokumen skripsi.

---

## 5.2.3.X Pengujian Fungsional Modul Autentikasi

Pengujian fungsional modul autentikasi memverifikasi proses login, validasi kredensial, hak akses berbasis peran, dan perlindungan halaman dari akses tanpa autentikasi.

**Tabel 5.X Pengujian Fungsional Modul Autentikasi (Black Box Testing)**

| No | Kasus Uji | Data Masukan | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-----------|--------------|-----------------------|--------------|--------|
| 1 | Login valid sebagai admin | Email dan password yang valid | Berhasil login dan diarahkan ke halaman dashboard | Sesuai | Lulus |
| 2 | Login valid sebagai praktikan | Email dan password praktikan yang valid | Berhasil login dan diarahkan ke halaman daftar tugas | Sesuai | Lulus |
| 3 | Login dengan password salah | Email valid, password tidak valid | Muncul pesan kesalahan kredensial tidak sesuai | Sesuai | Lulus |
| 4 | Login dengan field kosong | Tidak ada data yang diisi | Tetap berada di halaman login, muncul validasi field wajib | Sesuai | Lulus |
| 5 | Akses halaman dashboard tanpa login | - | Dialihkan ke halaman login | Sesuai | Lulus |
| 6 | Akses halaman riwayat keuangan tanpa login | - | Dialihkan ke halaman login | Sesuai | Lulus |

---

## 5.2.3.X Pengujian Fungsional Modul Inventaris

Pengujian fungsional modul inventaris memverifikasi pengelolaan siklus hidup aset dari pencatatan, QR Code, kondisi, peminjaman, hingga alur permohonan pengadaan.

**Tabel 5.X Pengujian Fungsional Modul Inventaris (Black Box Testing)**

| No | Kasus Uji | Data Masukan | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-----------|--------------|-----------------------|--------------|--------|
| 1 | Buat data aset baru | Nama, kategori, kode unik, foto, kondisi | Aset tersimpan dengan kode unik dan tersedia di daftar | Sesuai | Lulus |
| 2 | Akses detail aset via QR Code | - | Halaman detail aset ditampilkan dengan informasi lengkap | Sesuai | Lulus |
| 3 | Akses detail aset dengan UUID tidak valid | UUID tidak valid | Menampilkan halaman 404 atau pesan aset tidak ditemukan | Sesuai | Lulus |
| 4 | Pendaftaran peminjaman multi-aset | Nama peminjam, keperluan, tanggal kembali, pilihan aset | Transaksi peminjaman tercatat dengan jumlah aset yang sesuai | Sesuai | Lulus |
| 5 | Pengembalian aset secara individual | - | Aset berhasil dikembalikan dan status diperbarui | Sesuai | Lulus |
| 6 | Asisten mengajukan permohonan pengadaan | Alasan pengadaan, nama barang | Status permohonan berubah menjadi diajukan | Sesuai | Lulus |
| 7 | Kalab menyetujui permohonan pengadaan | Keputusan kalab | Notifikasi sukses muncul, status permohonan diperbarui | Sesuai | Lulus |
| 8 | Kadep memberikan ACC akhir permohonan | Keputusan kadep | Notifikasi sukses muncul, permohonan mendapat persetujuan akhir | Sesuai | Lulus |

---

## 5.2.3.X Pengujian Fungsional Modul Keuangan

Pengujian fungsional modul keuangan memverifikasi pencatatan transaksi pemasukan dan pengeluaran, pemfilteran laporan berdasarkan periode, serta ekspor laporan keuangan.

**Tabel 5.X Pengujian Fungsional Modul Keuangan (Black Box Testing)**

| No | Kasus Uji | Data Masukan | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-----------|--------------|-----------------------|--------------|--------|
| 1 | Tambah transaksi pemasukan | Jenis transaksi, tanggal, jumlah, keterangan | Transaksi tersimpan dan notifikasi berhasil muncul | Sesuai | Lulus |
| 2 | Tambah transaksi pengeluaran | Jenis transaksi, tanggal, jumlah, keterangan | Transaksi tersimpan dan notifikasi berhasil muncul | Sesuai | Lulus |
| 3 | Akses halaman rekap keuangan | - | Halaman rekap keuangan tampil dengan data yang sesuai | Sesuai | Lulus |
| 4 | Filter laporan berdasarkan rentang tanggal | Tanggal mulai dan tanggal akhir | Data laporan difilter dan ditampilkan sesuai periode | Sesuai | Lulus |
| 5 | Ekspor laporan keuangan | - | File laporan berhasil diunduh | Sesuai | Lulus |

---

## 5.2.3.X Pengujian Fungsional Modul Kegiatan dan Program Kerja

Pengujian fungsional modul kegiatan dan program kerja memverifikasi pembuatan proker, alur persetujuan, pengelolaan kegiatan, upload dokumentasi, dan ekspor LPJ.

**Tabel 5.X Pengujian Fungsional Modul Kegiatan dan Program Kerja (Black Box Testing)**

| No | Kasus Uji | Data Masukan | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-----------|--------------|-----------------------|--------------|--------|
| 1 | Buat program kerja baru | Divisi, nama proker, deskripsi | Proker tersimpan dan muncul dalam daftar | Sesuai | Lulus |
| 2 | Setujui proker yang diajukan | - | Notifikasi sukses muncul, status proker berubah menjadi disetujui | Sesuai | Lulus |
| 3 | Tolak proker dengan catatan | Catatan penolakan | Notifikasi sukses muncul, status proker berubah menjadi ditolak | Sesuai | Lulus |
| 4 | Buat kegiatan baru | Nama kegiatan, proker terkait, tanggal pelaksanaan, deskripsi | Kegiatan tersimpan dan notifikasi berhasil muncul | Sesuai | Lulus |
| 5 | Setujui kegiatan | - | Notifikasi sukses muncul, status kegiatan berubah menjadi disetujui | Sesuai | Lulus |
| 6 | Upload dokumentasi kegiatan | Judul dokumentasi, file foto | Notifikasi sukses muncul, dokumentasi tersimpan | Sesuai | Lulus |
| 7 | Ekspor LPJ sebagai PDF | - | File PDF berhasil diunduh | Sesuai | Lulus |

---

## 5.2.3.X Pengujian Fungsional Modul Kuesioner

Pengujian fungsional modul kuesioner memverifikasi pembuatan kuesioner dengan pertanyaan dan target peran, serta pengisian dan pengiriman jawaban oleh praktikan.

**Tabel 5.X Pengujian Fungsional Modul Kuesioner (Black Box Testing)**

| No | Kasus Uji | Data Masukan | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-----------|--------------|-----------------------|--------------|--------|
| 1 | Buat kuesioner baru dengan target praktikan | Judul, deskripsi, tanggal aktif, target peran, pertanyaan | Kuesioner tersimpan dan muncul dalam daftar | Sesuai | Lulus |
| 2 | Praktikan melihat daftar kuesioner | - | Halaman kuesioner tampil dengan daftar kuesioner yang tersedia | Sesuai | Lulus |
| 3 | Praktikan mengisi dan mengirim jawaban kuesioner | Jawaban teks, pilihan opsi | Jawaban berhasil dikirim dan dikonfirmasi | Sesuai | Lulus |

---

## 5.2.3.X Pengujian Fungsional Modul Praktikum

Pengujian fungsional modul praktikum memverifikasi pengelolaan praktikum dari pembuatan kelas, penambahan peserta, penjadwalan pertemuan, pembuatan tugas, hingga pengumpulan tugas oleh praktikan.

**Tabel 5.X Pengujian Fungsional Modul Praktikum (Black Box Testing)**

| No | Kasus Uji | Data Masukan | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-----------|--------------|-----------------------|--------------|--------|
| 1 | Akses halaman manajemen praktikum | - | Halaman praktikum tampil dengan opsi tambah kelas | Sesuai | Lulus |
| 2 | Buat kelas praktikum baru | Nama kelas, hari, lokasi, jam mulai, jam selesai | Kelas tersimpan dan notifikasi berhasil muncul | Sesuai | Lulus |
| 3 | Tambah praktikan ke kelas | Nama atau NIM mahasiswa | Praktikan berhasil ditambahkan ke kelas | Sesuai | Lulus |
| 4 | Buat pertemuan praktikum | Judul pertemuan, tanggal | Pertemuan tersimpan dan notifikasi berhasil muncul | Sesuai | Lulus |
| 5 | Buat tugas praktikum | Judul tugas, pertemuan terkait, batas waktu pengumpulan | Tugas tersimpan dan notifikasi berhasil muncul | Sesuai | Lulus |
| 6 | Praktikan melihat daftar tugas | - | Tugas yang ditugaskan tampil dalam daftar | Sesuai | Lulus |
| 7 | Praktikan mengumpulkan tugas | File tugas (PDF) | Pengumpulan dikonfirmasi dengan tanda status "Dikumpulkan" | Sesuai | Lulus |

---

## 5.2.3.X Pengujian Fungsional Modul Piket

Pengujian fungsional modul piket memverifikasi penjadwalan petugas piket harian dan pencatatan kehadiran piket melalui kamera foto oleh asisten laboratorium.

**Tabel 5.X Pengujian Fungsional Modul Piket (Black Box Testing)**

| No | Kasus Uji | Data Masukan | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-----------|--------------|-----------------------|--------------|--------|
| 1 | Akses halaman jadwal piket | - | Halaman jadwal piket tampil dengan daftar petugas per hari | Sesuai | Lulus |
| 2 | Tambah petugas piket pada hari tertentu | Pilihan pengguna, hari penugasan | Petugas berhasil ditambahkan dan notifikasi berhasil muncul | Sesuai | Lulus |
| 3 | Asisten mengakses halaman absensi piket | - | Halaman absensi piket tampil dengan opsi check-in | Sesuai | Lulus |
| 4 | Asisten membuka kamera untuk absensi | - | Kamera aktif dan tombol ambil foto tersedia | Sesuai | Lulus |
| 5 | Asisten melakukan check-in dengan foto | Foto wajah, rencana kegiatan harian | Absensi piket berhasil dicatat dan notifikasi muncul | Sesuai | Lulus |
