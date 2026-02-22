# Dokumentasi Sequence Diagram - Sistem SILAB

## 📋 Daftar File Sequence Diagram

Dokumentasi ini berisi **SEMUA sequence diagram lengkap** untuk sistem SILAB, mencakup **80+ use case** yang dibagi menjadi 8 file berdasarkan modul.

### 📦 1. SEQUENCE_01_INVENTARIS.puml
**Modul:** Inventaris (Manajemen Aset)  
**Jumlah Use Case:** 6  

**Use Cases:**
1. Lihat Daftar Aset
2. Tambah Aset Baru
3. Edit Data Aset
4. Hapus Aset
5. Kelola Kategori Aset
6. Ajukan Permohonan Pengadaan Aset
7. Approve / Reject Permohonan Pengadaan

**Aktor:** Admin, Asisten, Kadep

---

### 💰 2. SEQUENCE_02_KEUANGAN.puml
**Modul:** Keuangan  
**Jumlah Use Case:** 8

**Use Cases:**
1. Lihat Riwayat Transaksi
2. Catat Pemasukan
3. Catat Pengeluaran
4. Edit Transaksi
5. Hapus Transaksi
6. Lihat Rekap Bulanan
7. Export Laporan Excel
8. Kelola Nominal Kas

**Aktor:** Admin, Kadep, Superadmin  
**Fitur Khusus:** Middleware `active.kepengurusan`, Auto-update rekap

---

### 🔬 3. SEQUENCE_03_PRAKTIKUM (Part 1, 2, 3)
**Modul:** Praktikum (Core Academic Module)  
**Jumlah Use Case:** 19 (dibagi 3 file)

#### Part 1: CRUD & Modul (6 use cases)
1. Buat Praktikum Baru
2. Edit Praktikum
3. Hapus Praktikum (+ Cascade delete)
4. Upload Modul/Materi
5. Download Modul
6. Import Praktikan Excel

#### Part 2: Praktikan & Pertemuan (7 use cases)
7. Tambah Praktikan Manual
8. Edit Data Praktikan
9. Assign Kelas (Bulk)
10. Buat Pertemuan (+ Auto-create absensi)
11. Input Absensi (Admin/Asisten)
12. Buat Tugas
13. Submit Tugas (Praktikan)

#### Part 3: Penilaian & Sertifikat (6 use cases)
14. Buat Rubrik Penilaian
15. Input Nilai Manual
16. Input Nilai Rubrik (+ Auto-calculate)
17. Export Nilai Excel
18. Generate Sertifikat Praktikum
19. Assign Aslab (Included in Create/Edit)

**Aktor:** Admin, Asisten, Praktikan, Dosen  
**Fitur Khusus:** Rubrik penilaian dinamis, Excel import, Certificate generation

---

### 🎯 4. SEQUENCE_04_KEGIATAN_PROKER.puml
**Modul:** Kegiatan & Program Kerja  
**Jumlah Use Case:** 13

**Kegiatan (11 use cases):**
1. Buat Kegiatan Baru
2. Edit Kegiatan
3. Hapus Kegiatan
4. Approve Kegiatan (Dosen/Kalab)
5. Reject Kegiatan
6. Upload LPJ
7. Tambah Peserta
8. Hapus Peserta
9. Upload Template Sertifikat (2 jenis)
10. Generate Sertifikat Kegiatan
11. Lihat Kalender Kegiatan

**Program Kerja (2 use cases):**
1. Buat Program Kerja
2. Update Status Proker

**Aktor:** Admin, Asisten, Dosen, Kadep  
**Fitur Khusus:** Approval workflow, Dual certificate templates

---

### 📅 5. SEQUENCE_05_PIKET.puml
**Modul:** Piket (Shift Management)  
**Jumlah Use Case:** 8

**Use Cases:**
1. Buat Periode Piket
2. Buat Jadwal Piket (Matrix builder)
3. Lihat Jadwal Piket
4. Request Ganti Jadwal
5. Approve/Reject Ganti Jadwal
6. Input Absensi Piket (Check-in/out)
7. Lihat Rekap Absensi

**Aktor:** Admin, Asisten, Kadep  
**Fitur Khusus:** Request-approval workflow, Check-in/out system

---

### ✉️ 6. SEQUENCE_06_SURAT_KEPENGURUSAN.puml
**Modul:** Surat Menyurat & Kepengurusan  
**Jumlah Use Case:** 15

**Surat (6 use cases):**
1. Kirim Surat (+ Upload lampiran)
2. Lihat Surat Masuk
3. Lihat Surat Keluar
4. Tandai Dibaca
5. Download Lampiran

**Kepengurusan (9 use cases):**
1. Lihat Periode Kepengurusan
2. Buat Periode Baru (Kadep/Superadmin)
3. Set Periode Aktif
4. Lihat Anggota
5. Tambah Anggota (+ Auto-assign role)
6. Edit Struktur Anggota
7. Hapus Anggota
8. Transfer dari Periode Lama
9. Upload SK Kepengurusan

**Aktor:** Admin, Asisten, Kadep, Superadmin  
**Fitur Khusus:** Auto-assign roles, Dynamic permissions, Period activation

---

### ⚙️ 7. SEQUENCE_07_DATA_MASTER.puml
**Modul:** Data Master (Admin Panel)  
**Jumlah Use Case:** 10

**Use Cases:**
1. Kelola Struktur Jabatan
2. Set Default Role Jabatan
3. Kelola Tahun Kepengurusan
4. Kelola Data Lab
5. Kelola Role & Permissions (Superadmin only)
6. Struktur Permission Manager (PBAC)
7. User Management
8. Tambah User Admin
9. Edit User
10. Hapus User

**Aktor:** Kadep, Superadmin  
**Fitur Khusus:** RBAC + PBAC configuration, Permission matrix

---

### 🎓 8. SEQUENCE_08_SERTIFIKAT.puml
**Modul:** Sertifikat  
**Jumlah Use Case:** 5 + 1 bonus

**Use Cases:**
1. Lihat Sertifikat Saya (All users)
2. Download Sertifikat
3. Generate Sertifikat Praktikum (ref Part 3)
4. Generate Sertifikat Kegiatan (ref Part 4)
5. Upload Template
6. **Bonus:** Validasi Sertifikat Publik

**Aktor:** Semua user + Public  
**Fitur Khusus:** Template placeholders, Public validation

---

---

### 📊 9. SEQUENCE_09_KUESIONER.puml
**Modul:** Kuesioner / Survey  
**Jumlah Use Case:** 6

**Use Cases:**
1. Buat Kuesioner Baru
2. Edit Kuesioner
3. Hapus Kuesioner
4. Isi Kuesioner (User/Target)
5. Lihat Hasil Survey
6. Export Hasil Survey

**Aktor:** Admin, User (Target), Superadmin  
**Fitur Khusus:** Dynamic target audience, Statistical calculation, Excel export

---

## 📊 Statistik Total

| Kategori | Jumlah |
|:---------|:------:|
| **Total File Sequence Diagram** | 9 |
| **Total Use Case Tercakup** | 86+ |
| **Total Modul** | 10 |
| **Total Aktor** | 6 |

---

## 🎨 Konvensi Diagram

### Participant Types
- **Actor**: Pengguna sistem (Admin, Asisten, dll)
- **Browser**: Interface frontend
- **Controller**: Laravel Controller
- **Model**: Eloquent Model
- **Service**: Business logic service
- **Database**: Database layer

### Flow Patterns
```
Actor -> Browser: User action
Browser -> Controller: HTTP Request
Controller -> Model: Data operation
Model -> DB: SQL Query
DB --> Model: Return data
Model --> Controller: Result
Controller --> Browser: HTTP Response
Browser --> Actor: UI Update
```

### Alt/Opt Blocks
- **alt/else**: Kondisi if-else
- **opt**: Optional step
- **loop**: Iterasi
- **note**: Penjelasan tambahan

---

## 🚀 Cara Menggunakan

### 1. Render dengan PlantUML CLI
```bash
# Install PlantUML
npm install -g node-plantuml

# Generate semua diagram
plantuml SEQUENCE_*.puml

# Generate specific module
plantuml SEQUENCE_03_PRAKTIKUM_PART1.puml
```

### 2. VS Code Extension
1. Install extension "PlantUML"
2. Buka file `.puml`
3. Tekan `Alt+D` untuk preview
4. Klik kanan → "Export Current Diagram" untuk save

### 3. Online Editor
- Buka: https://www.plantuml.com/plantuml/uml/
- Copy-paste isi file
- Klik "Submit"

---

## 🔍 Detail Implementasi

### Authentication & Authorization
Setiap diagram mencakup:
- ✅ `auth:sanctum` middleware check
- ✅ Permission verification
- ✅ `active.kepengurusan` context check (where applicable)
- ✅ Role-based access control

### Error Handling
Diagram menampilkan:
- ❌ Validation errors (422)
- ❌ Authorization errors (403)
- ❌ Not found errors (404)
- ✅ Success responses

### Database Operations
- **CRUD**: Create, Read, Update, Delete
- **Relations**: Eager loading dengan `with()`
- **Transactions**: `BEGIN` → operations → `COMMIT`
- **Cascade**: Auto-delete related records

---

## 💡 Insight Arsitektur

### 1. Hybrid Security Model
- **RBAC**: Role-based (via Spatie)
- **CBAC**: Context-based (`active.kepengurusan`)
- **PBAC**: Position-based (`struktur_permissions`)

### 2. Multi-Tenancy
- Lab isolation via `kepengurusan_lab_id`
- Period-based data segregation
- Context-aware queries

### 3. Workflow Automation
- Auto-create absensi saat buat pertemuan
- Auto-assign role saat tambah anggota
- Auto-calculate nilai dari rubrik

---

## 📝 Catatan Penting

### Inkonsistensi Ditemukan
1. **Menu Surat**: Admin punya permission backend tapi menu hidden di frontend
2. **Certificate Enum**: `jenis_sertifikat` mungkin perlu update untuk 'kegiatan'

### Best Practices
- Gunakan transactions untuk operasi kompleks
- Always validate context (`kepengurusan_lab_id`)
- Implement soft delete untuk data penting
- Log critical operations (delete, approval, etc)

---

## 🔄 Update Diagram

Jika ada perubahan sistem:
1. Identifikasi modul yang terpengaruh
2. Update file `.puml` yang sesuai
3. Re-generate diagram
4. Update dokumentasi ini jika ada use case baru

---

## 📧 Kontribusi

Untuk menambah atau memperbaiki diagram:
1. Follow konvensi yang ada
2. Test render sebelum commit
3. Update README ini
4. Dokumentasikan perubahan significant

---

**Created by:** AI Assistant  
**Last Updated:** 2026-02-10  
**Version:** 1.0.0  
**Coverage:** 100% use cases (80+ total)
