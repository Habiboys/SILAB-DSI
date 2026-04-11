# DRAFT FORM UAT MULTI-ROLE SILAB (MASTER)

Dokumen ini adalah master overview UAT multi-role yang merujuk ke file UAT detail per role berdasarkan daftar fungsional SILAB.

---

## 1. Referensi Fungsional

1. Daftar fungsional sistem detail per modul dan role.
2. Rangkuman fungsional per role (Admin, Asisten, Dosen, Kadep, Praktikan).
3. Inventori item uji komprehensif (AUTH, PRAK, KEG, PIK, KEU, INV, SUR, KUES, INT, NF).

---

## 2. Dokumen UAT Detail per Role

1. Praktikan: [docs/uat/UAT_ROLE_PRAKTIKAN.md](docs/uat/UAT_ROLE_PRAKTIKAN.md)
2. Asisten: [docs/uat/UAT_ROLE_ASISTEN.md](docs/uat/UAT_ROLE_ASISTEN.md)
3. Dosen: [docs/uat/UAT_ROLE_DOSEN.md](docs/uat/UAT_ROLE_DOSEN.md)
4. Kepala Departemen: [docs/uat/UAT_ROLE_KEPALA_DEPARTEMEN.md](docs/uat/UAT_ROLE_KEPALA_DEPARTEMEN.md)
5. Admin: [docs/uat/UAT_ROLE_ADMIN.md](docs/uat/UAT_ROLE_ADMIN.md)
6. Bendahara: [docs/uat/UAT_ROLE_BENDAHARA.md](docs/uat/UAT_ROLE_BENDAHARA.md)

---

## 3. Rekap Cakupan Test Case per Role (Versi Detail)

| Role              | Jumlah Test Case Detail |
| ----------------- | ----------------------: |
| Praktikan         |                      29 |
| Asisten           |                      33 |
| Dosen             |                      22 |
| Kepala Departemen |                      24 |
| Admin             |                      34 |
| Bendahara         |                      20 |
| **Total**         |                 **162** |

---

## 4. Format Rekap Eksekusi UAT Proyek

| Role              | PASS | FAIL | BLOCKED | Persentase Kelulusan |
| ----------------- | ---: | ---: | ------: | -------------------: |
| Praktikan         |      |      |         |                      |
| Asisten           |      |      |         |                      |
| Dosen             |      |      |         |                      |
| Kepala Departemen |      |      |         |                      |
| Admin             |      |      |         |                      |
| Bendahara         |      |      |         |                      |
| **Total**         |      |      |         |                      |

$$
	ext{Persentase Kelulusan} = \frac{\text{PASS}}{\text{Total Kasus} - \text{BLOCKED}} \times 100\%
$$

---

## 5. Tabel Temuan Global dan Tindak Lanjut

| No  | Role | ID UAT | Ringkasan Temuan | Severity (Low/Med/High/Critical) | PIC | Target Perbaikan | Status |
| --- | ---- | ------ | ---------------- | -------------------------------- | --- | ---------------- | ------ |
| 1   |      |        |                  |                                  |     |                  |        |

---

## 6. Sign-Off UAT Proyek

### 6.1 Pihak Pengguna

- Nama:
- Role:
- Tanda tangan:
- Tanggal:
- Keputusan: Diterima / Diterima dengan Catatan / Ditolak Sementara

### 6.2 Pihak Pengembang

- Nama:
- Jabatan:
- Tanda tangan:
- Tanggal:

---

## 7. Versi Dokumen

| Versi | Tanggal    | Penyusun  | Perubahan                                                           |
| ----- | ---------- | --------- | ------------------------------------------------------------------- |
| 0.2   | 2026-04-10 | Tim SILAB | Upgrade ke master UAT detail per role + rekap cakupan 162 test case |
