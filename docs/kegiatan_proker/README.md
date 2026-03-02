# Modul Kegiatan, Proker & Kepengurusan

Dokumentasi diagram untuk modul **Kegiatan, Proker, dan Kepengurusan** pada sistem SILAB.

---

## Use Case

| File                                                               | Deskripsi                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| [usecase/UC_KEGIATAN_PROKER.puml](usecase/UC_KEGIATAN_PROKER.puml) | Use case diagram modul Kegiatan, Proker & Kepengurusan |

**Use Cases:**
| ID | Nama | Aktor |
|----|------|-------|
| UC01 | Mengelola Proker | Admin |
| UC02 | Parameter Penilaian Proker | Admin |
| UC03 | Dokumentasi Proker | Admin, Asisten |
| UC04 | Ajukan & Evaluasi Proker | Admin, Asisten |
| UC05 | Menyetujui / Menolak Proker | Admin, Kadep |
| UC06 | Mengelola Kegiatan | Admin, Asisten |
| UC07 | Laporan & Dokumentasi Kegiatan | Admin, Asisten |
| UC08 | Mengelola Peserta Kegiatan | Admin, Asisten |
| UC09 | Sertifikat Kegiatan | Admin |
| UC10 | Menyetujui / Menolak Kegiatan | Admin |
| UC11 | Melihat Kalender Kegiatan | Admin, Asisten, Kadep |
| UC12 | Mengelola Kepengurusan | Admin |
| UC13 | Mengelola Anggota | Admin |

---

## Sequence Diagrams

| File                                                                                                   | Use Case | Skenario                                                                                                       |
| ------------------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| [sequence/SEQ_01_MENGELOLA_PROKER.puml](sequence/SEQ_01_MENGELOLA_PROKER.puml)                         | UC01     | A: Lihat, B: Tambah, C: Edit, D: Hapus                                                                         |
| [sequence/SEQ_02_PARAMETER_PENILAIAN_PROKER.puml](sequence/SEQ_02_PARAMETER_PENILAIAN_PROKER.puml)     | UC02     | A: Tambah, B: Edit, C: Update Capaian, D: Hapus                                                                |
| [sequence/SEQ_03_DOKUMENTASI_PROKER.puml](sequence/SEQ_03_DOKUMENTASI_PROKER.puml)                     | UC03     | A: Upload, B: Download, C: Hapus                                                                               |
| [sequence/SEQ_04_AJUKAN_EVALUASI_PROKER.puml](sequence/SEQ_04_AJUKAN_EVALUASI_PROKER.puml)             | UC04     | A: Ajukan (draft→diajukan), B: Simpan Evaluasi                                                                 |
| [sequence/SEQ_05_MENYETUJUI_PROKER.puml](sequence/SEQ_05_MENYETUJUI_PROKER.puml)                       | UC05     | A: Lihat pending, B: Setujui, C: Tolak                                                                         |
| [sequence/SEQ_06_MENGELOLA_KEGIATAN.puml](sequence/SEQ_06_MENGELOLA_KEGIATAN.puml)                     | UC06     | A: Lihat, B: Tambah (+lab security check), C: Edit, D: Hapus                                                   |
| [sequence/SEQ_07_LAPORAN_DOKUMENTASI_KEGIATAN.puml](sequence/SEQ_07_LAPORAN_DOKUMENTASI_KEGIATAN.puml) | UC07     | A: Upload LPJ, B: Download LPJ, C: Hapus LPJ, D: Upload Dok, E: Download Dok, F: Hapus Dok                     |
| [sequence/SEQ_08_PESERTA_KEGIATAN.puml](sequence/SEQ_08_PESERTA_KEGIATAN.puml)                         | UC08     | A: Lihat, B: Tambah, C: Hapus                                                                                  |
| [sequence/SEQ_09_SERTIFIKAT_KEGIATAN.puml](sequence/SEQ_09_SERTIFIKAT_KEGIATAN.puml)                   | UC09     | A: Buka halaman, B: Upload template .docx, C: Generate sertifikat                                              |
| [sequence/SEQ_10_MENYETUJUI_KEGIATAN.puml](sequence/SEQ_10_MENYETUJUI_KEGIATAN.puml)                   | UC10     | A: Lihat pending, B: Setujui, C: Tolak                                                                         |
| [sequence/SEQ_11_KALENDER_KEGIATAN.puml](sequence/SEQ_11_KALENDER_KEGIATAN.puml)                       | UC11     | A: Buka kalender, B: Fetch JSON events (FullCalendar), C: Klik event                                           |
| [sequence/SEQ_12_MENGELOLA_KEPENGURUSAN.puml](sequence/SEQ_12_MENGELOLA_KEPENGURUSAN.puml)             | UC12     | A: Lihat tahun, B: Tambah tahun, C: Edit tahun, D: Lihat keplab, E: Buat periode, F: Update SK, G: Download SK |
| [sequence/SEQ_13_MENGELOLA_ANGGOTA.puml](sequence/SEQ_13_MENGELOLA_ANGGOTA.puml)                       | UC13     | A: Lihat, B: Tambah (+jabatan tunggal check), C: Edit, D: Hapus, E: Transfer dari periode lama                 |

---

## Matriks Akses

| Fitur                              | Admin | Asisten | Kadep |
| ---------------------------------- | :---: | :-----: | :---: |
| CRUD Proker                        |  ✅   |    —    |   —   |
| Parameter penilaian proker         |  ✅   |    —    |   —   |
| Upload dokumentasi proker          |  ✅   |   ✅    |   —   |
| Ajukan proker                      |  ✅   |    —    |   —   |
| Evaluasi proker                    |  ✅   |   ✅    |   —   |
| Setujui / Tolak proker             |  ✅   |    —    |  ✅   |
| CRUD Kegiatan                      |  ✅   |   ✅    |   —   |
| Upload LPJ & dokumentasi kegiatan  |  ✅   |   ✅    |   —   |
| Kelola peserta kegiatan            |  ✅   |   ✅    |   —   |
| Sertifikat kegiatan                |  ✅   |    —    |   —   |
| Setujui / Tolak kegiatan           |  ✅   |    —    |   —   |
| Lihat kalender kegiatan            |  ✅   |   ✅    |  ✅   |
| Mengelola tahun kepengurusan       |  ✅   |    —    |   —   |
| Mengelola periode kepengurusan lab |  ✅   |    —    |   —   |
| CRUD anggota                       |  ✅   |    —    |   —   |
| Transfer anggota antar periode     |  ✅   |    —    |   —   |

---

## Middleware & Policy

| Route Pattern                             | Middleware / Policy                                            |
| ----------------------------------------- | -------------------------------------------------------------- |
| `GET /proker`                             | `can('viewAny', Proker)`                                       |
| `POST /proker`                            | `active.kepengurusan:proker` + `can('create', Proker)`         |
| `PUT /proker/{id}`                        | `active.kepengurusan:proker` + `can('update', proker)`         |
| `DELETE /proker/{id}`                     | `active.kepengurusan:proker` + `can('delete', proker)`         |
| `POST /proker/{id}/ajukan`                | `active.kepengurusan:proker`                                   |
| `POST /proker/{id}/approve`               | `active.kepengurusan:proker`                                   |
| `PATCH /proker/{id}/evaluasi`             | `active.kepengurusan:proker` + `can('updateProgress', proker)` |
| `POST/PUT/DELETE /proker-parameter`       | `active.kepengurusan:proker`                                   |
| `POST/DELETE /proker-dokumentasi`         | `active.kepengurusan:proker` + `can('updateProgress', proker)` |
| `GET /proker-dokumentasi/{id}/download`   | `auth` (read-only, tanpa active.kepengurusan)                  |
| `GET/POST/PUT/DELETE /kegiatan`           | `auth` + lab context filter                                    |
| `POST /kegiatan/{id}/approve`             | `auth` + `can('kegiatan.approve')`                             |
| `POST /kegiatan/{id}/laporan`             | `auth` + `can('update', kegiatan)`                             |
| `POST /kegiatan/{id}/peserta`             | `auth` + `can('kegiatan.edit')`                                |
| `POST /kegiatan/{id}/template`            | `auth` + `can('kegiatan.edit')`                                |
| `POST /kegiatan/{id}/generate-sertifikat` | `auth` + `can('kegiatan.edit')`                                |
| `GET /kegiatan/kalender`                  | `auth`                                                         |
| `GET /kegiatan/calendar-data`             | `auth`                                                         |
| `POST /anggota/transfer-from-previous`    | `auth` + `can('transfer', KepengurusanUser)`                   |
| `resource /anggota`                       | `auth`                                                         |
| `resource /tahun-kepengurusan`            | `auth`                                                         |
| `resource /kepengurusan-lab`              | `auth`                                                         |

---

## Status Proker

| Status Pengajuan | Keterangan                                  |
| ---------------- | ------------------------------------------- |
| `draft`          | Baru dibuat, belum diajukan                 |
| `diajukan`       | Diajukan, menunggu persetujuan              |
| `disetujui`      | Disetujui — status reset ke `belum_mulai`   |
| `ditolak`        | Ditolak — catatan ditambahkan ke keterangan |

| Status Pelaksanaan | Keterangan             |
| ------------------ | ---------------------- |
| `belum_mulai`      | Proker belum dimulai   |
| `sedang_berjalan`  | Proker sedang berjalan |
| `selesai`          | Proker sudah selesai   |
| `ditunda`          | Proker ditunda         |

## Status Kegiatan

| Status Approval | Keterangan                         |
| --------------- | ---------------------------------- |
| `diajukan`      | Auto-set saat kegiatan dibuat      |
| `disetujui`     | Disetujui — warna biru di kalender |
| `ditolak`       | Ditolak — tidak tampil di kalender |

---

## Use Case

| File                                                               | Deskripsi                                |
| ------------------------------------------------------------------ | ---------------------------------------- |
| [usecase/UC_KEGIATAN_PROKER.puml](usecase/UC_KEGIATAN_PROKER.puml) | Use case diagram modul Kegiatan & Proker |

**Use Cases:**
| ID | Nama | Aktor |
|----|------|-------|
| UC01 | Mengelola Proker | Admin |
| UC02 | Menyetujui / Menolak Proker | Admin, Kadep |
| UC03 | Mengelola Kegiatan | Admin, Asisten |
| UC04 | Menyetujui / Menolak Kegiatan | Admin |
| UC05 | Melihat Kalender Kegiatan | Admin, Asisten, Kadep |

---

## Sequence Diagrams

| File                                                                                             | Use Case | Skenario                                                                                               |
| ------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| [sequence/SEQ_01_MENGELOLA_PROKER.puml](sequence/SEQ_01_MENGELOLA_PROKER.puml)                   | UC01     | A: Lihat, B: Tambah, C: Edit, D: Hapus, E: Parameter Penilaian, F: Dokumentasi, G: Ajukan, H: Evaluasi |
| [sequence/SEQ_02_MENYETUJUI_PROKER.puml](sequence/SEQ_02_MENYETUJUI_PROKER.puml)                 | UC02     | A: Lihat pending, B: Setujui, C: Tolak                                                                 |
| [sequence/SEQ_03_MENGELOLA_KEGIATAN.puml](sequence/SEQ_03_MENGELOLA_KEGIATAN.puml)               | UC03     | A: Lihat, B: Tambah, C: Edit, D: Hapus, E: Upload LPJ, F: Dokumentasi, G: Peserta                      |
| [sequence/SEQ_04_MENYETUJUI_KEGIATAN.puml](sequence/SEQ_04_MENYETUJUI_KEGIATAN.puml)             | UC04     | A: Lihat pending, B: Setujui, C: Tolak                                                                 |
| [sequence/SEQ_05_MELIHAT_KALENDER_KEGIATAN.puml](sequence/SEQ_05_MELIHAT_KALENDER_KEGIATAN.puml) | UC05     | A: Buka kalender, B: Fetch events JSON, C: Klik event                                                  |

---

## Matriks Akses

| Fitur                             | Admin | Asisten | Kadep |
| --------------------------------- | :---: | :-----: | :---: |
| Lihat daftar proker               |  ✅   |   ✅    |  ✅   |
| Tambah / Edit / Hapus proker      |  ✅   |    —    |   —   |
| Ajukan proker                     |  ✅   |    —    |   —   |
| Setujui / Tolak proker            |  ✅   |    —    |  ✅   |
| Kelola parameter penilaian        |  ✅   |    —    |   —   |
| Upload dokumentasi proker         |  ✅   |   ✅    |   —   |
| Simpan evaluasi proker            |  ✅   |   ✅    |   —   |
| Lihat daftar kegiatan             |  ✅   |   ✅    |  ✅   |
| Tambah / Edit / Hapus kegiatan    |  ✅   |   ✅    |   —   |
| Setujui / Tolak kegiatan          |  ✅   |    —    |   —   |
| Upload LPJ & dokumentasi kegiatan |  ✅   |   ✅    |   —   |
| Kelola peserta kegiatan           |  ✅   |   ✅    |   —   |
| Lihat kalender kegiatan           |  ✅   |   ✅    |  ✅   |

---

## Middleware & Policy

| Route Pattern                       | Middleware / Policy                                            |
| ----------------------------------- | -------------------------------------------------------------- |
| `GET /proker`                       | `can('viewAny', Proker)`                                       |
| `POST /proker`                      | `active.kepengurusan:proker` + `can('create', Proker)`         |
| `PUT /proker/{id}`                  | `active.kepengurusan:proker` + `can('update', proker)`         |
| `DELETE /proker/{id}`               | `active.kepengurusan:proker` + `can('delete', proker)`         |
| `POST /proker/{id}/ajukan`          | `active.kepengurusan:proker`                                   |
| `POST /proker/{id}/approve`         | `active.kepengurusan:proker` + `can('approve', proker)`        |
| `PATCH /proker/{id}/evaluasi`       | `active.kepengurusan:proker` + `can('updateProgress', proker)` |
| `POST/PUT/DELETE /proker-parameter` | `active.kepengurusan:proker`                                   |
| `POST/DELETE /proker-dokumentasi`   | `active.kepengurusan:proker` + `can('updateProgress', proker)` |
| `GET /kegiatan`                     | `auth` + lab context filter                                    |
| `POST /kegiatan`                    | `auth` + lab security check + `can('create', Kegiatan)`        |
| `PUT /kegiatan/{id}`                | `auth` + `can('update', kegiatan)`                             |
| `DELETE /kegiatan/{id}`             | `auth` + `can('delete', kegiatan)`                             |
| `POST /kegiatan/{id}/approve`       | `auth` + `can('kegiatan.approve')`                             |
| `GET /kegiatan/kalender`            | `auth`                                                         |
| `GET /kegiatan/calendar-data`       | `auth`                                                         |

---

## Status Proker

| Status Pengajuan | Keterangan                                            |
| ---------------- | ----------------------------------------------------- |
| `draft`          | Baru dibuat, belum diajukan                           |
| `diajukan`       | Sudah diajukan, menunggu persetujuan                  |
| `disetujui`      | Disetujui — status proker reset ke `belum_mulai`      |
| `ditolak`        | Ditolak — catatan penolakan ditambahkan ke keterangan |

| Status Pelaksanaan | Keterangan             |
| ------------------ | ---------------------- |
| `belum_mulai`      | Proker belum dimulai   |
| `sedang_berjalan`  | Proker sedang berjalan |
| `selesai`          | Proker sudah selesai   |
| `ditunda`          | Proker ditunda         |

## Status Kegiatan

| Status Approval | Keterangan                                                       |
| --------------- | ---------------------------------------------------------------- |
| `diajukan`      | Auto-set saat kegiatan dibuat, menunggu persetujuan              |
| `disetujui`     | Disetujui Admin — kegiatan tampil di kalender dengan warna hijau |
| `ditolak`       | Ditolak Admin — kegiatan tampil di kalender dengan warna kuning  |
