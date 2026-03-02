# Dokumentasi Modul Surat Menyurat

Direktori ini berisi diagram Use Case dan Sequence untuk **Modul Surat Menyurat** pada sistem SILAB.

---

## Daftar Use Case

| Kode | Nama Use Case              | Aktor                                |
| ---- | -------------------------- | ------------------------------------ |
| UC01 | Kirim Surat Pribadi        | Semua role                           |
| UC02 | Lihat Surat Masuk          | Semua role                           |
| UC03 | Lihat Surat Keluar         | Semua role                           |
| UC04 | Lihat Detail Surat & Unduh | Semua role (hanya pengirim/penerima) |
| UC05 | Kirim Surat Resmi Lab      | Admin, Asisten (Sekretaris)          |
| UC06 | Lihat Arsip Surat Resmi    | Admin, Asisten (Sekretaris)          |

**Diagram:** [`usecase/UC_SURAT.puml`](usecase/UC_SURAT.puml)

---

## Daftar Sequence Diagram

| File                                                              | UC      | Skenario                                                                                                               |
| ----------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`SEQ_01_SURAT_PRIBADI.puml`](sequence/SEQ_01_SURAT_PRIBADI.puml) | UC01–04 | A: Buka form — B: Kirim pribadi — C: Surat masuk — D: Surat keluar — E: Detail & tandai dibaca — F: Unduh              |
| [`SEQ_02_SURAT_RESMI.puml`](sequence/SEQ_02_SURAT_RESMI.puml)     | UC05–06 | A: Buka form (canCreateResmi) — B: Kirim resmi ke anggota sistem — C: Kirim resmi ke pihak luar — D: Lihat arsip resmi |

---

## Struktur Direktori

```
docs/surat/
├── usecase/
│   └── UC_SURAT.puml
├── sequence/
│   ├── SEQ_01_SURAT_PRIBADI.puml
│   └── SEQ_02_SURAT_RESMI.puml
└── README.md
```

---

## Controller & Route

| Controller        | File                                       |
| ----------------- | ------------------------------------------ |
| `SuratController` | `app/Http/Controllers/SuratController.php` |

| Method | Route                      | Action           | Permission                            |
| ------ | -------------------------- | ---------------- | ------------------------------------- |
| GET    | `/surat/kirim`             | `createSurat`    | Auth                                  |
| POST   | `/surat/kirim`             | `storeSurat`     | `surat.create` / `surat.create_resmi` |
| GET    | `/surat/masuk`             | `suratMasuk`     | `surat.view`                          |
| GET    | `/surat/keluar`            | `suratKeluar`    | `surat.view`                          |
| GET    | `/surat/arsip-resmi`       | `arsipResmi`     | `surat.view_all`                      |
| GET    | `/surat/view/{id}`         | `viewSurat`      | pengirim / penerima                   |
| GET    | `/surat/download/{id}`     | `downloadSurat`  | pengirim / penerima                   |
| POST   | `/surat/mark-as-read/{id}` | `markAsRead`     | penerima                              |
| GET    | `/surat/count-unread`      | `getUnreadCount` | Auth (JSON)                           |

---

## Model & Tabel

| Model          | Tabel          | Keterangan                                       |
| -------------- | -------------- | ------------------------------------------------ |
| `Surat`        | `surat`        | Data surat, mendukung tipe `pribadi` dan `resmi` |
| `Laboratorium` | `laboratorium` | Lab pengirim untuk surat resmi (via `lab_id`)    |

### Kolom utama tabel `surat`

| Kolom                | Tipe                 | Keterangan                               |
| -------------------- | -------------------- | ---------------------------------------- |
| `tipe_surat`         | enum(pribadi, resmi) | Pembeda jenis surat                      |
| `lab_id`             | uuid nullable        | FK laboratorium — diisi untuk tipe resmi |
| `penerima`           | uuid nullable        | FK users — null jika penerima pihak luar |
| `penerima_nama_luar` | string nullable      | Nama bebas untuk penerima di luar sistem |

---

## Matriks Akses

| Fitur                    | Admin | Asisten (Sekretaris) | Asisten | Praktikan |
| ------------------------ | :---: | :------------------: | :-----: | :-------: |
| Kirim surat pribadi      |  ✅   |          ✅          |   ✅    |    ✅     |
| Lihat surat masuk/keluar |  ✅   |          ✅          |   ✅    |    ✅     |
| Kirim surat resmi        |  ✅   |          ✅          |   ❌    |    ❌     |
| Lihat arsip surat resmi  |  ✅   |          ✅          |   ❌    |    ❌     |

---

## Catatan Teknis

- **Tipe `pribadi`** — relasi 1-ke-1 antar user, `penerima` wajib diisi (FK users), `lab_id` null.
- **Tipe `resmi`** — atas nama laboratorium, `lab_id` wajib, `penerima` boleh null jika `penerima_nama_luar` diisi.
- **Nomor surat unik** — untuk tipe resmi, nomor surat harus unik dalam scope `(tipe_surat='resmi', lab_id)`. Validasi via `Rule::unique(...)->where(...)`.
- **Visibilitas arsip resmi** — `arsipResmi()` hanya menampilkan surat dari lab yang dimiliki user (via `KepengurusanUser`), bukan semua lab.
- **Permission jabatan** — `surat.create_resmi` dan `surat.view_all` diberikan ke Sekretaris melalui `StrukturPermissionSeeder` (mekanisme jabatan-based permission).
- **Frontend toggle** — form `KirimSurat.jsx` menampilkan toggle Pribadi/Resmi hanya jika `canCreateResmi = true`; section lab dan penerima luar muncul secara kondisional.
