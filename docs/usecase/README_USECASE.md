# Dokumentasi Use Case Diagram - Sistem SILAB

## 📋 Daftar File Use Case Diagram

Dokumentasi ini berisi **9 Use Case Diagram** untuk semua modul sistem SILAB, dipecah per modul agar mudah di-render dan dibaca.

> **Format:** Setiap file menggunakan `left to right direction` dan `rectangle` sebagai boundary, sesuai best practice PlantUML.

---

### 📦 1. UC_01_INVENTARIS.puml
**Use Cases:** Lihat/Tambah/Edit/Hapus Aset, Tambah/Edit/Hapus Kategori, Ajukan Permohonan Pengadaan, Approve/Reject Permohonan, Lihat Daftar Permohonan  
**Aktor:** Admin, Asisten, Kadep

---

### 💰 2. UC_02_KEUANGAN.puml
**Use Cases:** Lihat/Catat/Edit/Hapus Transaksi, Kelola Nominal Kas, Rekap Bulanan, Export Excel, Catatan Kas  
**Aktor:** Admin, Kadep, Superadmin

---

### 🔬 3. UC_03_PRAKTIKUM.puml
**Use Cases:** CRUD Praktikum, Upload/Download Modul, Import/Tambah Praktikan, Assign Kelas & Aslab, Pertemuan, Absensi, Tugas, Rubrik, Penilaian, Export Nilai, Generate Sertifikat  
**Aktor:** Admin, Asisten, Praktikan, Superadmin

---

### 🎯 4. UC_04_KEGIATAN_PROKER.puml
**Use Cases:** CRUD Kegiatan, Approve/Reject, Upload LPJ, Peserta, Template & Generate Sertifikat, Kalender, CRUD Proker  
**Aktor:** Admin, Asisten, Dosen, Kadep, Superadmin

---

### 📅 5. UC_05_PIKET.puml
**Use Cases:** Buat Periode & Jadwal, Lihat Jadwal, Request/Approve Ganti Jadwal, Input Absensi, Rekap  
**Aktor:** Admin, Asisten, Kadep, Superadmin

---

### ✉️ 6. UC_06_SURAT.puml
**Use Cases:** Kirim Surat, Lihat Surat Masuk/Keluar, Tandai Dibaca, Download/Upload Lampiran  
**Aktor:** Admin, Asisten, Kadep

---

### 👥 7. UC_07_KEPENGURUSAN.puml
**Use Cases:** Lihat/Buat Periode, Set Aktif, Kelola Anggota, Transfer Periode, Upload SK, Kelola Jabatan, Data Lab, Role & Permissions, User Management  
**Aktor:** Superadmin, Kadep, Admin

---

### 🎓 8. UC_08_SERTIFIKAT.puml
**Use Cases:** Lihat & Download Sertifikat, Generate Sertifikat (Praktikum/Kegiatan), Upload Template  
**Aktor:** Admin, Praktikan, Asisten, Superadmin

---

### 📊 9. UC_09_KUESIONER.puml
**Use Cases:** Buat/Edit/Hapus Kuesioner, Isi Kuesioner, Lihat Hasil, Export Hasil  
**Aktor:** Admin, Superadmin, Kadep, Asisten, Praktikan, Dosen

---

## 🚀 Cara Render

### VS Code Extension
1. Install extension **"PlantUML"**
2. Buka file `.puml`
3. Tekan `Alt+D` untuk preview

### Online Editor
- https://www.plantuml.com/plantuml/uml/

---

**Last Updated:** 2026-02-18  
**Total Diagrams:** 9 | **Total Use Cases:** 80+
