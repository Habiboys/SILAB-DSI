# Dokumentasi Aktor & Generalisasi Use Case Diagram - Sistem SILAB

## 1. Pengertian Generalisasi Aktor

Generalisasi aktor (Actor Generalization) adalah teknik dalam UML Use Case Diagram yang digunakan untuk menunjukkan bahwa satu aktor **mewarisi** seluruh use case dari aktor lain. Tujuannya adalah:

- **Mengurangi jumlah garis** koneksi di diagram agar lebih bersih
- **Menghindari duplikasi** koneksi yang sama ke use case yang sama
- **Menunjukkan hubungan hierarki** antar aktor

### Simbol di UML
```
Anak --|> Induk
```
Panah segitiga kosong (──▷) mengarah dari **anak ke induk**, artinya anak mewarisi semua hak akses yang dimiliki oleh induk.

### Aturan Penting
- **Induk (parent)**: Aktor dengan akses **lebih sedikit** (use case dasar/umum)
- **Anak (child)**: Aktor dengan akses **lebih banyak** (mewarisi semua dari induk + punya yang eksklusif)
- Aktor induk bisa bersifat **abstrak** (tidak ada user nyata yang login sebagai aktor tersebut, hanya digunakan untuk pengelompokan di diagram)

---

## 2. Daftar Aktor Sistem SILAB

Sistem SILAB memiliki **6 aktor nyata** yang bisa login ke sistem:

| # | Aktor | Deskripsi |
|---|-------|-----------|
| 1 | **Superadmin** | Pengelola tertinggi, kontrol penuh atas sistem dan data master |
| 2 | **Kadep** | Kepala departemen/lab, monitoring, approval, dan manajemen kepengurusan |
| 3 | **Admin** | Pengelola operasional laboratorium sehari-hari |
| 4 | **Asisten** | Asisten laboratorium, input data operasional harian |
| 5 | **Praktikan** | Mahasiswa peserta praktikum |
| 6 | **Dosen** | Dosen pembimbing/penanggung jawab |

---

## 3. Hierarki Generalisasi Aktor

### 3.1 Admin → Superadmin

**Admin adalah induk, Superadmin adalah anak.**

Alasan: Superadmin bisa melakukan **SEMUA** yang dilakukan Admin, ditambah fitur eksklusif yang hanya dimiliki Superadmin.

#### Use Case yang Diwarisi (dari Admin)
Superadmin mewarisi semua use case operasional yang dimiliki Admin:

| Modul | Use Case yang Diwarisi |
|-------|----------------------|
| Inventaris | Melihat daftar aset, Menambah aset, Mengedit aset, Menghapus aset, dst. |
| Keuangan | Melihat transaksi, Mencatat pemasukan/pengeluaran, Mengedit, Menghapus |
| Praktikum | Membuat praktikum, Mengelola pertemuan, Absensi, Tugas, Penilaian, dst. |
| Kegiatan | Membuat kegiatan, Approve kegiatan, Mengelola peserta, Generate sertifikat |
| Piket | Membuat periode, Membuat jadwal, Approve ganti jadwal |
| Surat | Mengirim surat, Melihat surat masuk/keluar |
| Kuesioner | Membuat kuesioner, Melihat hasil, Mengisi kuesioner |

#### Use Case Eksklusif Superadmin (TIDAK dimiliki Admin)

| # | Use Case Eksklusif | Keterangan |
|---|-------------------|------------|
| 1 | Melihat daftar role & permission | Halaman admin role management |
| 2 | Membuat role baru | Tambah role selain yang default |
| 3 | Mengedit role | Ubah nama role |
| 4 | Menghapus role | Hapus role dari sistem |
| 5 | Mengatur permission per role | Assign/revoke permission ke role |
| 6 | Bulk assign permission ke role | Assign banyak permission sekaligus |
| 7 | Melihat user per role | List user yang punya role tertentu |

#### Visualisasi
```
┌─────────────┐
│    Admin     │ ← INDUK (50+ use case operasional)
└──────▲──────┘
       │ mewarisi semua
┌──────┴──────┐
│ Superadmin  │ ← ANAK (50+ dari Admin + 7 eksklusif)
└─────────────┘
```

---

### 3.2 Dosen → Kadep

**Dosen adalah induk, Kadep adalah anak.**

Alasan: Kadep bisa melakukan **SEMUA** yang dilakukan Dosen, ditambah fitur monitoring dan manajemen kepengurusan yang tidak dimiliki Dosen.

#### Use Case yang Diwarisi (dari Dosen)
Kadep mewarisi semua use case yang dimiliki Dosen:

| # | Use Case yang Diwarisi | Modul |
|---|----------------------|-------|
| 1 | Menyetujui kegiatan | Kegiatan |
| 2 | Menolak kegiatan | Kegiatan |
| 3 | Melihat kalender kegiatan | Kegiatan |
| 4 | Melihat daftar program kerja | Proker |
| 5 | Mengisi kuesioner | Kuesioner |

#### Use Case Eksklusif Kadep (TIDAK dimiliki Dosen)

| # | Use Case Eksklusif | Modul |
|---|-------------------|-------|
| 1 | Melihat daftar aset | Inventaris |
| 2 | Melihat riwayat transaksi keuangan | Keuangan |
| 3 | Melihat rekap keuangan bulanan | Keuangan |
| 4 | Mengekspor laporan keuangan ke Excel | Keuangan |
| 5 | Melihat jadwal piket | Piket |
| 6 | Melihat rekap absensi piket | Piket |
| 7 | Mengirim surat | Surat |
| 8 | Melihat surat masuk | Surat |
| 9 | Melihat surat keluar | Surat |
| 10 | Membuat tahun kepengurusan baru | Kepengurusan |
| 11 | Mengedit tahun kepengurusan | Kepengurusan |
| 12 | Membuat kepengurusan lab | Kepengurusan |
| 13 | Mengaktifkan periode kepengurusan | Kepengurusan |
| 14 | Melihat struktur jabatan | Data Master |
| 15 | Mengedit data laboratorium | Data Master |
| 16 | User management | Data Master |
| 17 | Melihat hasil kuesioner | Kuesioner |
| 18 | Mengekspor hasil kuesioner | Kuesioner |

#### Visualisasi
```
┌─────────────┐
│    Dosen    │ ← INDUK (5 use case dasar)
└──────▲──────┘
       │ mewarisi semua
┌──────┴──────┐
│    Kadep    │ ← ANAK (5 dari Dosen + 18 eksklusif)
└─────────────┘
```

---

### 3.3 Aktor yang Berdiri Sendiri

Dua aktor berikut **tidak** terlibat dalam generalisasi karena use case mereka cukup unik/spesifik:

#### Asisten
- Berperan di banyak modul (inventaris, praktikum, piket, surat, kegiatan, kuesioner)
- Use case-nya tumpang tindih sebagian dengan Admin, tapi BUKAN turunan dari Admin
- Contoh: Asisten bisa input absensi dan nilai, tapi TIDAK bisa buat praktikum baru

#### Praktikan
- Hanya berinteraksi dengan sistem sebagai pengguna akhir
- Use case sangat terbatas: lihat tugas, submit tugas, download modul, lihat sertifikat, isi kuesioner

---

## 4. Ringkasan Hierarki Lengkap

```
                ┌─────────────────┐
                │ Authenticated   │  ← Abstrak (semua user login)
                │     User        │     Lihat Dashboard, Edit Profil,
                └────────▲────────┘     Lihat Sertifikat Saya
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────┴────┐     ┌─────┴─────┐    ┌────┴────┐
   │  Admin  │     │   Dosen   │    │Praktikan│  ← Berdiri sendiri
   └────▲────┘     └─────▲─────┘    └─────────┘
        │                │
   ┌────┴──────┐   ┌─────┴─────┐
   │Superadmin │   │   Kadep   │
   └───────────┘   └───────────┘

   Asisten → Berdiri sendiri (tidak punya child atau parent)
```

### Penjelasan Panah

| Notasi | Arti |
|--------|------|
| `Superadmin ──▷ Admin` | Superadmin mewarisi semua use case Admin |
| `Kadep ──▷ Dosen` | Kadep mewarisi semua use case Dosen |
| Semua aktor `──▷ Authenticated User` | Semua user login punya akses ke Dashboard & Profil |

---

## 5. Dampak pada Use Case Diagram

### Sebelum Generalisasi (Banyak Garis)
Jika Admin dan Superadmin sama-sama terhubung ke 50 use case:
- Total garis = 50 (Admin) + 50 (Superadmin) = **100 garis**

### Sesudah Generalisasi (Garis Minimal)
- Garis dari Admin (induk) ke use case = 50
- Garis inheritance Superadmin ke Admin = 1
- Garis Superadmin ke use case eksklusif = 7
- Total garis = 50 + 1 + 7 = **58 garis** (hemat 42 garis!)

Sama untuk Dosen → Kadep:
- Sebelum: 5 + 23 = 28 garis
- Sesudah: 5 + 1 + 18 = 24 garis

---

**Dokumen ini dibuat sebagai referensi untuk memahami struktur aktor dalam Use Case Diagram Sistem SILAB.**

**Last Updated:** 2026-02-18
