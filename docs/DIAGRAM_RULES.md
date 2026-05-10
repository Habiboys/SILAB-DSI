# Aturan Pembuatan Activity Diagram

## 1. Struktur Umum

- **Start dan End hanya satu** — setiap diagram wajib memiliki tepat satu titik `start` dan satu titik `stop`
- **Swimlane selalu dua**: `Admin` (kiri) dan `System` (kanan)
- **Title format**: `ACT-XX - Nama Diagram\nAktor: NamaAktor`

---

## 2. Pola Awal — Tampilkan Daftar Dulu

Setiap modul **wajib menampilkan daftar terlebih dahulu** sebelum user bisa memilih aksi. Ini karena user harus membuka halaman dulu agar menu Tambah/Edit/Hapus muncul.

```plantuml
|Admin|
:Buka menu [Nama Modul];
|System|
:Query & Tampilkan daftar [data];
|Admin|
:Lihat daftar [data];

if (Aksi?) then ...
```

> **"Lihat Daftar" bukan cabang decision** — ia adalah langkah wajib di awal alur, bukan pilihan menu.

---

## 3. Pola Decision Diamond

Gunakan **satu diamond utama** setelah daftar ditampilkan. Tidak perlu diamond tambahan untuk “Mengelola X?”.

```
if (Aksi?) then (Export/Non-validasi)
  ...aksi export...
elseif (Aksi?) then (Tambah)
  ...
elseif (Aksi?) then (Edit)
  ...
else (Hapus)
  ...
endif
```

### Aturan pengelompokan cabang:

| Jenis Aksi                   | Perlakuan                                              |
| ---------------------------- | ------------------------------------------------------ |
| **Lihat / Tampilkan daftar** | **Bukan cabang** — langkah awal wajib sebelum decision |
| **Export / Download / QR**   | Salah satu cabang `if`/`elseif`, tidak perlu validasi  |
| **Tambah / Edit / Hapus**    | Cabang `elseif`/`else`, validasi dipakai bersama       |

---

## 4. Validasi — Satu Kali, Dipakai Bersama

- Validasi **tidak diulang** per menu
- Validasi diletakkan **setelah `endif` nested decision** Tambah/Edit/Hapus sehingga dipakai bersama
- **Tidak menggunakan** `repeat...repeat while` (loop)
- Gunakan `if (Valid?) then (tidak) / else (ya)` yang sederhana

```plantuml
if (Aksi?) then (Tambah)
  ...
elseif (Aksi?) then (Edit)
  ...
else (Hapus)
  ...
endif

|System|
:Melakukan Validasi;        ← satu validasi shared
if (Valid?) then (tidak)
  :Tampilkan Pesan Error;
  |Admin|
  :Perbaiki data;
  |System|
else (ya)
  :Tampilkan Pesan Sukses;
  |Admin|
endif
```

---

## 5. Aturan PlantUML

```
!theme plain
scale max 1600 width
skinparam wrapWidth 200
skinparam defaultFontSize 12
skinparam swimlaneWidth 260
skinparam ActivityStartColor black
skinparam ActivityEndColor black
```

- Gunakan `\n` untuk baris baru dalam label aktivitas
- Swimlane dideklarasikan di awal: `|Admin|` lalu `|System|`
- Pindah swimlane ditulis sebelum aktivitas yang berpindah

---

## 6. Aturan Visual Draw.io

### Warna Node

| Elemen           | fillColor | strokeColor | Digunakan untuk                     |
| ---------------- | --------- | ----------- | ----------------------------------- |
| Aktivitas normal | `#dae8fc` | `#6c8ebf`   | Semua aksi Admin & System           |
| Decision         | `#fff2cc` | `#d6b656`   | Diamond/rhombus                     |
| Error            | `#f8cecc` | `#b85450`   | Tampilkan Pesan Error               |
| Sukses           | `#d5e8d4` | `#82b366`   | Tampilkan Pesan Sukses, Simpan data |
| Swimlane header  | `#f5f5f5` | `#666666`   | Header Admin & System               |

### Shape

| Elemen    | Shape draw.io                                     |
| --------- | ------------------------------------------------- |
| Start     | `ellipse` filled black `#000000`                  |
| End       | `ellipse` filled black `#000000`, `strokeWidth=4` |
| Aktivitas | `rounded=1`, `arcSize=15`                         |
| Decision  | `rhombus`                                         |
| Swimlane  | `swimlane`, `startSize=30`                        |

### Layout

- Lebar swimlane Admin: **400px** | System: **400px**
- Tinggi node aktivitas: **44px**, lebar: **210px**
- Jarak antar node vertikal: **±74px** (y selisih 74)
- Edge style: `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1`
- Label edge decision: `fontSize=10`
- Ukuran font node: `fontSize=11`

---

## 7. Alur Admin–System (Pola Standar)

```
Admin: Tekan tombol [aksi]
  ↓
System: Tampilkan Form [aksi]
  ↓
Admin: Isi / Ubah / Konfirmasi data
  ↓
System: Melakukan Validasi
  ↓
System: Tampilkan Pesan Error  →  Admin: Perbaiki data
         (jika tidak valid)
  ↓ (jika valid)
System: Tampilkan Pesan Sukses
```

---

## 8. Checklist Sebelum Export

- [ ] Start hanya satu
- [ ] Stop/End hanya satu
- [ ] Semua cabang dari diamond bertemu kembali ke `endif` / `stop`
- [ ] Validasi tidak duplikat untuk Tambah/Edit/Hapus
- [ ] Tidak ada `repeat...repeat while`
- [ ] Swimlane Admin di kiri, System di kanan
- [ ] Warna node sesuai tabel di atas
