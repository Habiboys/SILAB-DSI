# BAB V

# IMPLEMENTASI DAN PENGUJIAN SISTEM SILAB (SUPERAPP)

Dokumen ini merupakan draft Bab V versi lebih detail, tetapi tetap fokus pada inti implementasi dan pengujian. Penomoran disusun dengan kedalaman maksimal **4 digit** (contoh: 5.1.3.1).

---

## 5.1 Implementasi Sistem

### 5.1.1 Gambaran Implementasi Superapp

SILAB diimplementasikan sebagai superapp laboratorium yang menyatukan 9 domain fungsional: inventaris, keuangan, praktikum, kegiatan/proker, piket, surat menyurat, kepengurusan, sertifikat, dan kuesioner. Implementasi ini bertujuan:

- menghilangkan fragmentasi sistem per modul,
- memastikan satu sumber data utama untuk entitas bersama,
- mempercepat operasional lintas peran (Admin, Asisten, Dosen, Kadep, Praktikan).

### 5.1.2 Lingkungan Implementasi

Implementasi sistem dijalankan pada stack web modern dengan spesifikasi umum berikut:

1. **Perangkat lunak utama**
    - Backend: Laravel.
    - Frontend: React + Inertia.js + Vite.
    - Basis data: MySQL/MariaDB.
    - Version control: Git.

2. **Komponen aplikasi**
    - Lapisan HTTP: route, middleware, controller.
    - Lapisan domain: service, policy, observer.
    - Lapisan data: model, migration, relasi database.
    - Lapisan presentasi: halaman React berbasis role.

3. **Media penyimpanan**
    - Penyimpanan berkas: modul, tugas, LPJ, template sertifikat.
    - Berkas ekspor: Excel/PDF sesuai kebutuhan modul.

### 5.1.3 Implementasi Modul Inti

#### 5.1.3.1 Autentikasi dan Otorisasi

Implementasi autentikasi dan otorisasi mencakup:

- login dan session management,
- middleware autentikasi,
- policy dan permission untuk kontrol aksi,
- pembatasan akses menu, route, dan endpoint agar konsisten.

Aspek inti yang diimplementasikan:

- validasi kredensial,
- guard pada route sensitif,
- pemetaan role terhadap permission operasional,
- fallback respons untuk akses tidak sah.

#### 5.1.3.2 Modul Praktikum

Modul praktikum adalah domain paling kompleks karena memiliki relasi data berlapis (praktikum, kelas/subkelas, peserta, pertemuan, tugas, absensi, nilai, sertifikat).

Ruang lingkup implementasi:

1. Manajemen master praktikum (mata kuliah, praktikum, kelas, subkelas).
2. Manajemen peserta (praktikan dan aslab).
3. Manajemen konten pembelajaran (modul, pertemuan, tugas).
4. Penilaian (rubrik, nilai tambahan, rekap nilai).
5. Kehadiran (absensi praktikan dan aslab).
6. Ekspor data (nilai/absensi).

Aturan inti implementasi hierarki kelas:

- jika konteks kelas adalah **parent**, data turunan (descendant/subkelas) ikut dihitung;
- jika konteks kelas adalah **subclass**, data mengikuti rule sistem yang mengaitkan subclass dengan parent terkait;
- rule ini diterapkan konsisten pada daftar peserta, pertemuan, modul, tugas, absensi, dan ekspor.

#### 5.1.3.3 Modul Kegiatan/Proker dan LPJ

Implementasi modul ini mencakup:

- siklus proker (draft, ajukan, approve/reject, dokumentasi),
- siklus kegiatan (perencanaan, peserta, dokumentasi, LPJ),
- LPJ final (draft, review, lock, export).

Fokus implementasi:

- kontrol status proses,
- keterlacakan dokumen,
- konsistensi data antara list, detail, dan file hasil ekspor.

#### 5.1.3.4 Modul Piket

Implementasi modul piket mencakup:

- periode piket,
- jadwal piket,
- absensi piket,
- verifikasi dan pergantian jadwal,
- rekap kehadiran.

Tujuan implementasi adalah memastikan jadwal dan verifikasi absensi berjalan tertib serta mudah diaudit.

#### 5.1.3.5 Modul Keuangan

Implementasi modul keuangan mencakup:

- nominal kas,
- pemasukan,
- pengeluaran,
- rekap bulanan,
- laporan dan ekspor.

Kontrol utama implementasi:

- validasi nominal,
- keterhubungan transaksi dengan periode,
- konsistensi total rekap terhadap detail transaksi.

#### 5.1.3.6 Modul Inventaris

Implementasi modul inventaris mencakup:

- kategori aset,
- detail aset,
- riwayat kondisi,
- permohonan pengadaan,
- peminjaman/pengembalian,
- QR/label aset.

Fokus implementasi pada traceability aset dari kondisi awal, peminjaman, hingga histori perubahan status.

#### 5.1.3.7 Modul Surat dan Kepengurusan

Implementasi meliputi:

- surat masuk/keluar,
- disposisi,
- konfigurasi surat,
- periode kepengurusan,
- anggota dan struktur jabatan.

Fokus utama:

- status surat dan disposisi yang terpantau,
- pengelolaan periode organisasi yang konsisten.

#### 5.1.3.8 Modul Kuesioner

Implementasi modul kuesioner mencakup:

- pembuatan kuesioner,
- pertanyaan dan opsi,
- target responden,
- periode aktif,
- hasil dan ekspor.

Aspek inti:

- validasi periode,
- kontrol target role,
- konsistensi data jawaban terhadap statistik hasil.

### 5.1.4 Implementasi Integrasi Antar Modul

Integrasi superapp diimplementasikan melalui:

1. **Master data bersama** (user, role, profil, periode, kelas, lab).
2. **Standar komponen UI** (tabel, filter, pencarian, badge status, modal).
3. **Standar proses data** (validasi request, format respons, penanganan error).
4. **Konsistensi navigasi** antar modul tanpa kehilangan konteks role dan entitas aktif.

Contoh integrasi yang kritikal:

- profile user memengaruhi data praktikan/aslab,
- konteks kelas memengaruhi data praktikum lintas halaman,
- status dokumen berpengaruh pada alur approval dan pelaporan.

### 5.1.5 Implementasi Keamanan, Validasi, dan Audit

Aspek yang diterapkan:

- validasi input server-side,
- otorisasi berbasis role dan permission,
- policy untuk aksi sensitif,
- pembatasan akses route dan endpoint,
- logging aktivitas penting,
- penanganan exception terstruktur.

Kontrol validasi minimal:

- validasi tipe data dan relasi ID,
- validasi status proses sebelum transisi,
- validasi batas akses berdasarkan role.

### 5.1.6 Implementasi Antarmuka Pengguna

Prinsip implementasi antarmuka:

1. Konsisten: pola list-detail-form seragam antar modul.
2. Efisien: pencarian, filter, dan pagination tersedia pada data besar.
3. Informatif: indikator status proses jelas (draft, diajukan, disetujui, ditolak, terkunci).
4. Aman: aksi sensitif diberi konfirmasi dan validasi.

Komponen antarmuka inti:

- dashboard per role,
- halaman daftar data,
- halaman detail relasional,
- upload/download dokumen,
- export laporan.

### 5.1.7 Kajian Kelengkapan Penjelasan Implementasi

Setelah dikaji ulang, bagian implementasi umumnya perlu menambahkan 5 hal agar dinilai lengkap di naskah akademik:

1. **Alur data per modul**
    - dari input pengguna → validasi → simpan → tampilkan hasil.

2. **Rule bisnis eksplisit**
    - contoh rule kelas parent-subclass pada modul praktikum.

3. **Alasan keputusan teknis**
    - mengapa memakai arsitektur modular monolith dan shared master data.

4. **Mekanisme fallback/error handling**
    - bagaimana sistem merespons data kosong, relasi tidak valid, atau akses ditolak.

5. **Keterhubungan antar modul**
    - bukan hanya fitur berdiri sendiri, tetapi integrasi data superapp.

---

## 5.2 Pengujian Sistem

### 5.2.1 Metodologi Pengujian

Pengujian menggunakan kombinasi:

1. **Functional Black Box Testing**.
2. **Role-Based Access Testing**.
3. **Integration Testing** lintas modul.
4. **Regression Testing** setelah perubahan fitur.
5. **User Acceptance Testing (UAT)**.

### 5.2.2 Desain Item Uji

#### 5.2.2.1 Cakupan Fungsional Inti

Pengujian fungsional meliputi:

- CRUD data master,
- transaksi dan dokumen,
- proses approval,
- ekspor laporan,
- pencarian/filter/pagination.

#### 5.2.2.2 Cakupan Role dan Otorisasi

Pengujian role menilai:

- role yang berhak dapat mengakses fitur,
- role yang tidak berhak ditolak,
- konsistensi permission antara menu, route, dan endpoint.

#### 5.2.2.3 Cakupan Integrasi Superapp

Pengujian integrasi menilai:

- konsistensi data antar halaman dan antar modul,
- konsistensi relasi master data,
- konsistensi rule kelas parent-subclass pada modul praktikum.

#### 5.2.2.4 Cakupan Non-Fungsional

Pengujian non-fungsional menilai:

- performa list data besar,
- reliabilitas upload/download,
- stabilitas sistem saat beban normal,
- kompatibilitas browser.

### 5.2.3 Data Uji dan Lingkungan Uji

Agar hasil pengujian representatif, data uji minimal mencakup:

- beberapa role aktif,
- data modul dengan volume kecil, sedang, besar,
- variasi status proses (draft, submit, approve/reject, lock),
- data hierarki kelas parent dengan beberapa subkelas.

Lingkungan uji:

- browser utama yang digunakan pengguna,
- basis data pengujian terpisah,
- storage pengujian untuk berkas upload.

### 5.2.4 Kriteria Kelulusan

Kriteria lulus yang disarankan:

1. Seluruh item P1 lulus 100%.
2. Seluruh item P2 lulus minimal 95%.
3. Tidak ada defect kritikal pada login, otorisasi, penyimpanan data, dan ekspor.
4. Integrasi parent-subclass pada praktikum konsisten lintas halaman.

### 5.2.5 Format Pelaporan Hasil Uji

Format tabel hasil uji:

- ID Uji,
- Modul,
- Skenario,
- Prasyarat,
- Data Masukan,
- Hasil Diharapkan,
- Hasil Aktual,
- Status,
- Bukti Uji,
- Catatan Perbaikan.

### 5.2.6 Rencana Eksekusi Pengujian

Urutan eksekusi yang disarankan:

1. Auth dan otorisasi.
2. Modul praktikum (fitur kritikal).
3. Modul transaksi (keuangan, inventaris, surat).
4. Modul operasional (kegiatan, piket, kuesioner).
5. Uji integrasi lintas modul.
6. UAT akhir.

---

## 5.3 Rancangan Struktur Bab 5 dan Subbab (Final)

Struktur di bawah ini sudah mengikuti batas penomoran maksimal 4 digit:

1. **5.1 Implementasi Sistem**
    1. 5.1.1 Gambaran Implementasi Superapp
    2. 5.1.2 Lingkungan Implementasi
    3. 5.1.3 Implementasi Modul Inti
        1. 5.1.3.1 Autentikasi dan Otorisasi
        2. 5.1.3.2 Praktikum
        3. 5.1.3.3 Kegiatan/Proker dan LPJ
        4. 5.1.3.4 Piket
        5. 5.1.3.5 Keuangan
        6. 5.1.3.6 Inventaris
        7. 5.1.3.7 Surat dan Kepengurusan
        8. 5.1.3.8 Kuesioner
    4. 5.1.4 Integrasi Antar Modul
    5. 5.1.5 Keamanan, Validasi, dan Audit
    6. 5.1.6 Implementasi Antarmuka
    7. 5.1.7 Kajian Kelengkapan Penjelasan

2. **5.2 Pengujian Sistem**
    1. 5.2.1 Metodologi Pengujian
    2. 5.2.2 Desain Item Uji
        1. 5.2.2.1 Cakupan Fungsional
        2. 5.2.2.2 Cakupan Role
        3. 5.2.2.3 Cakupan Integrasi
        4. 5.2.2.4 Cakupan Non-Fungsional
    3. 5.2.3 Data dan Lingkungan Uji
    4. 5.2.4 Kriteria Kelulusan
    5. 5.2.5 Format Pelaporan Hasil
    6. 5.2.6 Rencana Eksekusi Uji

3. **5.3 Kesimpulan Bab**
    1. 5.3.1 Capaian Implementasi
    2. 5.3.2 Capaian Pengujian
    3. 5.3.3 Keterbatasan dan Rencana Pengembangan

---

## 5.4 Catatan Penguatan Bab V

Supaya Bab V lebih kuat saat diuji dosen pembimbing/penguji:

- tampilkan minimal 1 contoh alur end-to-end per modul inti,
- tampilkan minimal 1 kasus gagal + perbaikannya,
- tampilkan bukti konsistensi data lintas halaman,
- tampilkan ringkasan statistik hasil uji (pass/fail per modul),
- tampilkan kesimpulan objektif berbasis data pengujian.

Detail item uji super lengkap tersedia pada:

- [docs/ITEM_UJI_SILAB_AMAT_LENGKAP.md](docs/ITEM_UJI_SILAB_AMAT_LENGKAP.md)
