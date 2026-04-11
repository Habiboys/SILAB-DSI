# FORM UAT ROLE BENDAHARA — SILAB (DETAIL)

## 1) Identitas Pengujian

- Nama Penguji:
- NIP/ID:
- Jabatan:
- Periode Keuangan:
- Tanggal Uji:
- Browser/Perangkat:

---

## 2) Tujuan UAT Role Bendahara

Memastikan role Bendahara dapat mengelola transaksi kas, validasi saldo, pelaporan, dan ekspor data keuangan secara akurat.

---

## 3) Prasyarat Data

- Akun Bendahara aktif.
- Nominal kas aktif sudah tersedia.
- Tersedia data kategori pemasukan/pengeluaran.
- Tersedia data transaksi historis untuk minimal 2 periode.
- Tersedia dokumen bukti transaksi contoh (upload lampiran).

---

## 4) Daftar Test Case UAT Bendahara

| ID UAT      | Modul     | Prioritas | Referensi Fungsional | Skenario Uji                            | Hasil Diharapkan                         | Hasil Aktual | Status | Nilai (1-5) | Catatan |
| ----------- | --------- | --------- | -------------------- | --------------------------------------- | ---------------------------------------- | ------------ | ------ | ----------- | ------- |
| BND-UAT-001 | Auth      | P1        | Umum-1               | Login bendahara                         | Dashboard keuangan tampil                |              |        |             |         |
| BND-UAT-002 | Keuangan  | P1        | KEU-001              | Tambah nominal kas baru                 | Nominal tersimpan                        |              |        |             |         |
| BND-UAT-003 | Keuangan  | P1        | KEU-002              | Aktivasi/nonaktivasi nominal kas        | Nominal aktif berubah sesuai aksi        |              |        |             |         |
| BND-UAT-004 | Keuangan  | P1        | KEU-003              | Input pemasukan valid                   | Saldo bertambah sesuai nominal           |              |        |             |         |
| BND-UAT-005 | Keuangan  | P1        | KEU-004              | Input pengeluaran valid                 | Saldo berkurang sesuai nominal           |              |        |             |         |
| BND-UAT-006 | Keuangan  | P1        | KEU-007              | Input nominal negatif                   | Ditolak validasi                         |              |        |             |         |
| BND-UAT-007 | Keuangan  | P1        | KEU-008              | Input pengeluaran melebihi saldo        | Ditolak atau ditandai sesuai rule sistem |              |        |             |         |
| BND-UAT-008 | Keuangan  | P1        | KEU-005              | Edit transaksi pemasukan                | Saldo dan rekap ikut diperbarui          |              |        |             |         |
| BND-UAT-009 | Keuangan  | P1        | KEU-005              | Edit transaksi pengeluaran              | Saldo dan rekap ikut diperbarui          |              |        |             |         |
| BND-UAT-010 | Keuangan  | P1        | KEU-006              | Hapus transaksi                         | Saldo rollback sesuai penghapusan        |              |        |             |         |
| BND-UAT-011 | Keuangan  | P2        | KEU-009              | Filter laporan per periode              | Data sesuai filter periode               |              |        |             |         |
| BND-UAT-012 | Keuangan  | P2        | KEU-010              | Filter laporan per kategori             | Data sesuai kategori transaksi           |              |        |             |         |
| BND-UAT-013 | Keuangan  | P2        | KEU-011              | Search transaksi                        | Hasil pencarian relevan                  |              |        |             |         |
| BND-UAT-014 | Keuangan  | P1        | KEU-014              | Validasi rekap vs detail                | Total rekap = total detail transaksi     |              |        |             |         |
| BND-UAT-015 | Keuangan  | P2        | KEU-012              | Export laporan keuangan excel/pdf       | File export valid dan dapat dibuka       |              |        |             |         |
| BND-UAT-016 | Keuangan  | P2        | Keu-detail           | Lihat detail transaksi + lampiran bukti | Lampiran dapat dibuka/diunduh            |              |        |             |         |
| BND-UAT-017 | Keuangan  | P2        | Keu-catatan          | Lihat catatan kas per periode           | Catatan mengikuti transaksi periode      |              |        |             |         |
| BND-UAT-018 | Otorisasi | P1        | Auth-role            | Coba akses fitur kepengurusan/admin     | Akses ditolak sesuai role                |              |        |             |         |
| BND-UAT-019 | Umum      | P2        | Umum-4               | Ubah password akun                      | Password baru tersimpan                  |              |        |             |         |
| BND-UAT-020 | Umum      | P2        | Umum-8               | Logout                                  | Session berakhir normal                  |              |        |             |         |

---

## 5) Rekap Role Bendahara

| Total Kasus | PASS | FAIL | BLOCKED | Persentase Kelulusan |
| ----------: | ---: | ---: | ------: | -------------------: |
|          20 |      |      |         |                      |

---

## 6) Isu dan Tindak Lanjut

| No  | ID UAT | Ringkasan Isu | Severity | PIC | Target Fix | Status |
| --- | ------ | ------------- | -------- | --- | ---------- | ------ |
| 1   |        |               |          |     |            |        |

---

## 7) Sign-Off Bendahara

- Nama Penguji:
- Keputusan: Diterima / Diterima dengan Catatan / Ditolak Sementara
- Tanggal:
- Tanda Tangan:
