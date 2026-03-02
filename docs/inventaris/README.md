# Modul Inventaris — Dokumentasi Diagram

Folder ini berisi diagram **Use Case** dan **Sequence** untuk modul **Inventaris** dalam sistem SiLab.

---

## Struktur Folder

```
docs/inventaris/
├── usecase/
│   └── UC_INVENTARIS.puml          # Diagram use case (9 UCs)
└── sequence/
    ├── SEQ_01_MENGELOLA_ASET.puml
    ├── SEQ_02_MELIHAT_DAFTAR_ASET.puml
    ├── SEQ_03_SCAN_QR_PUBLIK.puml
    ├── SEQ_04_MENGELOLA_KONDISI_ASET.puml
    ├── SEQ_05_MENGELOLA_PEMINJAMAN.puml
    ├── SEQ_06_MENGELOLA_PERMOHONAN.puml
    ├── SEQ_07_MENGAJUKAN_PERMOHONAN.puml
    ├── SEQ_08_APPROVAL_PERMOHONAN_KADEP.puml
    └── SEQ_09_MENGELOLA_KATEGORI_ASET.puml
```

---

## Use Case Overview

| UC   | Nama Use Case                           | Aktor          | Controller Utama           |
| ---- | --------------------------------------- | -------------- | -------------------------- |
| UC01 | Mengelola Aset (CRUD, QR/Label, Export) | Admin          | DetailInventarisController |
| UC02 | Melihat Daftar Aset                     | Kadep, Asisten | InventarisController       |
| UC03 | Melihat Detail Aset Publik (Scan QR)    | Publik         | DetailInventarisController |
| UC04 | Mengelola Kondisi Aset                  | Admin          | DetailInventarisController |
| UC05 | Mengelola Peminjaman Aset               | Admin, Asisten | PeminjamanAsetController   |
| UC06 | Mengelola Permohonan Pengadaan          | Admin          | PermohonanAsetController   |
| UC07 | Mengajukan Permohonan Pengadaan         | Asisten        | PermohonanAsetController   |
| UC08 | Menyetujui / Menolak Permohonan         | Kadep          | PermohonanAsetController   |
| UC09 | Mengelola Kategori Aset (Data Master)   | Admin          | KategoriAsetController     |

> **Catatan:** `Publik <|-- Asisten` (generalisasi) — Asisten mewarisi kemampuan scan QR dari Publik.

---

## Sequence Diagram — Isi Skenario

| File Sequence | Skenario                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| SEQ_01        | A: Lihat · B: Tambah (auto QR + kondisi awal) · C: Edit · D: Hapus/bulk · E: Export Excel · F: QR/Label PDF |
| SEQ_02        | A: Lihat daftar (view-only) · B: Lihat detail aset                                                          |
| SEQ_03        | A: Scan QR → halaman publik detail aset (no auth)                                                           |
| SEQ_04        | A: Update kondisi (kasus 'hilang' included) · B: Lihat riwayat kondisi                                      |
| SEQ_05        | A: Lihat · B: Catat peminjaman · C: Kembalikan · D: Template surat CRUD (Admin only)                        |
| SEQ_06        | A: Lihat semua · B: Lihat detail · C: Setujui · D: Tolak · E: Hapus/bulk                                    |
| SEQ_07        | A: Ajukan permohonan baru (auto nomor REQ) · B: Lihat status sendiri                                        |
| SEQ_08        | A: Lihat semua permohonan · B: Setujui · C: Tolak                                                           |
| SEQ_09        | A: Lihat · B: Tambah · C: Edit · D: Hapus/bulk delete                                                       |

---

## Matriks Akses Aktor

| Fitur                         | Admin | Asisten | Kadep | Publik |
| ----------------------------- | :---: | :-----: | :---: | :----: |
| CRUD Aset + QR + Export       |  ✅   |   ❌    |  ❌   |   ❌   |
| Melihat Daftar Aset           |  ✅   |   ✅    |  ✅   |   ❌   |
| Scan QR / Detail Publik       | ✅\*  |  ✅\*   |  ❌   |   ✅   |
| Mengelola Kondisi Aset        |  ✅   |   ❌    |  ❌   |   ❌   |
| Catat & Kembalikan Peminjaman |  ✅   |   ✅    |  ❌   |   ❌   |
| Template Surat Peminjaman     |  ✅   |   ❌    |  ❌   |   ❌   |
| Mengelola Permohonan (full)   |  ✅   |   ❌    |  ❌   |   ❌   |
| Mengajukan Permohonan         |  ✅   |   ✅    |  ❌   |   ❌   |
| Approve / Reject Permohonan   |  ✅   |   ❌    |  ✅   |   ❌   |
| Mengelola Kategori Aset       |  ✅   |   ❌    |  ❌   |   ❌   |

> \*via generalisasi `Publik <|-- Asisten`

---

## Middleware & Authorization

```
Route Group:
  auth:sanctum → CheckLabAccess → [per route]

Lihat aset     : can('viewAny', Inventaris::class)
CRUD aset      : DetailInventarisController (otorisasi di controller/policy)
Approve/Reject : can('approve', PermohonanAset)
Kategori Aset  : role:superadmin (dipetakan ke Admin dalam diagram)
Publik (QR)    : GET /aset/{id}/detail — no auth required
```

---

## Cara Render Diagram

Gunakan salah satu:

- **VS Code**: extension [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) + `Alt+D`
- **Online**: [plantuml.com](https://www.plantuml.com/plantuml/uml/) atau [kroki.io](https://kroki.io)
- **CLI**: `java -jar plantuml.jar docs/inventaris/sequence/*.puml`
