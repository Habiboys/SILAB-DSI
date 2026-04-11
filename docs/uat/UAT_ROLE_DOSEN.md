# FORM UAT ROLE DOSEN — SILAB (DETAIL)

## 1) Identitas Pengujian

- Nama Penguji:
- NIP:
- Program Studi:
- Praktikum/Mata Kuliah:
- Periode:
- Tanggal Uji:
- Browser/Perangkat:

---

## 2) Tujuan UAT Role Dosen

Memastikan role Dosen dapat menjalankan fungsi monitoring akademik praktikum, evaluasi kegiatan sesuai alur persetujuan, surat menyurat sesuai izin, serta pengisian kuesioner.

---

## 3) Prasyarat Data

- Akun Dosen aktif dan terhubung ke praktikum/periode aktif.
- Data absensi, tugas, pengumpulan, nilai, dan rekap tersedia.
- Tersedia data kegiatan/proker menunggu persetujuan dosen.
- Tersedia data surat masuk/keluar untuk uji akses.
- Tersedia 1 kuesioner aktif target dosen.

---

## 4) Daftar Test Case UAT Dosen

| ID UAT      | Modul     | Prioritas | Referensi Fungsional | Skenario Uji                              | Hasil Diharapkan                                | Hasil Aktual | Status | Nilai (1-5) | Catatan |
| ----------- | --------- | --------- | -------------------- | ----------------------------------------- | ----------------------------------------------- | ------------ | ------ | ----------- | ------- |
| DSN-UAT-001 | Auth      | P1        | Umum-1               | Login valid dosen                         | Dashboard dosen tampil                          |              |        |             |         |
| DSN-UAT-002 | Praktikum | P1        | Dosen-monitoring     | Lihat ringkasan praktikum                 | Statistik kelas/peserta akurat                  |              |        |             |         |
| DSN-UAT-003 | Praktikum | P1        | Dosen-monitoring     | Lihat daftar peserta per kelas            | Daftar peserta sesuai kelas/filter              |              |        |             |         |
| DSN-UAT-004 | Praktikum | P1        | Dosen-monitoring     | Lihat kehadiran per pertemuan             | Status hadir/izin/sakit/alpa konsisten          |              |        |             |         |
| DSN-UAT-005 | Praktikum | P1        | Dosen-monitoring     | Lihat progres pengumpulan tugas           | Total submit/terlambat/ditolak akurat           |              |        |             |         |
| DSN-UAT-006 | Praktikum | P1        | Dosen-monitoring     | Lihat nilai per tugas                     | Nilai detail tampil benar                       |              |        |             |         |
| DSN-UAT-007 | Praktikum | P1        | Dosen-monitoring     | Lihat rekap nilai akhir                   | Nilai akhir sesuai komponen                     |              |        |             |         |
| DSN-UAT-008 | Praktikum | P1        | Dosen-monitoring     | Validasi konsistensi list vs detail nilai | Tidak ada mismatch data                         |              |        |             |         |
| DSN-UAT-009 | Praktikum | P2        | Dosen-monitoring     | Filter data per periode                   | Data berubah sesuai periode                     |              |        |             |         |
| DSN-UAT-010 | Praktikum | P2        | Dosen-monitoring     | Filter data per kelas/subkelas            | Data sesuai scope filter                        |              |        |             |         |
| DSN-UAT-011 | Praktikum | P2        | Dosen-monitoring     | Search praktikan berdasarkan nama/NIM     | Hasil pencarian relevan                         |              |        |             |         |
| DSN-UAT-012 | Praktikum | P2        | Dosen-report         | Export nilai                              | File export valid dan dapat dibuka              |              |        |             |         |
| DSN-UAT-013 | Praktikum | P2        | Dosen-report         | Export absensi                            | File export valid dan dapat dibuka              |              |        |             |         |
| DSN-UAT-014 | Kegiatan  | P1        | Dosen-A-3            | Approve kegiatan sesuai alur              | Status kegiatan menjadi approved + log tercatat |              |        |             |         |
| DSN-UAT-015 | Kegiatan  | P1        | Dosen-A-4            | Reject kegiatan sesuai alur               | Status rejected + alasan tersimpan              |              |        |             |         |
| DSN-UAT-016 | Kegiatan  | P2        | Dosen-A-1/2          | Lihat daftar & detail proker              | Data proker terbaca lengkap                     |              |        |             |         |
| DSN-UAT-017 | Surat     | P2        | Dosen-B              | Lihat surat masuk/keluar sesuai izin      | Data surat tampil sesuai permission             |              |        |             |         |
| DSN-UAT-018 | Surat     | P2        | Dosen-B              | Tambah/update surat/disposisi sesuai izin | Perubahan tersimpan sesuai hak akses            |              |        |             |         |
| DSN-UAT-019 | Kuesioner | P2        | Dosen-C              | Lihat dan isi kuesioner aktif             | Respon tersimpan, tidak duplikat submit         |              |        |             |         |
| DSN-UAT-020 | Otorisasi | P1        | Auth-Role            | Coba akses fitur admin penuh              | Akses ditolak (403/redirect)                    |              |        |             |         |
| DSN-UAT-021 | Umum      | P2        | Umum-4               | Ubah password                             | Password baru dapat dipakai login               |              |        |             |         |
| DSN-UAT-022 | Umum      | P2        | Umum-8               | Logout                                    | Session berakhir benar                          |              |        |             |         |

---

## 5) Rekap Role Dosen

| Total Kasus | PASS | FAIL | BLOCKED | Persentase Kelulusan |
| ----------: | ---: | ---: | ------: | -------------------: |
|          22 |      |      |         |                      |

---

## 6) Isu dan Tindak Lanjut

| No  | ID UAT | Ringkasan Isu | Severity | PIC | Target Fix | Status |
| --- | ------ | ------------- | -------- | --- | ---------- | ------ |
| 1   |        |               |          |     |            |        |

---

## 7) Sign-Off Dosen

- Nama Penguji:
- Keputusan: Diterima / Diterima dengan Catatan / Ditolak Sementara
- Tanggal:
- Tanda Tangan:
