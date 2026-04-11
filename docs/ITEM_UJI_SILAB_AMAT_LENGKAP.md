# ITEM UJI SISTEM SILAB (VERSI SANGAT LENGKAP)

Dokumen ini menyajikan rancangan item uji komprehensif untuk SILAB sebagai superapp multi-modul. Format disusun agar langsung bisa dipakai pada subbab pengujian Bab V.

---

## 1.0 Ringkasan Cakupan

Total inventori item uji: **216 item**

1. Core Auth & User Management: 24 item
2. Praktikum: 72 item
3. Kegiatan/Proker/LPJ: 22 item
4. Piket: 14 item
5. Keuangan: 14 item
6. Inventaris: 16 item
7. Surat & Kepengurusan: 16 item
8. Kuesioner: 12 item
9. Integrasi Superapp: 10 item
10. Non-Fungsional: 16 item

> Catatan: Penomoran dokumen dibatasi maksimal 4 level (contoh: 2.3.1.1).

---

## 2.0 Master Inventory Item Uji

### 2.1 Format Kode Uji

- AUTH-xxx, USER-xxx
- PRAK-xxx
- KEG-xxx
- PIK-xxx
- KEU-xxx
- INV-xxx
- SUR-xxx
- KUES-xxx
- INT-xxx
- NF-xxx

### 2.2 Core Auth & User Management (24 item)

1. AUTH-001 Login valid role Admin.
2. AUTH-002 Login valid role Asisten.
3. AUTH-003 Login valid role Dosen.
4. AUTH-004 Login valid role Kadep.
5. AUTH-005 Login valid role Praktikan.
6. AUTH-006 Login dengan password salah.
7. AUTH-007 Login akun nonaktif.
8. AUTH-008 Login dengan field kosong.
9. AUTH-009 Logout sukses.
10. AUTH-010 Akses route private tanpa login.
11. AUTH-011 Akses route tanpa permission.
12. AUTH-012 Redirect dashboard sesuai role.
13. AUTH-013 Session expired.
14. AUTH-014 Uji multi-tab session consistency.
15. USER-001 Create user.
16. USER-002 Update user.
17. USER-003 Delete user.
18. USER-004 Validasi email unik create.
19. USER-005 Validasi email unik update.
20. USER-006 Validasi role wajib.
21. USER-007 Aktivasi/nonaktivasi user.
22. USER-008 Detail user + profile + relasi.
23. USER-009 Pencarian user.
24. USER-010 Audit trail perubahan user.

### 2.3 Praktikum (72 item)

#### 2.3.1 Master Praktikum (18 item)

1. PRAK-001 CRUD mata kuliah.
2. PRAK-002 CRUD praktikum.
3. PRAK-003 CRUD kelas parent.
4. PRAK-004 CRUD subkelas.
5. PRAK-005 Validasi parent-subclass tidak siklik.
6. PRAK-006 Import praktikan dari Excel valid.
7. PRAK-007 Import praktikan format invalid.
8. PRAK-008 Tambah praktikan manual.
9. PRAK-009 Assign praktikan ke kelas.
10. PRAK-010 Remove praktikan dari kelas.
11. PRAK-011 Assign aslab ke praktikum.
12. PRAK-012 Remove aslab.
13. PRAK-013 Redistribusi praktikan.
14. PRAK-014 Redistribusi pertemuan.
15. PRAK-015 Redistribusi tugas.
16. PRAK-016 Pencarian praktikan.
17. PRAK-017 Filter kelas/periode.
18. PRAK-018 Otorisasi aksi master praktikum.

#### 2.3.2 Pertemuan dan Modul (16 item)

19. PRAK-019 CRUD pertemuan.
20. PRAK-020 Filter pertemuan per kelas.
21. PRAK-021 Scope parent menampilkan descendant.
22. PRAK-022 Scope subclass mengikuti rule sistem.
23. PRAK-023 CRUD modul.
24. PRAK-024 Upload file modul valid.
25. PRAK-025 Upload file modul invalid extension.
26. PRAK-026 Download modul.
27. PRAK-027 Share link modul aktif/nonaktif.
28. PRAK-028 Filter modul per kelas.
29. PRAK-029 Pencarian modul.
30. PRAK-030 Konsistensi jumlah modul list vs detail.
31. PRAK-031 Validasi relasi modul-pertemuan.
32. PRAK-032 Hapus pertemuan berdampak modul.
33. PRAK-033 Otorisasi edit/hapus modul.
34. PRAK-034 Tampilan fallback saat data kosong.

#### 2.3.3 Tugas dan Pengumpulan (18 item)

35. PRAK-035 CRUD tugas.
36. PRAK-036 Publish/unpublish tugas.
37. PRAK-037 Validasi deadline tugas.
38. PRAK-038 Submit tugas file valid.
39. PRAK-039 Submit tugas file invalid.
40. PRAK-040 Submit tugas via link valid.
41. PRAK-041 Edit submission sebelum dinilai.
42. PRAK-042 Cegah ubah submission setelah dinilai.
43. PRAK-043 Batal submission.
44. PRAK-044 Daftar pengumpulan per tugas.
45. PRAK-045 Download file pengumpulan.
46. PRAK-046 Reject submission.
47. PRAK-047 Search riwayat tugas praktikan.
48. PRAK-048 Search attachment pada detail tugas.
49. PRAK-049 Filter status pengumpulan.
50. PRAK-050 Otorisasi akses detail tugas.
51. PRAK-051 Konsistensi status submit list vs detail.
52. PRAK-052 Notifikasi status tugas (jika tersedia).

#### 2.3.4 Nilai, Absensi, Sertifikat (20 item)

53. PRAK-053 Input nilai manual.
54. PRAK-054 Input nilai rubrik.
55. PRAK-055 Update nilai rubrik.
56. PRAK-056 Hapus nilai rubrik.
57. PRAK-057 Nilai tambahan tambah/edit/hapus.
58. PRAK-058 Rekap nilai akhir.
59. PRAK-059 Export nilai per kelas.
60. PRAK-060 Export nilai seluruh praktikum.
61. PRAK-061 Input absensi praktikan.
62. PRAK-062 Input absensi aslab.
63. PRAK-063 Validasi ID absensi di scope kelas.
64. PRAK-064 Edit/hapus absensi.
65. PRAK-065 Export absensi.
66. PRAK-066 Search absensi praktikan/aslab.
67. PRAK-067 Konsistensi scope parent-subclass pada absensi.
68. PRAK-068 Generate sertifikat praktikum.
69. PRAK-069 Distribusi sertifikat praktikum.
70. PRAK-070 Download sertifikat oleh penerima.
71. PRAK-071 Validasi template sertifikat.
72. PRAK-072 Otorisasi fitur nilai/absensi/sertifikat.

### 2.4 Kegiatan/Proker/LPJ (22 item)

1. KEG-001 CRUD proker.
2. KEG-002 Ajukan proker.
3. KEG-003 Approve proker.
4. KEG-004 Reject proker.
5. KEG-005 CRUD parameter proker.
6. KEG-006 CRUD penanggung jawab proker.
7. KEG-007 Upload dokumentasi proker.
8. KEG-008 CRUD kegiatan.
9. KEG-009 Approve/reject kegiatan.
10. KEG-010 Kelola peserta kegiatan.
11. KEG-011 Upload dokumentasi kegiatan.
12. KEG-012 Upload LPJ kegiatan.
13. KEG-013 Download LPJ kegiatan.
14. KEG-014 Generate sertifikat kegiatan.
15. KEG-015 CRUD LPJ final.
16. KEG-016 Refresh rekap LPJ final.
17. KEG-017 Ajukan LPJ final.
18. KEG-018 Approve LPJ final.
19. KEG-019 Lock LPJ final.
20. KEG-020 Export LPJ final PDF.
21. KEG-021 Search/filter kegiatan/proker.
22. KEG-022 Otorisasi lintas role kegiatan/LPJ.

### 2.5 Piket (14 item)

1. PIK-001 CRUD periode piket.
2. PIK-002 CRUD jadwal piket.
3. PIK-003 Lihat jadwal per asisten.
4. PIK-004 Input absensi piket.
5. PIK-005 Verifikasi absensi.
6. PIK-006 Batalkan verifikasi.
7. PIK-007 Ajukan penggantian jadwal.
8. PIK-008 Approve penggantian jadwal.
9. PIK-009 Reject penggantian jadwal.
10. PIK-010 Rekap absensi piket.
11. PIK-011 Filter periode/anggota/status.
12. PIK-012 Export rekap piket.
13. PIK-013 Otorisasi aksi verifikasi.
14. PIK-014 Konsistensi data jadwal vs absensi.

### 2.6 Keuangan (14 item)

1. KEU-001 CRUD nominal kas.
2. KEU-002 Aktivasi/nonaktivasi nominal kas.
3. KEU-003 Tambah pemasukan.
4. KEU-004 Tambah pengeluaran.
5. KEU-005 Edit transaksi.
6. KEU-006 Hapus transaksi.
7. KEU-007 Validasi nominal tidak negatif.
8. KEU-008 Validasi saldo setelah transaksi.
9. KEU-009 Filter laporan per periode.
10. KEU-010 Filter laporan per kategori.
11. KEU-011 Search transaksi.
12. KEU-012 Export laporan keuangan.
13. KEU-013 Otorisasi transaksi.
14. KEU-014 Konsistensi rekap vs detail.

### 2.7 Inventaris (16 item)

1. INV-001 CRUD kategori aset.
2. INV-002 CRUD detail aset.
3. INV-003 Upload foto aset.
4. INV-004 Generate QR/label aset.
5. INV-005 Riwayat kondisi aset.
6. INV-006 CRUD permohonan pengadaan.
7. INV-007 Approve permohonan.
8. INV-008 Reject permohonan.
9. INV-009 CRUD peminjaman aset.
10. INV-010 Update status peminjaman.
11. INV-011 Pengembalian aset.
12. INV-012 Validasi stok saat pinjam.
13. INV-013 Filter inventaris.
14. INV-014 Search inventaris.
15. INV-015 Export data inventaris.
16. INV-016 Otorisasi inventaris per role.

### 2.8 Surat dan Kepengurusan (16 item)

1. SUR-001 CRUD surat masuk.
2. SUR-002 CRUD surat keluar.
3. SUR-003 Upload lampiran surat.
4. SUR-004 Download lampiran.
5. SUR-005 Export surat masuk.
6. SUR-006 Export surat keluar.
7. SUR-007 CRUD disposisi.
8. SUR-008 Update status disposisi.
9. SUR-009 Konfigurasi surat.
10. SUR-010 CRUD tahun kepengurusan.
11. SUR-011 CRUD kepengurusan lab.
12. SUR-012 CRUD anggota kepengurusan.
13. SUR-013 Update status anggota.
14. SUR-014 Transfer anggota antar periode.
15. SUR-015 Search/filter surat dan anggota.
16. SUR-016 Otorisasi surat/kepengurusan.

### 2.9 Kuesioner (12 item)

1. KUES-001 CRUD kuesioner.
2. KUES-002 CRUD pertanyaan.
3. KUES-003 CRUD opsi jawaban.
4. KUES-004 Set target responden.
5. KUES-005 Set periode aktif.
6. KUES-006 Publish/unpublish kuesioner.
7. KUES-007 Submit jawaban responden.
8. KUES-008 Cegah submit duplikat (jika dibatasi).
9. KUES-009 Rekap hasil kuesioner.
10. KUES-010 Export hasil kuesioner.
11. KUES-011 Search/filter hasil.
12. KUES-012 Otorisasi akses hasil.

### 2.10 Integrasi Superapp (10 item)

1. INT-001 Konsistensi profile user lintas modul.
2. INT-002 Konsistensi role-permission pada menu, route, endpoint.
3. INT-003 Konsistensi kelas parent-subclass lintas halaman praktikum.
4. INT-004 Konsistensi status dokumen list-detail.
5. INT-005 Konsistensi total rekap terhadap data detail.
6. INT-006 Navigasi antar modul tanpa kehilangan konteks.
7. INT-007 Konsistensi format tanggal/status lintas modul.
8. INT-008 Konsistensi data setelah redistribusi kelas.
9. INT-009 Konsistensi data setelah import massal.
10. INT-010 Konsistensi data setelah rollback perubahan.

### 2.11 Non-Fungsional (16 item)

1. NF-001 Performa list besar (pagination/filter/search).
2. NF-002 Performa endpoint ekspor.
3. NF-003 Uji unggah berkas besar.
4. NF-004 Uji retry unggah berkas gagal.
5. NF-005 Uji reliabilitas koneksi tidak stabil.
6. NF-006 Uji timeout dan recovery.
7. NF-007 Uji kompatibilitas browser Chrome.
8. NF-008 Uji kompatibilitas browser Edge.
9. NF-009 Uji kompatibilitas browser Firefox.
10. NF-010 Uji responsivitas antarmuka.
11. NF-011 Uji keamanan upload file.
12. NF-012 Uji SQL injection input teks.
13. NF-013 Uji akses langsung URL terproteksi.
14. NF-014 Uji logging error penting.
15. NF-015 Uji backup-restore data uji.
16. NF-016 Uji regresi fitur kritikal.

---

## 3.0 Matriks Prioritas Pengujian

### 3.1 Definisi Prioritas

1. **P1 (Kritikal):** Auth, otorisasi, penyimpanan data utama, ekspor inti, integrasi parent-subclass.
2. **P2 (Tinggi):** proses operasional harian per modul.
3. **P3 (Menengah):** fitur pendukung, penyempurnaan UX.

### 3.2 Target Kelulusan

1. P1 harus lulus 100%.
2. P2 minimal lulus 95%.
3. P3 minimal lulus 90%.

---

## 4.0 Daftar Kasus Uji P1 Wajib (Contoh Siap Eksekusi)

1. AUTH-001, AUTH-006, AUTH-010, USER-007.
2. PRAK-021, PRAK-022, PRAK-038, PRAK-053, PRAK-061, PRAK-063, PRAK-067, PRAK-072.
3. KEG-002, KEG-003, KEG-017, KEG-019, KEG-020.
4. PIK-004, PIK-005, PIK-008.
5. KEU-004, KEU-008, KEU-012, KEU-014.
6. INV-004, INV-009, INV-012.
7. SUR-007, SUR-012, SUR-016.
8. KUES-005, KUES-007, KUES-012.
9. INT-002, INT-003, INT-004.
10. NF-001, NF-011, NF-013, NF-016.

---

## 5.0 Template Detail Kasus Uji

Gunakan format berikut agar konsisten di lampiran:

1. **ID Uji**
2. **Modul**
3. **Skenario**
4. **Prasyarat**
5. **Data Masukan**
6. **Langkah Uji**
7. **Hasil Diharapkan**
8. **Hasil Aktual**
9. **Status (Pass/Fail)**
10. **Severity jika gagal**
11. **Bukti Uji (Screenshot/Log/File)**
12. **Catatan Perbaikan dan Retest**

Contoh tabel:

| No  | ID Uji   | Modul | Skenario          | Data Masukan                | Hasil Diharapkan         | Hasil Aktual | Status | Severity | Bukti  | Catatan |
| --- | -------- | ----- | ----------------- | --------------------------- | ------------------------ | ------------ | ------ | -------- | ------ | ------- |
| 1   | AUTH-001 | Auth  | Login valid admin | user aktif + password benar | Redirect dashboard admin | Sesuai       | Pass   | -        | SS-001 | -       |

---

## 6.0 Checklist Kaji Ulang Kelengkapan (Supaya Tidak Kurang)

Sebelum final Bab V, pastikan 10 poin ini sudah ada:

1. Semua role diuji minimal 1 alur end-to-end.
2. Semua modul punya minimal 1 skenario negatif.
3. Semua modul punya minimal 1 uji otorisasi.
4. Fitur ekspor diuji kesesuaian isi file.
5. Fitur upload diuji valid/invalid file.
6. Rule parent-subclass diuji lintas halaman praktikum.
7. Uji integrasi list-detail dilakukan pada modul kritikal.
8. Uji regresi dilakukan setelah perbaikan bug.
9. Bukti uji tersimpan rapi (screenshot/log/file).
10. Rekap pass/fail per modul disajikan di akhir subbab pengujian.

---

## 7.0 Saran Eksekusi Pengujian

1. Mulai dari P1, lanjut P2, terakhir P3.
2. Gunakan dataset realistis (bukan dummy terlalu kecil).
3. Catat bug dengan format: langkah reproduksi, expected, actual, akar masalah, perbaikan, retest.
4. Jalankan regression untuk modul yang terdampak perubahan.
5. Buat ringkasan statistik hasil uji per modul untuk memudahkan pembahasan di Bab V.
