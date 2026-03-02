# Dokumentasi Modul Kuesioner

Direktori ini berisi diagram Use Case dan Sequence untuk **Modul Kuesioner** pada sistem SILAB.

---

## Daftar Use Case

| Kode | Nama Use Case           | Aktor              |
| ---- | ----------------------- | ------------------ |
| UC01 | Mengelola Kuesioner     | Admin              |
| UC02 | Mengisi Kuesioner       | Asisten, Praktikan |
| UC03 | Melihat Hasil Kuesioner | Admin              |

**Diagram:** [`usecase/UC_KUESIONER.puml`](usecase/UC_KUESIONER.puml)

---

## Daftar Sequence Diagram

| File                                                                                  | Use Case | Skenario                                                                        |
| ------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------- |
| [`SEQ_01_MENGELOLA_KUESIONER.puml`](sequence/SEQ_01_MENGELOLA_KUESIONER.puml)         | UC01     | A: Lihat daftar — B: Tambah internal — C: Tambah eksternal — D: Edit — E: Hapus |
| [`SEQ_02_MENGISI_KUESIONER.puml`](sequence/SEQ_02_MENGISI_KUESIONER.puml)             | UC02     | A: Buka form pengisian — B: Submit respon                                       |
| [`SEQ_03_MELIHAT_HASIL_KUESIONER.puml`](sequence/SEQ_03_MELIHAT_HASIL_KUESIONER.puml) | UC03     | A: Lihat hasil & statistik — B: Export data                                     |

---

## Struktur Direktori

```
docs/kuesioner/
├── usecase/
│   └── UC_KUESIONER.puml
├── sequence/
│   ├── SEQ_01_MENGELOLA_KUESIONER.puml
│   ├── SEQ_02_MENGISI_KUESIONER.puml
│   └── SEQ_03_MELIHAT_HASIL_KUESIONER.puml
└── README.md
```

---

## Controller & Route

| Controller                  | File                                                 |
| --------------------------- | ---------------------------------------------------- |
| `KuesionerController`       | `app/Http/Controllers/KuesionerController.php`       |
| `ResponKuesionerController` | `app/Http/Controllers/ResponKuesionerController.php` |

| Method | Route                     | Action                            | Permission            |
| ------ | ------------------------- | --------------------------------- | --------------------- |
| GET    | `/kuesioner`              | `index`                           | `survey.view`         |
| GET    | `/kuesioner/create`       | `create`                          | `survey.create`       |
| POST   | `/kuesioner`              | `store`                           | `survey.create`       |
| GET    | `/kuesioner/{id}`         | `show`                            | `survey.view`         |
| GET    | `/kuesioner/{id}/edit`    | `edit`                            | `survey.edit`         |
| PUT    | `/kuesioner/{id}`         | `update`                          | `survey.edit`         |
| DELETE | `/kuesioner/{id}`         | `destroy`                         | `survey.delete`       |
| GET    | `/kuesioner/{id}/isi`     | `participate`                     | `survey.participate`  |
| POST   | `/kuesioner/{id}/submit`  | `ResponKuesionerController@store` | `survey.participate`  |
| GET    | `/kuesioner/{id}/results` | `results`                         | `survey.view_results` |
| GET    | `/kuesioner/{id}/export`  | `export`                          | `survey.view_results` |

---

## Model & Tabel

| Model                 | Tabel                  | Keterangan                                                       |
| --------------------- | ---------------------- | ---------------------------------------------------------------- |
| `Kuesioner`           | `kuesioner`            | Data utama kuesioner                                             |
| `PertanyaanKuesioner` | `pertanyaan_kuesioner` | Daftar pertanyaan (tipe: text, textarea, radio, checkbox, scale) |
| `TargetKuesioner`     | `target_kuesioner`     | Target peserta berdasarkan role (`tipe_target='role'`)           |
| `ResponKuesioner`     | `respon_kuesioner`     | Satu baris per user per kuesioner (single response)              |
| `JawabanKuesioner`    | `jawaban_kuesioner`    | Jawaban per pertanyaan; checkbox disimpan sebagai JSON           |

---

## Matriks Akses

| Fitur                           | Admin | Asisten | Praktikan |
| ------------------------------- | :---: | :-----: | :-------: |
| Lihat daftar kuesioner          |  ✅   |   ❌    |    ❌     |
| Tambah / Edit / Hapus kuesioner |  ✅   |   ❌    |    ❌     |
| Mengisi kuesioner               |  ❌   |  ✅\*   |   ✅\*    |
| Melihat hasil & statistik       |  ✅   |   ❌    |    ❌     |
| Export data                     |  ✅   |   ❌    |    ❌     |

> \* Hanya jika role pengguna termasuk dalam `TargetKuesioner` kuesioner tersebut.

---

## Catatan Teknis

- **Tipe kuesioner `internal`** — pertanyaan dibuat langsung di sistem; wajib isi `pertanyaan[]` saat store.
- **Tipe kuesioner `eksternal`** — hanya menyimpan `link_eksternal`; tidak ada pertanyaan di sistem.
- **Smart update pertanyaan** — saat edit, sistem membandingkan ID lama vs baru: hapus yang hilang, update yang ada, tambah yang baru.
- **Single response** — satu user hanya bisa mengisi satu kali; pengecekan dilakukan di controller sebelum render form maupun saat submit.
- **Checkbox answer** — jawaban tipe checkbox disimpan sebagai `json_encode(array)` di kolom `jawaban_kuesioner.jawaban`.
- **calculateStats()** — radio/checkbox/scale menghasilkan `counts per opsi`; text/textarea menghasilkan array jawaban mentah.
- **Export** — fitur placeholder, belum diimplementasi (redirect back with flash message).
