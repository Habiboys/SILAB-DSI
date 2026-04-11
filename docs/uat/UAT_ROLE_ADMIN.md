# FORM UAT ROLE ADMIN — SILAB (DETAIL LINTAS MODUL)

## 1) Identitas Pengujian

- Nama Penguji:
- NIP/ID:
- Jabatan:
- Periode Uji:
- Tanggal Uji:
- Browser/Perangkat:
- Environment:

---

## 2) Tujuan UAT Role Admin

Memastikan role Admin dapat menjalankan seluruh fungsi operasional SILAB pada modul Kepengurusan, Praktikum, Kegiatan/Proker/LPJ, Piket, Keuangan, Inventaris, Surat, Sertifikat, dan Kuesioner.

---

## 3) Prasyarat Data

- Akun Admin aktif pada lab dan periode aktif.
- Tersedia akun uji lintas role: praktikan, asisten, dosen, kadep.
- Tersedia data awal di semua modul:
    - Praktikum (kelas, modul, tugas, absensi, nilai),
    - Kegiatan/Proker/LPJ,
    - Piket,
    - Keuangan,
    - Inventaris,
    - Surat,
    - Kuesioner,
    - Sertifikat.

---

## 4) Daftar Test Case UAT Admin

| ID UAT      | Modul          | Prioritas | Referensi Fungsional | Skenario Uji                                                     | Hasil Diharapkan                                | Hasil Aktual | Status | Nilai (1-5) | Catatan |
| ----------- | -------------- | --------- | -------------------- | ---------------------------------------------------------------- | ----------------------------------------------- | ------------ | ------ | ----------- | ------- |
| ADM-UAT-001 | Auth           | P1        | Umum-1               | Login valid admin                                                | Dashboard admin tampil                          |              |        |             |         |
| ADM-UAT-002 | Kepengurusan   | P1        | Admin-Kep-1..12      | CRUD tahun, kepengurusan lab, anggota                            | Data master tersimpan dan tampil konsisten      |              |        |             |         |
| ADM-UAT-003 | Kepengurusan   | P1        | Admin-Kep-5/6        | Transfer anggota periode sebelumnya                              | Anggota tersalin ke periode aktif sesuai aturan |              |        |             |         |
| ADM-UAT-004 | User           | P1        | Admin-kep-21..23     | Create/update/delete user                                        | User berubah sesuai aksi                        |              |        |             |         |
| ADM-UAT-005 | User           | P1        | USER-004/005         | Validasi email unik create/update                                | Duplikasi email ditolak                         |              |        |             |         |
| ADM-UAT-006 | User           | P1        | USER-007             | Aktivasi/nonaktivasi user                                        | User nonaktif tidak bisa login                  |              |        |             |         |
| ADM-UAT-007 | User           | P2        | USER-009             | Search user                                                      | Hasil pencarian relevan                         |              |        |             |         |
| ADM-UAT-008 | User           | P2        | USER-008             | Detail user + profile + relasi                                   | Detail lengkap dan konsisten                    |              |        |             |         |
| ADM-UAT-009 | Proker         | P1        | Admin-B-1..19        | CRUD proker + parameter + PJ + dokumentasi                       | Data proker konsisten list-detail               |              |        |             |         |
| ADM-UAT-010 | Proker         | P1        | KEG-002/003/004      | Ajukan/approve/reject proker                                     | Status transisi benar + catatan tersimpan       |              |        |             |         |
| ADM-UAT-011 | Kegiatan       | P1        | Admin-B-keg          | CRUD kegiatan + peserta + dokumentasi                            | Data kegiatan dan peserta konsisten             |              |        |             |         |
| ADM-UAT-012 | Kegiatan       | P2        | KEG-009              | Approve/reject kegiatan                                          | Status sesuai aksi                              |              |        |             |         |
| ADM-UAT-013 | LPJ            | P1        | KEG-012/013          | Upload/download/hapus LPJ kegiatan                               | File LPJ tersimpan dan dapat diakses            |              |        |             |         |
| ADM-UAT-014 | LPJ Final      | P1        | KEG-015..020         | CRUD, refresh rekap, ajukan, approve, lock, export PDF           | Alur LPJ final end-to-end valid                 |              |        |             |         |
| ADM-UAT-015 | Praktikum      | P1        | PRAK-001..005        | CRUD mata kuliah/praktikum/kelas/subkelas + validasi hierarchy   | Struktur kelas valid tanpa siklik               |              |        |             |         |
| ADM-UAT-016 | Praktikum      | P1        | PRAK-006..013        | Import/tambah praktikan + assignment                             | Data praktikan tersimpan benar                  |              |        |             |         |
| ADM-UAT-017 | Praktikum      | P2        | PRAK-014..015        | Redistribusi praktikan/pertemuan/tugas                           | Data berpindah sesuai kelas tujuan              |              |        |             |         |
| ADM-UAT-018 | Praktikum      | P1        | PRAK-019..034        | CRUD pertemuan/modul + upload + share link + otorisasi           | Modul/pertemuan konsisten dan tervalidasi       |              |        |             |         |
| ADM-UAT-019 | Praktikum      | P1        | PRAK-035..052        | CRUD tugas + publish + deadline + monitoring submission          | Alur tugas stabil end-to-end                    |              |        |             |         |
| ADM-UAT-020 | Praktikum      | P1        | PRAK-053..072        | Nilai, absensi, sertifikat, export                               | Rekap nilai/absensi/sertifikat konsisten        |              |        |             |         |
| ADM-UAT-021 | Praktikum      | P1        | PRAK-scope           | Uji konsistensi scope parent-subclass lintas halaman             | Data scope konsisten                            |              |        |             |         |
| ADM-UAT-022 | Piket          | P1        | PIK-001..014         | CRUD periode/jadwal, absensi, verifikasi, penggantian, export    | Semua alur piket berjalan sesuai status         |              |        |             |         |
| ADM-UAT-023 | Keuangan       | P1        | KEU-001..014         | Nominal kas, transaksi, validasi saldo, filter, export           | Rekap keuangan sama dengan detail transaksi     |              |        |             |         |
| ADM-UAT-024 | Inventaris     | P1        | INV-001..016         | Kategori, aset, QR, riwayat kondisi, permohonan, peminjaman      | Traceability aset terjaga                       |              |        |             |         |
| ADM-UAT-025 | Surat          | P1        | SUR-modul            | Surat masuk/keluar, disposisi, konfigurasi, export               | Data surat dan status disposisi akurat          |              |        |             |         |
| ADM-UAT-026 | Sertifikat     | P2        | Sertifikat-admin     | Upload template + generate sertifikat praktikum/kegiatan         | Dokumen sertifikat valid                        |              |        |             |         |
| ADM-UAT-027 | Kuesioner      | P1        | KUES-001..012        | CRUD kuesioner, pertanyaan, target, periode, hasil, export       | Kuesioner aktif sesuai target role              |              |        |             |         |
| ADM-UAT-028 | Integrasi      | P1        | INT-001..010         | Konsistensi data lintas modul (user, periode, kelas, lab)        | Tidak ada mismatch data antar modul             |              |        |             |         |
| ADM-UAT-029 | Non-fungsional | P2        | NF-\*                | Uji performa list besar, upload/download, kompatibilitas browser | Sistem stabil pada beban normal                 |              |        |             |         |
| ADM-UAT-030 | Otorisasi      | P1        | AUTH-010/011         | Uji route private dan permission boundary                        | Akses ditolak jika tanpa hak                    |              |        |             |         |
| ADM-UAT-031 | Keamanan       | P1        | AUTH-013/014         | Uji session expired dan multi-tab consistency                    | Session aman dan konsisten                      |              |        |             |         |
| ADM-UAT-032 | Audit          | P2        | USER-010             | Audit trail perubahan data penting                               | Aktivitas kritikal tercatat                     |              |        |             |         |
| ADM-UAT-033 | Umum           | P2        | Umum-3/4             | Edit profil dan ubah password                                    | Data akun pribadi tersimpan                     |              |        |             |         |
| ADM-UAT-034 | Umum           | P2        | Umum-8               | Logout                                                           | Session berakhir dan redirect login             |              |        |             |         |

Catatan: setiap baris UAT dapat dipecah lagi menjadi script langkah detail (Given-When-Then) pada lampiran eksekusi harian.

---

## 5) Rekap Role Admin

| Total Kasus | PASS | FAIL | BLOCKED | Persentase Kelulusan |
| ----------: | ---: | ---: | ------: | -------------------: |
|          34 |      |      |         |                      |

---

## 6) Isu dan Tindak Lanjut

| No  | ID UAT | Ringkasan Isu | Severity | PIC | Target Fix | Status |
| --- | ------ | ------------- | -------- | --- | ---------- | ------ |
| 1   |        |               |          |     |            |        |

---

## 7) Sign-Off Admin

- Nama Penguji:
- Keputusan: Diterima / Diterima dengan Catatan / Ditolak Sementara
- Tanggal:
- Tanda Tangan:
