# Dokumentasi BPMN - Sistem SILAB

## 📋 Daftar File BPMN Diagram

Dokumentasi ini berisi **9 BPMN diagram** (Business Process Model and Notation) untuk semua modul utama sistem SILAB, dibuat menggunakan PlantUML Activity Diagram dengan swimlanes.

---

### 📦 1. BPMN_01_INVENTARIS.puml
**Modul:** Inventaris (Manajemen Aset)

**Proses Bisnis:**
- Kelola Aset (CRUD)
- Kelola Kategori Aset
- Proses Permohonan Pengadaan (Ajukan → Review → Approve/Reject)

**Aktor:** Admin, Asisten

---

### 💰 2. BPMN_02_KEUANGAN.puml
**Modul:** Keuangan

**Proses Bisnis:**
- Catat Transaksi (Pemasukan / Pengeluaran)
- Kelola Nominal Kas
- Lihat Rekap & Catatan Kas Bulanan
- Export Laporan Excel

**Aktor:** Admin, Kadep

---

### 🔬 3. BPMN_03_PRAKTIKUM.puml
**Modul:** Praktikum (Core Academic Module)

**Proses Bisnis (4 Fase):**
1. **Setup:** Buat praktikum, assign aslab, upload modul, import praktikan
2. **Pertemuan & Absensi:** Buat pertemuan, input absensi, export rekap
3. **Tugas & Penilaian:** Buat tugas, submit jawaban, penilaian (rubrik/manual)
4. **Sertifikat:** Upload template, generate sertifikat per penerima

**Aktor:** Admin, Asisten, Praktikan

---

### 🎯 4. BPMN_04_KEGIATAN_PROKER.puml
**Modul:** Kegiatan & Program Kerja

**Proses Bisnis:**
- Buat & Update Status Program Kerja
- Pengajuan Kegiatan (Submit → Review → Approve/Reject)
- Pelaksanaan (Tambah Peserta, Upload LPJ)
- Generate Sertifikat Kegiatan

**Aktor:** Admin, Asisten, Dosen/Kadep

---

### 📅 5. BPMN_05_PIKET.puml
**Modul:** Piket (Shift Management)

**Proses Bisnis:**
- Setup Periode & Jadwal Piket
- Operasional Harian (Check-in / Check-out)
- Request & Approval Ganti Jadwal
- Rekap Absensi Piket

**Aktor:** Admin, Asisten

---

### ✉️ 6. BPMN_06_SURAT.puml
**Modul:** Surat Menyurat

**Proses Bisnis:**
- Kirim Surat (+ Upload Lampiran)
- Terima & Baca Surat Masuk
- Riwayat Surat Keluar

**Aktor:** Pengirim (Asisten/Kadep), Penerima (Lab Lain)

---

### 👥 7. BPMN_07_KEPENGURUSAN.puml
**Modul:** Kepengurusan & Anggota

**Proses Bisnis:**
- Setup Periode Kepengurusan (Buat Tahun → Buat Kepengurusan Lab → Aktifkan)
- Kelola Anggota (Tambah Manual / Transfer dari Periode Lama)
- Auto-assign Role & Dynamic Permissions
- Mode Read-Only untuk Periode Non-Aktif

**Aktor:** Superadmin/Kadep, Admin

---

### 🎓 8. BPMN_08_SERTIFIKAT.puml
**Modul:** Sertifikat

**Proses Bisnis:**
- Persiapan Template (Buat .docx + upload)
- Generate Sertifikat (Pilih penerima → Replace placeholder → Simpan)
- Download Sertifikat oleh User

**Aktor:** Admin, User (Penerima)

---

### 📊 9. BPMN_09_KUESIONER.puml
**Modul:** Kuesioner / Survey

**Proses Bisnis:**
- Pembuatan Kuesioner (Internal form / Eksternal link)
- Pengisian oleh Responden (Cek target role → Isi → Submit)
- Analisis Hasil (Statistik + Export Excel)

**Aktor:** Admin, User (Responden)

---

## 📊 Statistik Total

| Kategori | Jumlah |
|:---------|:------:|
| **Total File BPMN** | 9 |
| **Total Modul** | 9 |
| **Total Proses Bisnis** | 30+ |

---

## 🚀 Cara Menggunakan

### 1. VS Code Extension
1. Install extension **"PlantUML"**
2. Buka file `.puml`
3. Tekan `Alt+D` untuk preview
4. Klik kanan → **"Export Current Diagram"** untuk save sebagai gambar

### 2. Online Editor
- Buka: https://www.plantuml.com/plantuml/uml/
- Copy-paste isi file
- Klik **"Submit"**

### 3. Command Line
```bash
# Install PlantUML
npm install -g node-plantuml

# Generate semua diagram
plantuml docs/bpmn/BPMN_*.puml

# Generate specific module
plantuml docs/bpmn/BPMN_03_PRAKTIKUM.puml
```

---

## 🎨 Konvensi Diagram

### Swimlane Colors
| Aktor | Warna |
|:------|:------|
| Superadmin | `#ff6b6b` (merah) |
| Kadep | `#4ecdc4` (teal) |
| Admin | `#45b7d1` (biru) |
| Asisten | `#95e1d3` (hijau muda) |
| Praktikan/User | `#f9ca24` (kuning) |
| Dosen | `#a29bfe` (ungu) |
| Sistem | `#dfe6e9` (abu-abu) |

### Elemen BPMN
- **partition**: Mengelompokkan proses menjadi fase
- **fork/fork again**: Proses paralel
- **if/elseif/else**: Decision point
- **while/endwhile**: Loop/iterasi
- **note**: Catatan penting

---

**Created by:** AI Assistant  
**Last Updated:** 2026-02-18  
**Version:** 1.0.0  
**Coverage:** 9 Modul (30+ proses bisnis)
