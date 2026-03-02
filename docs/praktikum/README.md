# Modul Praktikum — Dokumentasi Diagram

Folder ini berisi diagram **Use Case** dan **Sequence** untuk modul **Praktikum** dalam sistem SiLab.

---

## Struktur Folder

```
docs/praktikum/
├── usecase/
│   └── UC_PRAKTIKUM.puml       # Diagram use case (16 UCs)
└── sequence/
    ├── SEQ_01_MENGELOLA_PRAKTIKUM.puml
    ├── SEQ_02_MELIHAT_PRAKTIKUM.puml
    ├── SEQ_03_MENGELOLA_PERTEMUAN.puml
    ├── SEQ_04_MENGELOLA_MODUL.puml
    ├── SEQ_05_MENGAKSES_MODUL.puml
    ├── SEQ_06_MENGELOLA_PRAKTIKAN.puml
    ├── SEQ_07_MENGELOLA_ASLAB.puml
    ├── SEQ_08_MENGELOLA_TUGAS.puml
    ├── SEQ_09_MENGELOLA_RUBRIK.puml
    ├── SEQ_10_MENGELOLA_PENILAIAN.puml
    ├── SEQ_11_MENGUMPULKAN_TUGAS.puml
    ├── SEQ_12_MENGELOLA_ABSENSI.puml
    ├── SEQ_13_MENGELOLA_SERTIFIKAT.puml
    ├── SEQ_14_MELIHAT_TUGAS.puml
    ├── SEQ_15_RIWAYAT_PENGUMPULAN.puml
    └── SEQ_16_MELIHAT_SERTIFIKAT.puml
```

---

## Use Case Overview

| UC   | Nama Use Case                  | Aktor              | Controller Utama              |
| ---- | ------------------------------ | ------------------ | ----------------------------- |
| UC01 | Mengelola Praktikum            | Admin              | PraktikumController           |
| UC02 | Melihat Daftar Praktikum       | Asisten, Praktikan | PraktikumController           |
| UC03 | Mengelola Pertemuan            | Admin, Asisten     | PertemuanPraktikumController  |
| UC04 | Mengelola Modul Praktikum      | Admin, Asisten     | ModulPraktikumController      |
| UC05 | Mengakses Modul Praktikum      | Praktikan          | ModulPraktikumController      |
| UC06 | Mengelola Praktikan            | Admin, Asisten     | PraktikanController           |
| UC07 | Mengelola Aslab                | Admin, Asisten     | AslabPraktikumController      |
| UC08 | Mengelola Tugas Praktikum      | Admin, Asisten     | TugasPraktikumController      |
| UC09 | Mengelola Komponen Rubrik      | Admin, Asisten     | KomponenRubrikController      |
| UC10 | Mengelola Penilaian Tugas      | Admin, Asisten     | PengumpulanTugasController    |
| UC11 | Mengumpulkan Tugas             | Praktikan          | PengumpulanTugasController    |
| UC12 | Mengelola Absensi Praktikum    | Admin, Asisten     | PraktikumAbsensiController    |
| UC13 | Mengelola Sertifikat Praktikum | Admin, Asisten     | PraktikumSertifikatController |
| UC14 | Melihat Tugas & Detail Tugas   | Praktikan          | PraktikanController           |
| UC15 | Melihat Riwayat Pengumpulan    | Praktikan          | PraktikanController           |
| UC16 | Melihat Sertifikat Sendiri     | Praktikan          | SertifikatController          |

---

## Sequence Diagram — Isi Skenario

| File Sequence | Skenario                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| SEQ_01        | A: Lihat daftar · B: Tambah · C: Edit · D: Hapus                                                  |
| SEQ_02        | A: Lihat daftar (Asisten/Praktikan) · B: Lihat detail                                             |
| SEQ_03        | A–D: CRUD · E: Export absensi Excel                                                               |
| SEQ_04        | A–D: CRUD · E: Toggle share link / hash publik                                                    |
| SEQ_05        | A: Lihat modul (login) · B: Akses via URL hash publik                                             |
| SEQ_06        | A: Lihat · B: Tambah existing user · C: Import Excel · D: Assign kelas · E: Hapus                 |
| SEQ_07        | A: Lihat · B: Assign aslab (cek duplikat + konflik praktikan) · C: Hapus                          |
| SEQ_08        | A–D: CRUD · E: Download/view file lampiran                                                        |
| SEQ_09        | A–D: CRUD · E: Atur urutan (drag-drop) · F: Nilai tambahan                                        |
| SEQ_10        | A: Lihat submissions · B: Nilai manual · C: Per rubrik · D: Matrix · E: Reject · F: Export/Import |
| SEQ_11        | A: Lihat tugas · B: Kumpulkan (file+link) · C: Batalkan                                           |
| SEQ_12        | A: Buka form · B: Simpan absensi praktikan (bulk) · C: Simpan absensi aslab (bulk)                |
| SEQ_13        | A: Lihat · B: Upload template .docx · C: Generate (loop per user via CertificateService)          |
| SEQ_14        | A: Lihat semua tugas · B: Lihat detail tugas + rubrik · C: Lihat tugas per praktikum              |
| SEQ_15        | A: Lihat riwayat semua pengumpulan · B: Lihat detail nilai + breakdown rubrik                     |
| SEQ_16        | A: Lihat daftar sertifikat sendiri · B: Download sertifikat                                       |

---

## Matriks Akses Aktor

| Fitur                       | Admin | Asisten | Praktikan |
| --------------------------- | :---: | :-----: | :-------: |
| CRUD Praktikum              |  ✅   |   ❌    |    ❌     |
| Lihat Praktikum             |  ✅   |   ✅    |    ✅     |
| CRUD Pertemuan + Export     |  ✅   |   ✅    |    ❌     |
| CRUD Modul + Share Link     |  ✅   |   ✅    |    ❌     |
| Akses / Lihat Modul         |  ✅   |   ✅    |    ✅     |
| Mengelola Praktikan         |  ✅   |  ✅\*   |    ❌     |
| Import Praktikan (Excel)    |  ✅   |  ✅\*   |    ❌     |
| Mengelola Aslab             |  ✅   |  ✅\*   |    ❌     |
| CRUD Tugas                  |  ✅   |   ✅    |    ❌     |
| Melihat Detail Tugas        |  ✅   |   ✅    |    ✅     |
| CRUD Rubrik                 |  ✅   |   ✅    |    ❌     |
| Menilai Tugas (Penilaian)   |  ✅   |   ✅    |    ❌     |
| Mengumpulkan Tugas          |  ❌   |   ❌    |    ✅     |
| Melihat Riwayat Pengumpulan |  ❌   |   ❌    |    ✅     |
| Mengelola Absensi           |  ✅   |   ✅    |    ❌     |
| Generate Sertifikat         |  ✅   |   ✅    |    ❌     |
| Melihat Sertifikat Sendiri  |  ✅   |   ✅    |    ✅     |

> \*Asisten terbatas pada praktikum tempat mereka di-assign sebagai aslab.

---

## Middleware & Authorization

```
Route Group:
  auth:sanctum → CheckLabAccess → [per route]

Lihat data      : can('viewAny', Praktikum::class)
Manipulasi      : active.kepengurusan:praktikum + can('create'/'update'/'delete')
Praktikan       : role:praktikan + can('submit', TugasPraktikum)
Akses modul     : can('view', ModulPraktikum) — bisa via hash publik (tanpa auth)
Sertifikat saya : auth:sanctum (semua role)
```

---

## Cara Render Diagram

Gunakan salah satu:

- **VS Code**: extension [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) + `Alt+D`
- **Online**: [plantuml.com](https://www.plantuml.com/plantuml/uml/) atau [kroki.io](https://kroki.io)
- **CLI**: `java -jar plantuml.jar docs/praktikum/sequence/*.puml`

Folder ini berisi diagram **Use Case** dan **Sequence** untuk modul **Praktikum** dalam sistem SiLab.

---

## Struktur Folder

```
docs/praktikum/
├── usecase/
│   └── UC_PRAKTIKUM.puml       # Diagram use case lengkap
└── sequence/
    ├── SEQ_01_MENGELOLA_PRAKTIKUM.puml
    ├── SEQ_02_MELIHAT_PRAKTIKUM.puml
    ├── SEQ_03_MENGELOLA_PERTEMUAN.puml
    ├── SEQ_04_MENGELOLA_MODUL.puml
    ├── SEQ_05_MENGAKSES_MODUL.puml
    ├── SEQ_06_MENGELOLA_PRAKTIKAN.puml
    ├── SEQ_07_MENGELOLA_ASLAB.puml
    ├── SEQ_08_MENGELOLA_TUGAS.puml
    ├── SEQ_09_MENGELOLA_RUBRIK.puml
    ├── SEQ_10_MENGELOLA_PENILAIAN.puml
    ├── SEQ_11_MENGUMPULKAN_TUGAS.puml
    ├── SEQ_12_MENGELOLA_ABSENSI.puml
    └── SEQ_13_MENGELOLA_SERTIFIKAT.puml
```

---

## Use Case Overview

| UC   | Nama Use Case             | Aktor              | Controller Utama              |
| ---- | ------------------------- | ------------------ | ----------------------------- |
| UC01 | Mengelola Praktikum       | Admin              | PraktikumController           |
| UC02 | Melihat Daftar Praktikum  | Asisten, Praktikan | PraktikumController           |
| UC03 | Mengelola Pertemuan       | Admin, Asisten     | PertemuanPraktikumController  |
| UC04 | Mengelola Modul Praktikum | Admin, Asisten     | ModulPraktikumController      |
| UC05 | Mengakses Modul Praktikum | Praktikan          | ModulPraktikumController      |
| UC06 | Mengelola Praktikan       | Admin, Asisten     | PraktikanController           |
| UC07 | Mengelola Aslab           | Admin, Asisten     | AslabPraktikumController      |
| UC08 | Mengelola Tugas Praktikum | Admin, Asisten     | TugasPraktikumController      |
| UC09 | Mengelola Komponen Rubrik | Admin, Asisten     | KomponenRubrikController      |
| UC10 | Mengelola Penilaian Tugas | Admin, Asisten     | PengumpulanTugasController    |
| UC11 | Mengumpulkan Tugas        | Praktikan          | PengumpulanTugasController    |
| UC12 | Mengelola Absensi         | Admin, Asisten     | PraktikumAbsensiController    |
| UC13 | Mengelola Sertifikat      | Admin, Asisten     | PraktikumSertifikatController |

---

## Sequence Diagram — Isi Skenario

| File Sequence | Skenario                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| SEQ_01        | A: Lihat daftar · B: Tambah · C: Edit · D: Hapus                                                  |
| SEQ_02        | A: Asisten lihat daftar · B: Lihat detail                                                         |
| SEQ_03        | A: Lihat · B: Tambah · C: Edit · D: Hapus · E: Export absensi Excel                               |
| SEQ_04        | A: Lihat · B: Upload · C: Edit · D: Hapus · E: Toggle share link                                  |
| SEQ_05        | A: Praktikan lihat modul (login) · B: Akses via hash publik                                       |
| SEQ_06        | A: Lihat · B: Tambah existing user · C: Import Excel · D: Assign kelas · E: Hapus                 |
| SEQ_07        | A: Lihat · B: Tambah (cek duplikat + konflik praktikan) · C: Hapus                                |
| SEQ_08        | A: Lihat · B: Tambah · C: Edit · D: Hapus · E: Download/view file                                 |
| SEQ_09        | A: Lihat · B: Tambah (bobot ≤ 100%) · C: Edit · D: Hapus · E: Urutan · F: Nilai tambahan          |
| SEQ_10        | A: Lihat submissions · B: Nilai manual · C: Per rubrik · D: Matrix · E: Reject · F: Export/Import |
| SEQ_11        | A: Lihat daftar tugas · B: Kumpulkan (file+link) · C: Batalkan                                    |
| SEQ_12        | A: Lihat form · B: Simpan absensi praktikan (bulk) · C: Simpan absensi aslab (bulk)               |
| SEQ_13        | A: Lihat halaman · B: Upload template .docx · C: Generate sertifikat (loop per user)              |

---

## Matriks Akses Aktor

| Fitur                   | Admin | Asisten | Praktikan |
| ----------------------- | :---: | :-----: | :-------: |
| CRUD Praktikum          |  ✅   |   ❌    |    ❌     |
| Lihat Praktikum         |  ✅   |   ✅    |    ✅     |
| CRUD Pertemuan          |  ✅   |   ✅    |    ❌     |
| CRUD Modul              |  ✅   |   ✅    |    ❌     |
| Akses / Lihat Modul     |  ✅   |   ✅    |    ✅     |
| Toggle Share Link Modul |  ✅   |   ✅    |    ❌     |
| CRUD Praktikan          |  ✅   |  ✅\*   |    ❌     |
| Import Praktikan        |  ✅   |  ✅\*   |    ❌     |
| CRUD Aslab              |  ✅   |  ✅\*   |    ❌     |
| CRUD Tugas              |  ✅   |   ✅    |    ❌     |
| CRUD Rubrik             |  ✅   |   ✅    |    ❌     |
| Penilaian Tugas         |  ✅   |   ✅    |    ❌     |
| Kumpulkan Tugas         |  ❌   |   ❌    |    ✅     |
| Absensi                 |  ✅   |   ✅    |    ❌     |
| Sertifikat              |  ✅   |   ✅    |    ❌     |

> \*Asisten terbatas pada praktikum tempatnya di-assign sebagai aslab.

---

## Middleware & Authorization

```
Route Group:
  auth:sanctum → CheckLabAccess → [per route]

Lihat data  : can('viewAny', Praktikum::class)
Manipulasi  : active.kepengurusan:praktikum + can('create'/'update'/'delete')
Praktikan   : role:praktikan + can('submit', TugasPraktikum)
Akses modul : can('view', ModulPraktikum) — bisa via hash publik (tanpa auth)
```

---

## Cara Render Diagram

Gunakan salah satu:

- **VS Code**: extension [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) + `Alt+D`
- **Online**: [plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml/) atau [kroki.io](https://kroki.io)
- **CLI**: `java -jar plantuml.jar docs/praktikum/sequence/*.puml`
