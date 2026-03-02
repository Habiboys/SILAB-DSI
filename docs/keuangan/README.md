# Modul Keuangan — Dokumentasi Diagram

Folder ini berisi diagram **Use Case** dan **Sequence** untuk modul **Keuangan** dalam sistem SiLab.

---

## Struktur Folder

```
docs/keuangan/
├── usecase/
│   └── UC_KEUANGAN.puml                        # Diagram use case (4 UCs)
└── sequence/
    ├── SEQ_01_MENGELOLA_RIWAYAT_KEUANGAN.puml
    ├── SEQ_02_MENGELOLA_NOMINAL_KAS.puml
    ├── SEQ_03_MELIHAT_CATATAN_KAS.puml
    └── SEQ_04_MELIHAT_REKAP_KEUANGAN.puml
```

---

## Use Case Overview

| UC   | Nama Use Case                                      | Aktor          | Controller Utama          |
| ---- | -------------------------------------------------- | -------------- | ------------------------- |
| UC01 | Mengelola Riwayat Keuangan (CRUD + Export PDF)     | Admin          | RiwayatKeuanganController |
| UC02 | Mengelola Nominal Kas (Set, Update, Toggle, Hapus) | Admin          | RiwayatKeuanganController |
| UC03 | Melihat Catatan Kas (Matriks Pembayaran Anggota)   | Admin, Asisten | RiwayatKeuanganController |
| UC04 | Melihat Rekap Keuangan (Ringkasan Bulanan)         | Admin, Kadep   | RekapKeuanganController   |

---

## Sequence Diagram — Isi Skenario

| File Sequence | Skenario                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| SEQ_01        | A: Lihat daftar transaksi · B: Tambah transaksi · C: Edit · D: Hapus · E: Export PDF |
| SEQ_02        | A: Tambah / update nominal kas · B: Toggle status aktif · C: Hapus nominal kas       |
| SEQ_03        | A: Lihat matriks catatan kas (Anggota × Bulan-Minggu)                                |
| SEQ_04        | A: Lihat rekap keuangan bulanan + saldo berjalan + kas payment summary               |

---

## Matriks Akses Aktor

| Fitur                                     | Admin | Asisten | Kadep |
| ----------------------------------------- | :---: | :-----: | :---: |
| CRUD Riwayat Keuangan (masuk/keluar)      |  ✅   |   ❌    |  ❌   |
| Export PDF Laporan Keuangan               |  ✅   |   ❌    |  ❌   |
| Set / Update Nominal Kas                  |  ✅   |   ❌    |  ❌   |
| Toggle & Hapus Nominal Kas                |  ✅   |   ❌    |  ❌   |
| Melihat Catatan Kas (matriks kas anggota) |  ✅   |   ✅    |  ❌   |
| Melihat Rekap Keuangan Bulanan            |  ✅   |   ❌    |  ✅   |

---

## Middleware & Authorization

```
Route Group: auth:sanctum (semua route keuangan)

GET  /riwayat-keuangan          tanpa middleware tambahan
GET  /riwayat-keuangan/{id}     tanpa middleware tambahan
GET  /riwayat-keuangan/export   tanpa middleware tambahan
GET  /catatan-kas               tanpa middleware tambahan
GET  /rekap-keuangan            tanpa middleware tambahan
POST /riwayat-keuangan          active.kepengurusan:keuangan
PUT  /riwayat-keuangan/{id}     active.kepengurusan:keuangan
DELETE /riwayat-keuangan/{id}   active.kepengurusan:keuangan
POST /nominal-kas               active.kepengurusan:keuangan
PUT  /nominal-kas/{id}          active.kepengurusan:keuangan
DELETE /nominal-kas/{id}        active.kepengurusan:keuangan
PUT  /nominal-kas/{id}/toggle-active  active.kepengurusan:keuangan
```

---

## Cara Render Diagram

Gunakan salah satu:

- **VS Code**: extension [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) + `Alt+D`
- **Online**: [plantuml.com](https://www.plantuml.com/plantuml/uml/) atau [kroki.io](https://kroki.io)
- **CLI**: `java -jar plantuml.jar docs/keuangan/sequence/*.puml`
