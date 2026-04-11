# FORM UAT ROLE KEPALA DEPARTEMEN (KADEP) — SILAB (DETAIL)

## 1) Identitas Pengujian

- Nama Penguji:
- NIP:
- Jabatan:
- Unit:
- Periode:
- Tanggal Uji:
- Browser/Perangkat:

---

## 2) Tujuan UAT Role Kadep

Memastikan role Kepala Departemen dapat melakukan monitoring strategis, approval lintas modul, serta validasi laporan manajerial.

---

## 3) Prasyarat Data

- Akun Kadep aktif.
- Tersedia data approval: proker, kegiatan, LPJ final.
- Tersedia data keuangan, inventaris, piket, surat, dan kuesioner periode aktif.
- Tersedia data kepengurusan/struktur untuk uji monitoring organisasi.

---

## 4) Daftar Test Case UAT Kadep

| ID UAT      | Modul        | Prioritas | Referensi Fungsional | Skenario Uji                                        | Hasil Diharapkan                         | Hasil Aktual | Status | Nilai (1-5) | Catatan |
| ----------- | ------------ | --------- | -------------------- | --------------------------------------------------- | ---------------------------------------- | ------------ | ------ | ----------- | ------- |
| KDP-UAT-001 | Auth         | P1        | Umum-1               | Login valid kadep                                   | Dashboard kadep tampil                   |              |        |             |         |
| KDP-UAT-002 | Monitoring   | P1        | Kadep-A              | Lihat dashboard inventaris                          | Ringkasan aset/kondisi akurat            |              |        |             |         |
| KDP-UAT-003 | Monitoring   | P1        | Kadep-A              | Lihat dashboard keuangan                            | Saldo, pemasukan, pengeluaran konsisten  |              |        |             |         |
| KDP-UAT-004 | Monitoring   | P1        | Kadep-A              | Lihat dashboard praktikum                           | Statistik kelas/tugas/nilai tampil benar |              |        |             |         |
| KDP-UAT-005 | Monitoring   | P2        | Kadep-A              | Lihat dashboard piket                               | Rekap kehadiran asisten tampil           |              |        |             |         |
| KDP-UAT-006 | Monitoring   | P2        | Kadep-A              | Lihat dashboard surat/kuesioner                     | Ringkasan surat dan hasil survey terbaca |              |        |             |         |
| KDP-UAT-007 | Proker       | P1        | Kadep-B-1/4          | Review dan approve proker                           | Status proker approved + jejak audit     |              |        |             |         |
| KDP-UAT-008 | Proker       | P1        | Kadep-B-1/5          | Review dan reject proker                            | Status rejected + alasan tercatat        |              |        |             |         |
| KDP-UAT-009 | Kegiatan     | P1        | Kadep-B-2/6          | Review dan approve kegiatan                         | Status kegiatan approved                 |              |        |             |         |
| KDP-UAT-010 | Kegiatan     | P1        | Kadep-B-2/7          | Review dan reject kegiatan                          | Status kegiatan rejected + alasan        |              |        |             |         |
| KDP-UAT-011 | LPJ          | P1        | Kadep-B-8/9          | Lihat dan approve LPJ final                         | LPJ berpindah ke status approved         |              |        |             |         |
| KDP-UAT-012 | LPJ          | P1        | Kadep-B-10           | Lock LPJ final                                      | LPJ terkunci dan tidak bisa diubah       |              |        |             |         |
| KDP-UAT-013 | LPJ          | P2        | Kadep-B-11           | Export PDF LPJ final                                | PDF valid dan dapat dibuka               |              |        |             |         |
| KDP-UAT-014 | Keuangan     | P1        | Kadep-A-keu          | Lihat riwayat transaksi                             | Riwayat pemasukan/pengeluaran lengkap    |              |        |             |         |
| KDP-UAT-015 | Keuangan     | P2        | Kadep-A-keu          | Filter laporan keuangan bulanan                     | Data sesuai bulan/periode                |              |        |             |         |
| KDP-UAT-016 | Keuangan     | P2        | KEU-export           | Export laporan keuangan                             | File export berhasil                     |              |        |             |         |
| KDP-UAT-017 | Inventaris   | P2        | Kadep-A-inv          | Lihat daftar aset dan kondisi                       | Data kondisi dan status akurat           |              |        |             |         |
| KDP-UAT-018 | Piket        | P2        | Kadep-A-pik          | Lihat jadwal & rekap absensi piket                  | Jadwal dan rekap sesuai data aktual      |              |        |             |         |
| KDP-UAT-019 | Surat        | P2        | Kadep-surat          | Lihat surat masuk/keluar/disposisi                  | Status surat dan disposisi terbaca       |              |        |             |         |
| KDP-UAT-020 | Kepengurusan | P2        | Kadep-kep            | Lihat periode dan struktur jabatan                  | Data struktur aktif tampil benar         |              |        |             |         |
| KDP-UAT-021 | Kuesioner    | P3        | Kadep-kues           | Lihat hasil/statistik kuesioner                     | Statistik dapat dibaca untuk keputusan   |              |        |             |         |
| KDP-UAT-022 | Otorisasi    | P1        | Auth-role            | Coba akses aksi teknis admin (CRUD master sensitif) | Akses ditolak sesuai role                |              |        |             |         |
| KDP-UAT-023 | Umum         | P2        | Umum-4               | Ubah password                                       | Password berhasil diperbarui             |              |        |             |         |
| KDP-UAT-024 | Umum         | P2        | Umum-8               | Logout                                              | Session berakhir normal                  |              |        |             |         |

---

## 5) Rekap Role Kadep

| Total Kasus | PASS | FAIL | BLOCKED | Persentase Kelulusan |
| ----------: | ---: | ---: | ------: | -------------------: |
|          24 |      |      |         |                      |

---

## 6) Isu dan Tindak Lanjut

| No  | ID UAT | Ringkasan Isu | Severity | PIC | Target Fix | Status |
| --- | ------ | ------------- | -------- | --- | ---------- | ------ |
| 1   |        |               |          |     |            |        |

---

## 7) Sign-Off Kadep

- Nama Penguji:
- Keputusan: Diterima / Diterima dengan Catatan / Ditolak Sementara
- Tanggal:
- Tanda Tangan:
