# Dokumentasi PlantUML - Sistem SILAB

## 📋 Daftar Diagram

Dokumentasi ini berisi 2 diagram PlantUML yang menggambarkan sistem SILAB secara komprehensif:

### 1. Use Case Diagram (`PLANTUML_USECASE_DIAGRAM.puml`)
**Deskripsi**: Diagram Use Case lengkap yang menampilkan:
- 6 Aktor (Superadmin, Kadep, Admin, Asisten, Praktikan, Dosen)
- 9 Modul Utama dengan 80+ Use Case
- Relasi `<<include>>` dan `<<extend>>`
- Koneksi lengkap antara aktor dan use case

**Modul yang Tercakup**:
- 📦 Inventaris (8 use case)
- 💰 Keuangan (9 use case)
- 🔬 Praktikum (19 use case)
- 🎯 Kegiatan (11 use case)
- 📋 Program Kerja (6 use case)
- 📅 Piket (8 use case)
- ✉️ Surat Menyurat (6 use case)
- 👥 Kepengurusan (9 use case)
- ⚙️ Data Master (10 use case)
- 🎓 Sertifikat (5 use case)

### 2. ER Diagram (`PLANTUML_ER_DIAGRAM.puml`)
**Deskripsi**: Entity Relationship Diagram lengkap yang menampilkan:
- 40+ Entitas database
- Relasi antar tabel (One-to-Many, Many-to-Many)
- Primary Keys dan Foreign Keys
- Tipe data kolom
- Enum values

**Kategori Entitas**:
- **User & Authentication**: users, roles, permissions, model_has_roles, etc.
- **Kepengurusan**: laboratorium, tahun_kepengurusan, kepengurusan_lab, struktur, anggota
- **Praktikum**: praktikum, praktikan, modul_praktikum, pertemuan_praktikum, absensi
- **Penilaian**: tugas_praktikum, pengumpulan_tugas, rubrik_penilaian, komponen_rubrik, nilai_rubrik
- **Inventaris**: kategori_aset, detail_inventaris, permohonan_aset
- **Keuangan**: riwayat_keuangan, rekap_keuangan
- **Piket**: periode_piket, jadwal_piket, ganti_jadwal_piket, absensi_aslab
- **Proker & Kegiatan**: proker, kegiatan, kegiatan_peserta, sertifikat_template
- **Surat**: surat
- **Sertifikat**: sertifikat

---

## 🚀 Cara Menggunakan

### Prerequisites
Install PlantUML:
- Via NPM: `npm install -g node-plantuml`
- Via Java: Download dari https://plantuml.com/download
- Via VS Code Extension: Install "PlantUML" extension

### Cara Render Diagram

#### 1. Menggunakan VS Code Extension
1. Install extension "PlantUML" di VS Code
2. Buka file `.puml`
3. Tekan `Alt+D` atau klik icon preview

#### 2. Menggunakan Command Line
```bash
# Generate PNG
plantuml PLANTUML_USECASE_DIAGRAM.puml
plantuml PLANTUML_ER_DIAGRAM.puml

# Generate SVG (lebih scalable)
plantuml -tsvg PLANTUML_USECASE_DIAGRAM.puml
plantuml -tsvg PLANTUML_ER_DIAGRAM.puml
```

#### 3. Menggunakan Online Editor
1. Buka https://www.plantuml.com/plantuml/uml/
2. Copy-paste isi file `.puml`
3. Klik "Submit" untuk generate

---

## 📊 Detail Diagram

### Use Case Diagram Features
- **Color Coding**: Setiap aktor dan modul memiliki warna berbeda untuk memudahkan identifikasi
- **Relasi Include**: Ditandai dengan `..>` dan label `<<include>>`
- **Relasi Extend**: Ditandai dengan `..>` dan label `<<extend>>`
- **Grouping**: Use case dikelompokkan berdasarkan modul dalam package

### ER Diagram Features
- **Entity Notation**: Menggunakan notasi standard dengan PK/FK markers
- **Relationship Cardinality**:
  - `||--o{` : One to Many
  - `||--||` : One to One
  - `}o--o{` : Many to Many
- **Data Types**: Setiap field mencantumkan tipe data lengkap
- **Constraints**: Primary keys, foreign keys, unique, dan nullable

---

## 📝 Catatan Penting

### Use Case Diagram
- Total 80+ use case granular
- Mencakup semua fitur dari Inventaris hingga Sertifikat
- Menampilkan relasi include/extend untuk menunjukkan dependensi use case

### ER Diagram
- Menampilkan 40+ tabel database
- Semua relasi foreign key sudah terdefinisi
- Enum values ditampilkan untuk field yang menggunakan enum
- Mendukung multi-tenancy via `kepengurusan_lab_id`

---

## 🎯 Kegunaan Diagram

### Untuk Developer:
- Memahami arsitektur sistem secara keseluruhan
- Referensi saat develop fitur baru
- Dokumentasi teknis untuk onboarding tim baru

### Untuk Stakeholder:
- Visualisasi fitur sistem
- Memahami alur kerja dan permission setiap role
- Presentasi sistem ke pihak eksternal

### Untuk Database Administrator:
- Blueprint struktur database
- Referensi untuk optimasi query
- Dokumentasi skema untuk backup/migration

---

## 🔄 Update Diagram

Jika ada perubahan pada sistem:
1. Edit file `.puml` yang sesuai
2. Re-generate diagram
3. Update dokumentasi jika ada perubahan signifikan

---

## 📧 Kontak

Untuk pertanyaan atau saran terkait diagram ini, silakan hubungi tim development.

---

**Last Updated**: 2026-02-10
**Version**: 1.0.0
