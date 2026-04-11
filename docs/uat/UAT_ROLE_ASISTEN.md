# FORM UAT ROLE ASISTEN — SILAB (DETAIL)

## 1) Identitas Pengujian

- Nama Penguji:
- NIM/NIP:
- Lab/Divisi:
- Praktikum yang Diampu:
- Periode:
- Tanggal Uji:
- Browser/Perangkat:

---

## 2) Tujuan UAT Role Asisten

Memastikan role Asisten dapat menjalankan seluruh alur operasional yang relevan: Praktikum, Kegiatan/Proker, Piket, Inventaris (permohonan), Surat (sesuai izin), dan Kuesioner.

---

## 3) Prasyarat Data

- Akun Asisten aktif dan terassign ke minimal 1 praktikum.
- Tersedia kelas parent/subclass untuk uji scope data.
- Tersedia data submission, absensi, dan rubrik contoh.
- Tersedia 1 pengajuan ganti jadwal piket.
- Tersedia 1 kegiatan/proker dan 1 LPJ uji.
- Tersedia 1 permohonan aset milik asisten.

---

## 4) Daftar Test Case UAT Asisten

| ID UAT      | Modul      | Prioritas | Referensi Fungsional  | Skenario Uji                             | Hasil Diharapkan                              | Hasil Aktual | Status | Nilai (1-5) | Catatan |
| ----------- | ---------- | --------- | --------------------- | ---------------------------------------- | --------------------------------------------- | ------------ | ------ | ----------- | ------- |
| ASN-UAT-001 | Auth       | P1        | Umum-1                | Login valid asisten                      | Dashboard asisten tampil                      |              |        |             |         |
| ASN-UAT-002 | Praktikum  | P1        | Asisten-B-1/2         | Lihat praktikum & kelas penugasan        | Hanya kelas penugasan yang tampil             |              |        |             |         |
| ASN-UAT-003 | Praktikum  | P1        | Asisten-B-4/5/6       | Tambah/edit/hapus pertemuan              | Data pertemuan berubah sesuai aksi            |              |        |             |         |
| ASN-UAT-004 | Praktikum  | P1        | Asisten-B-7/8/9/10    | Tambah/edit/hapus modul                  | Modul tersimpan dan update konsisten          |              |        |             |         |
| ASN-UAT-005 | Praktikum  | P1        | Asisten-B-7           | Upload modul file valid                  | File dapat diunduh praktikan                  |              |        |             |         |
| ASN-UAT-006 | Praktikum  | P1        | Asisten-B-7           | Upload modul file invalid                | Ditolak validasi tipe/ukuran                  |              |        |             |         |
| ASN-UAT-007 | Praktikum  | P1        | Asisten-B-11/12/13/14 | Tambah/edit/hapus tugas                  | Tugas tampil sesuai status terbaru            |              |        |             |         |
| ASN-UAT-008 | Praktikum  | P1        | Asisten-B-15          | Lihat daftar pengumpulan tugas           | List submission lengkap                       |              |        |             |         |
| ASN-UAT-009 | Praktikum  | P1        | Asisten-B-16          | Unduh file pengumpulan                   | File submission dapat dibuka                  |              |        |             |         |
| ASN-UAT-010 | Praktikum  | P1        | Asisten-B-17          | Input nilai rubrik                       | Nilai komponen tersimpan                      |              |        |             |         |
| ASN-UAT-011 | Praktikum  | P1        | Asisten-B-18/19       | Edit/hapus nilai rubrik                  | Nilai akhir terhitung ulang                   |              |        |             |         |
| ASN-UAT-012 | Praktikum  | P2        | Asisten-B-20/21/22    | Tambah/edit/hapus nilai tambahan         | Penyesuaian nilai tercermin di rekap          |              |        |             |         |
| ASN-UAT-013 | Praktikum  | P1        | Asisten-B-23/24/25/26 | CRUD absensi praktikan                   | Rekap absensi sesuai perubahan                |              |        |             |         |
| ASN-UAT-014 | Praktikum  | P1        | Asisten-B-27/28/29/30 | CRUD absensi aslab                       | Data absensi aslab konsisten                  |              |        |             |         |
| ASN-UAT-015 | Praktikum  | P1        | PRAK-scope            | Uji scope parent-subclass                | Data turunan terbaca sesuai rule sistem       |              |        |             |         |
| ASN-UAT-016 | Praktikum  | P2        | PRAK-export           | Export nilai                             | File export nilai valid                       |              |        |             |         |
| ASN-UAT-017 | Praktikum  | P2        | PRAK-export           | Export absensi                           | File export absensi valid                     |              |        |             |         |
| ASN-UAT-018 | Praktikum  | P2        | Asisten-B-31/32       | Lihat/unduh sertifikat praktikum         | Data sertifikat sesuai hak akses              |              |        |             |         |
| ASN-UAT-019 | Piket      | P1        | Asisten-C-1           | Lihat jadwal piket pribadi               | Jadwal sesuai akun login                      |              |        |             |         |
| ASN-UAT-020 | Piket      | P1        | Asisten-C-2/3         | Check-in dan check-out piket             | Waktu hadir tercatat benar                    |              |        |             |         |
| ASN-UAT-021 | Piket      | P1        | Asisten-C-4           | Ajukan penggantian jadwal                | Pengajuan tercatat pending                    |              |        |             |         |
| ASN-UAT-022 | Piket      | P2        | Asisten-C-6/7         | Edit/batalkan pengajuan sebelum diproses | Pengajuan berubah sesuai aksi                 |              |        |             |         |
| ASN-UAT-023 | Piket      | P2        | Asisten-C-5           | Lihat status penggantian jadwal          | Status pending/approved/rejected akurat       |              |        |             |         |
| ASN-UAT-024 | Kegiatan   | P2        | Asisten-A-1/2/3/4     | Kelola kegiatan sesuai izin              | Perubahan tersimpan sesuai hak                |              |        |             |         |
| ASN-UAT-025 | Kegiatan   | P2        | Asisten-A-13/14/15/16 | Upload/lihat/unduh/hapus LPJ kegiatan    | LPJ konsisten pada list-detail                |              |        |             |         |
| ASN-UAT-026 | Kegiatan   | P2        | Asisten-A-17/18/19/20 | Kelola peserta kegiatan                  | Peserta bertambah/berkurang benar             |              |        |             |         |
| ASN-UAT-027 | Kegiatan   | P3        | Asisten-A-21          | Lihat kalender kegiatan                  | Kalender tampil tanpa error                   |              |        |             |         |
| ASN-UAT-028 | Inventaris | P2        | Asisten-D-1/2         | Lihat daftar & detail aset               | Data aset sesuai lab aktif                    |              |        |             |         |
| ASN-UAT-029 | Inventaris | P2        | Asisten-D-3/4/5/6     | Kelola permohonan aset sendiri           | Hanya permohonan milik sendiri dapat diubah   |              |        |             |         |
| ASN-UAT-030 | Surat      | P2        | Asisten-D-Surat       | CRUD surat sesuai izin                   | Aksi berhasil sesuai batas permission         |              |        |             |         |
| ASN-UAT-031 | Kuesioner  | P2        | Asisten-D-Kues        | Isi jawaban kuesioner                    | Respon tersimpan satu kali submit             |              |        |             |         |
| ASN-UAT-032 | Otorisasi  | P1        | Auth-Role             | Coba akses fitur admin kritikal          | Akses ditolak                                 |              |        |             |         |
| ASN-UAT-033 | Umum       | P2        | Umum-4/8              | Ubah password & logout                   | Password berubah, session ditutup saat logout |              |        |             |         |

---

## 5) Rekap Role Asisten

| Total Kasus | PASS | FAIL | BLOCKED | Persentase Kelulusan |
| ----------: | ---: | ---: | ------: | -------------------: |
|          33 |      |      |         |                      |

---

## 6) Isu dan Tindak Lanjut

| No  | ID UAT | Ringkasan Isu | Severity | PIC | Target Fix | Status |
| --- | ------ | ------------- | -------- | --- | ---------- | ------ |
| 1   |        |               |          |     |            |        |

---

## 7) Sign-Off Asisten

- Nama Penguji:
- Keputusan: Diterima / Diterima dengan Catatan / Ditolak Sementara
- Tanggal:
- Tanda Tangan:
