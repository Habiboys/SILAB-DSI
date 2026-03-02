# Modul Piket — Dokumentasi Diagram

Folder ini berisi diagram **Use Case** dan **Sequence** untuk modul **Piket** dalam sistem SiLab.

---

## Struktur Folder

```
docs/piket/
├── usecase/
│   └── UC_PIKET.puml                       # Diagram use case (6 UCs)
└── sequence/
    ├── SEQ_01_MENGELOLA_PERIODE_PIKET.puml
    ├── SEQ_02_MENGELOLA_JADWAL_PIKET.puml
    ├── SEQ_03_MENGELOLA_ABSENSI_PIKET.puml
    ├── SEQ_04_MENGAJUKAN_GANTI_JADWAL.puml
    ├── SEQ_05_MENYETUJUI_GANTI_JADWAL.puml
    └── SEQ_06_MELIHAT_REKAP_ABSENSI.puml
```

---

## Use Case Overview

| UC   | Nama Use Case                           | Aktor        | Controller Utama           |
| ---- | --------------------------------------- | ------------ | -------------------------- |
| UC01 | Mengelola Periode Piket (CRUD + Toggle) | Admin        | PeriodePiketController     |
| UC02 | Mengelola Jadwal Piket (Assign + Hapus) | Admin        | JadwalPiketController      |
| UC03 | Mengelola Absensi Piket (Check-in/out)  | Admin        | AbsensiController          |
| UC04 | Mengajukan Ganti Jadwal (Request)       | Asisten      | GantiJadwalPiketController |
| UC05 | Menyetujui / Menolak Ganti Jadwal       | Admin        | GantiJadwalPiketController |
| UC06 | Melihat Rekap Absensi                   | Admin, Kadep | AbsensiController          |

---

## Sequence Diagram — Isi Skenario

| File Sequence | Skenario                                                                        |
| ------------- | ------------------------------------------------------------------------------- |
| SEQ_01        | A: Lihat daftar · B: Tambah periode · C: Edit / toggle aktif · D: Hapus periode |
| SEQ_02        | A: Lihat jadwal (matriks hari × asisten) · B: Assign asisten · C: Hapus jadwal  |
| SEQ_03        | A: Lihat daftar absensi · B: Input check-in · C: Input check-out                |
| SEQ_04        | A: Lihat riwayat permintaan · B: Submit permintaan ganti jadwal                 |
| SEQ_05        | A: Lihat dashboard permintaan (admin) · B: Approve / reject permintaan          |
| SEQ_06        | A: Lihat rekap absensi per asisten · B: Lihat riwayat detail asisten            |

---

## Matriks Akses Aktor

| Fitur                                | Admin | Asisten | Kadep |
| ------------------------------------ | :---: | :-----: | :---: |
| CRUD Periode Piket                   |  ✅   |   ❌    |  ❌   |
| Assign / Hapus Jadwal Piket          |  ✅   |   ❌    |  ❌   |
| Input Absensi (Check-in / Check-out) |  ✅   |   ❌    |  ❌   |
| Mengajukan Ganti Jadwal              |  ❌   |   ✅    |  ❌   |
| Approve / Reject Ganti Jadwal        |  ✅   |   ❌    |  ❌   |
| Melihat Rekap Absensi                |  ✅   |   ❌    |  ✅   |

---

## Middleware & Authorization

```
Route Group: prefix('piket')->name('piket.')
  auth:sanctum → per route

GET  /piket/jadwal               can('viewAny', JadwalPiket)
GET  /piket/absensi              can('viewAny', Absensi)
POST /piket/jadwal               active.kepengurusan:piket + can('create', JadwalPiket)
DELETE /piket/jadwal/{id}        active.kepengurusan:piket + can('delete', jadwalPiket)
POST /piket/periode-piket        active.kepengurusan:piket
PUT  /piket/periode-piket/{id}   active.kepengurusan:piket
DELETE /piket/periode-piket/{id} active.kepengurusan:piket
POST /piket/absensi/simpan       active.kepengurusan:piket
POST /piket/absensi/checkout     active.kepengurusan:piket
GET  /piket/ganti-jadwal         tanpa middleware tambahan (asisten boleh akses)
POST /piket/ganti-jadwal         tanpa middleware tambahan
GET  /piket/ganti-jadwal/admin   active.kepengurusan:piket
POST /piket/ganti-jadwal/{id}/approve  active.kepengurusan:piket
```

---

## Cara Render Diagram

Gunakan salah satu:

- **VS Code**: extension [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) + `Alt+D`
- **Online**: [plantuml.com](https://www.plantuml.com/plantuml/uml/) atau [kroki.io](https://kroki.io)
- **CLI**: `java -jar plantuml.jar docs/piket/sequence/*.puml`
