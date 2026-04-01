# Rules & Konvensi Pembuatan Diagram SiLab

> Berlaku untuk **seluruh modul** — Inventaris, Praktikum, Keuangan, Kegiatan, Piket, Surat, Sertifikat, Kuesioner, dll.  
> Dokumen ini menjadi acuan sebelum membuat atau memperbarui diagram.

---

## 1. Struktur Folder

```
docs/
├── rules.md                   ← Dokumen ini
├── {modul}/
│   ├── README.md              ← Index modul (tabel UC, sequence, hak akses)
│   ├── usecase/
│   │   └── UC_{MODUL}.puml   ← Satu file use case per modul
│   └── sequence/
│       ├── SEQ_01_*.puml
│       ├── SEQ_02_*.puml
│       └── ...
```

Nama folder modul menggunakan **huruf kecil** tanpa spasi: `inventaris`, `praktikum`, `keuangan`, `kegiatan`, `piket`, `surat`, `sertifikat`, `kuesioner`, `data_master`, dst.

---

## 2. Konvensi Use Case

### 2a. Prinsip "Mengelola vs Melihat"

| Kondisi                                                              | Use Case      | Contoh                   |
| -------------------------------------------------------------------- | ------------- | ------------------------ |
| Aktor punya akses **CRUD** (create/edit/delete) pada entitas         | `Mengelola X` | Mengelola Praktikum      |
| Aktor hanya punya akses **VIEW** (tanpa CRUD) pada entitas yang sama | `Melihat X`   | Melihat Daftar Praktikum |

**Aturan:**

- Jika di satu modul ada aktor A yang bisa CRUD dan aktor B yang hanya bisa view → buat **dua** use case: `Mengelola X` (untuk A) dan `Melihat X` (untuk B).
- Jika semua aktor hanya bisa view (tidak ada yang bisa CRUD) → satu use case `Melihat X`.
- Use case `Mengelola X` **sudah mencakup view** secara implisit, tidak perlu use case view terpisah untuk aktor yang punya CRUD.

### 2b. Penamaan Use Case

```
Mengelola {Entitas}             → CRUD penuh
Melihat {Entitas/Daftar}        → View only (tidak ada create/edit/delete)
Mengajukan {Aksi}               → Aksi inisiatif dari aktor bawah (submit, request)
Menyetujui / Menolak {Entitas}  → Aksi approval
Mengumpulkan {Entitas}          → Submit (aksi aktif tapi bukan CRUD admin)
Mengakses {Entitas}             → View + download (bukan edit)
Mengelola {Entitas} (CRUD + {detail aksi tertentu}) → jika ada sub-aksi penting
```

### 2c. Aktor yang Digunakan

| Peran Sistem              | Label di Diagram | Catatan                                                                              |
| ------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| Admin / Ketua Lab / Kalab | `Admin`          | Kepengurusan aktif, punya create/delete rights                                       |
| Asisten / Aslab           | `Asisten`        | Kepengurusan aktif, manage konten tapi tidak selalu bisa create/delete entitas utama |
| Kepala Departemen         | `Kadep`          | Akses approval, data master, read-only laporan                                       |
| Praktikan (mahasiswa)     | `Praktikan`      | Role khusus mahasiswa, submit-only                                                   |
| Pengguna tanpa login      | `Publik`         | Akses via QR/link publik, no auth                                                    |

> ⛔ **Superadmin TIDAK dimasukkan** dalam diagram use case maupun sequence.

### 2d. Relasi Use Case Opsional

Gunakan hanya jika benar-benar dipakai di sistem:

- `<<include>>` — use case A selalu memanggil B
- `<<extend>>` — use case B opsional memperluas A
- Generalisasi aktor: `Aktor B --|> Aktor A` jika B mewarisi semua akses A

---

## 3. Konvensi Sequence Diagram

### 3a. Satu Sequence per Use Case

Setiap use case di diagram UC → satu file `.puml` sequence.

**Rasio:**
| UC | Sequence |
|----|----------|
| Mengelola Praktikum | SEQ_01_MENGELOLA_PRAKTIKUM.puml |
| Melihat Daftar Praktikum | SEQ_02_MELIHAT_PRAKTIKUM.puml |
| Mengelola Modul | SEQ_03_MENGELOLA_MODUL.puml |

### 3b. Isi Sequence untuk "Mengelola X"

Sequence untuk `Mengelola X` **wajib mencakup semua skenario CRUD** dalam satu file menggunakan `== Skenario A/B/C/D ==`:

```
== Skenario A: Lihat Daftar ==
... flow GET /endpoint ...

== Skenario B: Tambah Baru ==
... flow POST /endpoint ...

== Skenario C: Edit ==
... flow PUT /endpoint/{id} ...

== Skenario D: Hapus ==
... flow DELETE /endpoint/{id} ...
```

Sub-aksi tambahan (bulk delete, export, regenerate, dll.) ditambahkan sebagai skenario E, F, dst.

### 3c. Isi Sequence untuk "Melihat X"

Sequence untuk `Melihat X` hanya berisi skenario **tampil daftar** dan **tampil detail** (jika ada):

```
== Lihat Daftar ==
...

== Lihat Detail ==
...
```

### 3d. Tipe Participant PlantUML

Gunakan keyword PlantUML yang tepat sesuai peran peserta dalam sequence:

| Tipe PlantUML | Digunakan untuk                                                                      | Contoh                                             |
| ------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `actor`       | Aktor manusia                                                                        | `actor "Admin" as Admin`                           |
| `boundary`    | Lapisan UI / browser                                                                 | `boundary "Browser" as Browser`                    |
| `control`     | Controller Laravel                                                                   | `control "PraktikumController" as Controller`      |
| `entity`      | Eloquent Model (entitas data)                                                        | `entity "Praktikum Model" as Model`                |
| `collections` | File storage / disk                                                                  | `collections "Storage\n(disk: public)" as Storage` |
| `database`    | Tabel database — **diberi nama tabel utama** yang dioperasikan, **bukan** "Database" | `database "praktikum" as DB`                       |

> **Aturan database:** label `database` menggunakan **nama tabel utama** (snake_case) sesuai tabel yang paling banyak dioperasikan dalam sequence tersebut. Jika sequence melibatkan banyak tabel yang sejajar pentingnya, gunakan nama tabel primer (tabel tempat CREATE/UPDATE/DELETE).

### 3e. Format Standar File Sequence

```plantuml
@startuml SEQ_NN_NAMA_USE_CASE
!theme plain
skinparam defaultFontSize 12
title SEQ-NN · Nama Use Case\nAktor: Aktor1 / Aktor2

actor       "Aktor1"                       as A1
boundary    "Browser"     as Browser
control     "NamaController"               as Controller
entity      "NamaModel"                    as Model
collections "Storage\n(disk: public)"      as Storage
database    "nama_tabel"                   as DB

== Skenario A: Lihat ==
...

== Skenario B: Tambah ==
...

@enduml
```

### 3f. Komponen yang Wajib Tampil di Sequence

- **Middleware** yang relevan (auth, role, policy) dicantumkan di pesan request pertama, contoh: `[auth:sanctum + role:asisten]`
- **Validasi** dicantumkan sebagai note atau blok `alt Validasi Gagal / else Sukses`
- **Storage / File** ditampilkan sebagai participant terpisah jika ada upload/download
- **Nama route** dicantumkan di arrow request: `POST /endpoint`
- **Query SQL** deskriptif (tidak harus persis SQL, tapi cukup jelas)

---

## 4. Konvensi File PlantUML

### 4a. Penamaan File

```
UC_{MODUL}.puml                         ← use case
SEQ_{NN}_{NAMA_USECASE_UPPERCASE}.puml  ← sequence, NN = 2-digit number
```

### 4b. Theme & Skinparam

Semua file menggunakan:

```
!theme plain
skinparam defaultFontSize 12
```

---

## 5. Konvensi Activity Diagram (Swimlane)

### 5a. Prinsip Dasar

Setiap use case dalam diagram UC **wajib memiliki satu file activity diagram** yang menggambarkan alur kerja langkah-demi-langkah dari perspektif aktor yang terlibat.

**Rasio:** 1 Use Case → 1 File Activity Diagram

### 5b. Format Swimlane

Activity diagram menggunakan **Swimlane** dengan masing-masing lane mewakili aktor/komponen:

| Lane     | Isi                                            |
| -------- | ---------------------------------------------- |
| `Aktor`  | Tindakan pengguna (klik, isi form, pilih aksi) |
| `System` | Validasi, proses bisnis, query DB, response    |

Untuk use case multi-aktor (approval, multi-role):

| Lane     | Isi                                       |
| -------- | ----------------------------------------- |
| `Aktor1` | Tindakan aktor pertama (misal: Asisten)   |
| `Aktor2` | Tindakan aktor kedua (misal: Admin/Kadep) |
| `System` | Proses di balik layar                     |

### 5c. Penamaan File

```
ACT_{NN}_{NAMA_USECASE_UPPERCASE}.puml   ← activity diagram
```

Nomor `NN` mengikuti nomor urut sequence yang berpadanan:

| Sequence                          | Activity                          |
| --------------------------------- | --------------------------------- |
| `SEQ_01_MENGELOLA_ASET.puml`      | `ACT_01_MENGELOLA_ASET.puml`      |
| `SEQ_02_MELIHAT_DAFTAR_ASET.puml` | `ACT_02_MELIHAT_DAFTAR_ASET.puml` |

### 5d. Struktur Folder

```
docs/
└── {modul}/
    ├── usecase/
    │   └── UC_{MODUL}.puml
    ├── sequence/
    │   └── SEQ_NN_*.puml
    └── activity/               ← BARU
        └── ACT_NN_*.puml
```

### 5e. Format Standar File Activity Diagram

```plantuml
@startuml ACT_NN_NAMA_USE_CASE
!theme plain
skinparam defaultFontSize 12
skinparam swimlaneWidth 200
title ACT-NN · Nama Use Case\nAktor: Aktor1 [/ Aktor2]

|Aktor1|
start
...

|System|
...

|Aktor1|
stop
@enduml
```

### 5f. Aturan Isi Activity Diagram

- **Mengelola X (CRUD):** Tampilkan cabang `if` untuk pilihan aksi (Lihat / Tambah / Edit / Hapus), masing-masing diikuti alur validasi dan proses.
- **Melihat X (View-Only):** Alur linier sederhana — aktor buka halaman → System query → tampil data.
- **Mengajukan / Mengisi:** Aktor isi form → validasi → kirim → konfirmasi.
- **Menyetujui / Menolak:** Alur dua cabang: `if (Setuju?)` → Approve → notif / else → Tolak → notif.
- **Parallel (fork/join):** Gunakan `fork` / `end fork` jika ada proses yang berjalan bersamaan (misal: generate QR + simpan record).

### 5g. Skinparam Warna Swimlane (Opsional)

Gunakan warna konsisten per role untuk memudahkan pembacaan:

```plantuml
|#AliceBlue|Admin|
|#LightYellow|Asisten|
|#LightGreen|Praktikan|
|#Lavender|Kadep|
|#WhiteSmoke|System|
```

### 5h. Checklist Activity Diagram

- [ ] Setiap use case punya satu file `ACT_NN_*.puml`
- [ ] Menggunakan swimlane dengan aktor sesuai use case
- [ ] Nama file menggunakan huruf besar (`ACT_01_MENGELOLA_ASET.puml`)
- [ ] Dimulai dengan `start` dan diakhiri `stop` atau `end`
- [ ] Validasi digambarkan sebagai `if` dengan cabang gagal/sukses
- [ ] README.md modul diperbarui dengan tabel activity diagram

---

## 6. Modul yang Sudah Dibuat

| Modul             | Usecase                            | Sequence        | Activity         | Status  |
| ----------------- | ---------------------------------- | --------------- | ---------------- | ------- |
| Inventaris        | ✅ `docs/inventaris/usecase/`      | ✅ 10 sequences | ✅ 10 activities | Selesai |
| Praktikum         | ✅ `docs/praktikum/usecase/`       | ✅ 17 sequences | ✅ 17 activities | Selesai |
| Keuangan          | ✅ `docs/keuangan/usecase/`        | ✅ 5 sequences  | ✅ 5 activities  | Selesai |
| Piket             | ✅ `docs/piket/usecase/`           | ✅ 7 sequences  | ✅ 7 activities  | Selesai |
| Kegiatan & Proker | ✅ `docs/kegiatan_proker/usecase/` | ✅ 16 sequences | ✅ 16 activities | Selesai |
| Surat             | ✅ `docs/surat/usecase/`           | ✅ 2 sequences  | ✅ 6 activities  | Selesai |
| Sertifikat        | —                                  | —               | —                | Belum   |
| Kuesioner         | ✅ `docs/kuesioner/usecase/`       | ✅ 3 sequences  | ✅ 3 activities  | Selesai |
| Data Master       | —                                  | —               | —                | Belum   |
| Kepengurusan      | —                                  | —               | —                | Belum   |
| Auth              | ✅ `docs/auth/usecase/`            | ✅ 7 sequences  | —                | Parsial |

---

## 7. Checklist Sebelum Commit Diagram

- [ ] Tidak ada aktor `superadmin` dalam diagram
- [ ] Setiap UC yang "Mengelola" punya sequence dengan minimal skenario A/B/C/D
- [ ] Setiap UC yang "Melihat" (view-only) punya sequence terpisah
- [ ] Setiap UC punya **satu file activity diagram** (`ACT_NN_*.puml`) di folder `activity/`
- [ ] Activity diagram menggunakan **swimlane** dengan lane per aktor + lane System
- [ ] Nama file sesuai konvensi (`SEQ_NN_*.puml`, `ACT_NN_*.puml`)
- [ ] Tidak ada duplikat nomor sequence / activity dalam satu modul
- [ ] README.md modul sudah diperbarui dengan tabel terbaru (usecase, sequence, activity)
