# Fitur Export Nilai Tugas Praktikum

## Deskripsi
Fitur ini memungkinkan admin untuk mengekspor nilai tugas praktikum dalam format Excel (.xlsx) yang dipisahkan berdasarkan kelas. Setiap kelas akan memiliki sheet terpisah, dan ada sheet ringkasan yang berisi informasi tugas dan statistik per kelas.

## Fitur Utama

### 1. Export Terpisah Per Kelas
- Setiap kelas memiliki sheet Excel terpisah
- Data praktikan diurutkan berdasarkan kelas
- Informasi lengkap untuk setiap praktikan

### 2. Data yang Diekspor
Untuk setiap praktikan, data yang diekspor meliputi:
- No (nomor urut)
- NIM
- Nama
- Status Pengumpulan (Sudah Dinilai, Terlambat, Dikumpulkan, Belum Mengumpulkan)
- Tanggal Pengumpulan
- Nilai Dasar (nilai dari rubrik atau manual)
- Detail Nilai Rubrik (breakdown per komponen)
- Nilai Tambahan (bonus)
- Total Nilai (nilai dasar + bonus, maksimal 100)
- Feedback

### 3. Sheet Ringkasan
- Informasi tugas (judul, mata kuliah, deadline)
- Tanggal export
- Statistik per kelas (total praktikan, sudah kumpul, sudah dinilai, terlambat, belum kumpul)

## Cara Menggunakan

### 1. Akses Halaman Submissions
- Masuk ke halaman tugas praktikum
- Klik pada tugas yang ingin diekspor nilainya
- Pilih tab "Pengumpulan Tugas"

### 2. Export Nilai
- Klik tombol "Export Nilai" (ikon spreadsheet ungu)
- File Excel akan otomatis terdownload
- Nama file: `Nilai_Tugas_[Judul_Tugas]_[Tanggal_Waktu].xlsx`

## Struktur File Excel

### Sheet Per Kelas
- Header dengan styling biru
- Data praktikan dalam tabel
- Auto-sizing kolom
- Border pada semua sel

### Sheet Ringkasan
- Informasi tugas
- Statistik per kelas
- Styling yang konsisten

## Teknologi yang Digunakan

### Backend
- **Laravel Excel (Maatwebsite)**: Untuk generate file Excel
- **Multiple Sheets**: Menggunakan `WithMultipleSheets` interface
- **Styling**: PhpSpreadsheet untuk styling Excel

### Frontend
- **React/Inertia**: Button export di halaman submissions
- **Lucide Icons**: Ikon FileSpreadsheet untuk button

## File yang Dimodifikasi

### 1. Export Class
- `app/Exports/TugasSubmissionExport.php` - Class utama untuk export
- `app/Exports/TugasSubmissionSheet.php` - Sheet per kelas
- `app/Exports/TugasSubmissionSummarySheet.php` - Sheet ringkasan

### 2. Controller
- `app/Http/Controllers/PengumpulanTugasController.php` - Method `exportGrades()`

### 3. Routes
- `routes/web.php` - Route untuk export: `praktikum/tugas/{tugas}/export-grades`

### 4. Frontend
- `resources/js/Pages/TugasPraktikum/TugasSubmissions.jsx` - Button export

## Keamanan
- Hanya admin yang memiliki akses ke fitur ini
- Route dilindungi dengan middleware `active.kepengurusan:praktikum`
- Validasi tugas ID untuk mencegah akses tidak sah

## Catatan Penting
- File Excel akan berisi data real-time saat export dilakukan
- Nilai tambahan (bonus) akan ditampilkan dengan tanda "+"
- Total nilai dibatasi maksimal 100
- Praktikan yang belum mengumpulkan tetap muncul dengan status "Belum Mengumpulkan"
