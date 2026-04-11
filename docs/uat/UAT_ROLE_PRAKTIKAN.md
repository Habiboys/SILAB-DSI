# FORM UAT ROLE PRAKTIKAN — SILAB (DETAIL)

## 1) Identitas Pengujian

- Nama Penguji:
- NIM:
- Prodi/Kelas/Subkelas:
- Praktikum:
- Periode:
- Tanggal Uji:
- Browser/Perangkat:
- URL Environment:

---

## 2) Referensi Cakupan Fungsional

- Daftar fungsional sistem: dokumen master fungsional SILAB.
- Rangkuman fungsional per role: fokus role Praktikan.
- Item uji komprehensif: kode PRAK dan KUES.

---

## 3) Ruang Lingkup UAT Praktikan

1. Akses akun dan keamanan dasar.
2. Aktivitas akademik praktikum (modul, tugas, nilai, absensi).
3. Layanan pendukung (sertifikat, kuesioner, profil).
4. Pembatasan akses terhadap fitur non-role.

---

## 4) Prasyarat Data

- Akun Praktikan aktif pada periode kepengurusan aktif.
- Praktikan sudah ter-assign ke minimal 1 kelas/subkelas.
- Tersedia minimal:
    - 2 modul praktikum,
    - 2 tugas aktif (1 file upload, 1 link submission),
    - 1 tugas yang sudah dinilai,
    - data absensi minimal 2 pertemuan,
    - 1 sertifikat terbit (jika modul sertifikat aktif),
    - 1 kuesioner aktif untuk target Praktikan.

---

## 5) Skala, Prioritas, dan Status

- Skala: 1 (Sangat Tidak Sesuai) s.d. 5 (Sangat Sesuai)
- Status: PASS / FAIL / BLOCKED
- Prioritas:
    - P1 = kritikal (mengganggu proses utama)
    - P2 = tinggi
    - P3 = menengah

---

## 6) Daftar Test Case UAT Praktikan

| ID UAT      | Modul      | Prioritas | Referensi Fungsional | Skenario Uji                           | Hasil Diharapkan                               | Hasil Aktual | Status | Nilai (1-5) | Catatan |
| ----------- | ---------- | --------- | -------------------- | -------------------------------------- | ---------------------------------------------- | ------------ | ------ | ----------- | ------- |
| PRK-UAT-001 | Auth       | P1        | Umum-1               | Login dengan kredensial valid          | Masuk ke dashboard praktikan                   |              |        |             |         |
| PRK-UAT-002 | Auth       | P1        | Umum-1               | Login dengan password salah            | Login ditolak + pesan validasi                 |              |        |             |         |
| PRK-UAT-003 | Auth       | P2        | Umum-4               | Ubah password                          | Password baru tersimpan dan bisa dipakai login |              |        |             |         |
| PRK-UAT-004 | Profil     | P2        | Umum-2/3             | Lihat & edit profil sendiri            | Data profil tersimpan tanpa mengubah role      |              |        |             |         |
| PRK-UAT-005 | Praktikum  | P1        | Praktikan-7          | Lihat daftar modul                     | Modul tampil sesuai praktikum aktif            |              |        |             |         |
| PRK-UAT-006 | Praktikum  | P1        | Praktikan-6          | Unduh modul                            | File modul berhasil diunduh dan dapat dibuka   |              |        |             |         |
| PRK-UAT-007 | Praktikum  | P2        | Praktikan-8          | Unduh template pengumpulan             | Template dapat diunduh                         |              |        |             |         |
| PRK-UAT-008 | Praktikum  | P1        | Praktikan-1          | Lihat daftar tugas aktif               | Hanya tugas aktif yang muncul di daftar aktif  |              |        |             |         |
| PRK-UAT-009 | Praktikum  | P1        | Praktikan-2          | Lihat detail tugas                     | Instruksi, deadline, lampiran tampil lengkap   |              |        |             |         |
| PRK-UAT-010 | Praktikum  | P1        | Praktikan-4          | Submit tugas dengan file valid         | Submission tersimpan + status berubah terkirim |              |        |             |         |
| PRK-UAT-011 | Praktikum  | P1        | Praktikan-4          | Submit tugas dengan link valid         | Link tersimpan dan bisa dibuka penguji         |              |        |             |         |
| PRK-UAT-012 | Praktikum  | P1        | Praktikan-4          | Submit tugas file ekstensi tidak valid | Ditolak dengan pesan validasi file             |              |        |             |         |
| PRK-UAT-013 | Praktikum  | P2        | Praktikan-4          | Submit tugas melebihi deadline         | Ditolak sesuai aturan deadline                 |              |        |             |         |
| PRK-UAT-014 | Praktikum  | P2        | Praktikan-5          | Edit submission sebelum dinilai        | Submission lama terganti versi terbaru         |              |        |             |         |
| PRK-UAT-015 | Praktikum  | P1        | Praktikan-5          | Coba edit submission setelah dinilai   | Perubahan ditolak dan data lama tetap          |              |        |             |         |
| PRK-UAT-016 | Praktikum  | P2        | Praktikan-5          | Batalkan submission sebelum dinilai    | Status kembali belum mengumpulkan              |              |        |             |         |
| PRK-UAT-017 | Praktikum  | P1        | Praktikan-3/6        | Lihat riwayat tugas                    | Riwayat, status, dan feedback tampil konsisten |              |        |             |         |
| PRK-UAT-018 | Praktikum  | P1        | Praktikan-3/7        | Lihat nilai tugas                      | Nilai tampil sama dengan nilai penguji         |              |        |             |         |
| PRK-UAT-019 | Praktikum  | P1        | Praktikan-3/7        | Lihat nilai akhir/rekap                | Nilai akhir konsisten terhadap komponen        |              |        |             |         |
| PRK-UAT-020 | Praktikum  | P2        | Praktikan-3          | Lihat absensi per pertemuan            | Kehadiran sesuai data absensi asisten/admin    |              |        |             |         |
| PRK-UAT-021 | Sertifikat | P2        | Sertifikat-1         | Lihat daftar sertifikat saya           | Daftar sertifikat milik akun tampil            |              |        |             |         |
| PRK-UAT-022 | Sertifikat | P2        | Sertifikat-2         | Unduh sertifikat                       | Sertifikat terunduh dan dokumen valid          |              |        |             |         |
| PRK-UAT-023 | Kuesioner  | P2        | Kuesioner-User-1     | Lihat kuesioner aktif untuk praktikan  | Hanya kuesioner target praktikan yang tampil   |              |        |             |         |
| PRK-UAT-024 | Kuesioner  | P2        | Kuesioner-User-2     | Isi kuesioner internal                 | Jawaban tersimpan, submit sekali               |              |        |             |         |
| PRK-UAT-025 | Kuesioner  | P3        | Kuesioner-User-3     | Akses kuesioner eksternal              | Redirect berjalan ke tautan eksternal          |              |        |             |         |
| PRK-UAT-026 | Otorisasi  | P1        | Auth-Role            | Coba akses menu admin/asisten/kadep    | Sistem menolak akses non-role                  |              |        |             |         |
| PRK-UAT-027 | Otorisasi  | P1        | Auth-Route           | Akses URL private admin via direct URL | Redirect/403 sesuai kebijakan                  |              |        |             |         |
| PRK-UAT-028 | Umum       | P2        | Umum-6               | Buka halaman about/info sistem         | Halaman tampil tanpa error                     |              |        |             |         |
| PRK-UAT-029 | Umum       | P2        | Umum-8               | Logout                                 | Session berakhir dan kembali ke login          |              |        |             |         |

---

## 7) Rekap UAT Praktikan

| Total Kasus | PASS | FAIL | BLOCKED | Persentase Kelulusan |
| ----------: | ---: | ---: | ------: | -------------------: |
|          29 |      |      |         |                      |

$$
	ext{Kelulusan} = \frac{\text{PASS}}{\text{Total Kasus} - \text{BLOCKED}} \times 100\%
$$

---

## 8) Daftar Temuan dan Tindak Lanjut

| No  | ID UAT | Ringkasan Temuan | Severity | PIC | Target Fix | Status |
| --- | ------ | ---------------- | -------- | --- | ---------- | ------ |
| 1   |        |                  |          |     |            |        |

---

## 9) Sign-Off

- Nama Penguji:
- Keputusan: Diterima / Diterima dengan Catatan / Ditolak Sementara
- Tanggal:
- Tanda Tangan:
