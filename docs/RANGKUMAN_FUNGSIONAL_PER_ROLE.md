# Rangkuman Fungsional Sistem SILAB per Role (Format Nama + Aksi)

Dokumen ini merangkum fungsional sistem berdasarkan 5 role: **Admin, Asisten, Dosen, Kepala Departemen, dan Praktikan**.

Format penulisan menggunakan pola **nama role + aksinya**, contohnya:

- **Admin dapat menambahkan data tahun kepengurusan.**

---

## Dasar Verifikasi (Route & Permission)

Rangkuman ini disusun dengan memeriksa:

- Route aktif pada `routes/web.php`.
- Kelompok route lintas modul (`praktikum`, `piket`, `inventaris`, `kegiatan`, `surat-menyurat`, `lpj-kepengurusan`, dan lainnya).
- Permission aktual dari database (`permissions` total: 114).

Catatan audit penting:

- Hasil pengecekan runtime menunjukkan role `admin`, `asisten`, `kadep`, dan `praktikan` saat ini memiliki jumlah permission unik yang sama (`114`).
- Implementasi permission aktual masih perlu normalisasi agar perbedaan hak akses per role lebih tegas.

---

## 1) Role: Admin

### A. Kepengurusan

- Admin dapat menambahkan tahun kepengurusan.
- Admin dapat melihat tahun kepengurusan.
- Admin dapat memperbarui tahun kepengurusan.
- Admin dapat menghapus tahun kepengurusan.
- Admin dapat menambahkan data kepengurusan lab.
- Admin dapat melihat data kepengurusan lab.
- Admin dapat memperbarui data kepengurusan lab.
- Admin dapat menghapus data kepengurusan lab.
- Admin dapat menambahkan anggota kepengurusan.
- Admin dapat melihat anggota kepengurusan.
- Admin dapat memperbarui status anggota kepengurusan.
- Admin dapat menghapus anggota kepengurusan.

### B. Proker & Kegiatan

- Admin dapat menambahkan proker.
- Admin dapat melihat proker.
- Admin dapat memperbarui proker.
- Admin dapat menghapus proker.
- Admin dapat mengajukan proker.
- Admin dapat menyetujui proker.
- Admin dapat menolak proker.
- Admin dapat menambahkan parameter proker.
- Admin dapat melihat parameter proker.
- Admin dapat memperbarui parameter proker.
- Admin dapat menghapus parameter proker.
- Admin dapat menambahkan penanggung jawab proker.
- Admin dapat melihat penanggung jawab proker.
- Admin dapat memperbarui penanggung jawab proker.
- Admin dapat menghapus penanggung jawab proker.
- Admin dapat mengunggah dokumentasi proker.
- Admin dapat melihat dokumentasi proker.
- Admin dapat menghapus dokumentasi proker.
- Admin dapat menambahkan kegiatan.
- Admin dapat melihat kegiatan.
- Admin dapat memperbarui kegiatan.
- Admin dapat menghapus kegiatan.
- Admin dapat menyetujui kegiatan.
- Admin dapat menolak kegiatan.
- Admin dapat menambahkan peserta kegiatan.
- Admin dapat melihat peserta kegiatan.
- Admin dapat memperbarui status peserta kegiatan.
- Admin dapat menghapus peserta kegiatan.
- Admin dapat mengunggah dokumentasi kegiatan.
- Admin dapat melihat dokumentasi kegiatan.
- Admin dapat menghapus dokumentasi kegiatan.
- Admin dapat mengunggah file LPJ kegiatan.
- Admin dapat mengunduh file LPJ kegiatan.
- Admin dapat menghapus file LPJ kegiatan.
- Admin dapat membuat sertifikat kegiatan.
- Admin dapat mengunduh sertifikat kegiatan.

### C. LPJ Final Kepengurusan

- Admin dapat membuat draft LPJ final.
- Admin dapat melihat daftar LPJ final.
- Admin dapat melihat detail LPJ final.
- Admin dapat memperbarui draft LPJ final.
- Admin dapat menyegarkan rekap LPJ final.
- Admin dapat mengajukan LPJ final.
- Admin dapat menyetujui LPJ final.
- Admin dapat mengunci LPJ final.
- Admin dapat mengekspor LPJ final ke PDF.

### D. Praktikum

- Admin dapat menambahkan mata kuliah.
- Admin dapat melihat mata kuliah.
- Admin dapat memperbarui mata kuliah.
- Admin dapat menghapus mata kuliah.
- Admin dapat menambahkan praktikum.
- Admin dapat melihat praktikum.
- Admin dapat memperbarui praktikum.
- Admin dapat menghapus praktikum.
- Admin dapat menambahkan kelas.
- Admin dapat melihat kelas.
- Admin dapat memperbarui kelas.
- Admin dapat menghapus kelas.
- Admin dapat menambahkan subkelas.
- Admin dapat melihat subkelas.
- Admin dapat memperbarui subkelas.
- Admin dapat menghapus subkelas.
- Admin dapat meredistribusi praktikan antar kelas.
- Admin dapat meredistribusi pertemuan antar kelas.
- Admin dapat meredistribusi tugas antar kelas.
- Admin dapat menambahkan data praktikan manual.
- Admin dapat mengimpor data praktikan dari Excel.
- Admin dapat menetapkan pengguna ke data praktikan.
- Admin dapat melihat data praktikan.
- Admin dapat memperbarui status praktikan.
- Admin dapat menghapus data praktikan.
- Admin dapat menetapkan praktikan ke kelas.
- Admin dapat menambahkan data aslab.
- Admin dapat melihat data aslab.
- Admin dapat memperbarui data aslab.
- Admin dapat menghapus data aslab.
- Admin dapat menambahkan penugasan aslab.
- Admin dapat melihat penugasan aslab.
- Admin dapat memperbarui penugasan aslab.
- Admin dapat menghapus penugasan aslab.
- Admin dapat menambahkan pertemuan.
- Admin dapat melihat pertemuan.
- Admin dapat memperbarui pertemuan.
- Admin dapat menghapus pertemuan.
- Admin dapat menambahkan modul.
- Admin dapat melihat modul.
- Admin dapat memperbarui modul.
- Admin dapat menghapus modul.
- Admin dapat menambahkan tugas.
- Admin dapat melihat tugas.
- Admin dapat memperbarui tugas.
- Admin dapat menghapus tugas.
- Admin dapat menambahkan komponen rubrik.
- Admin dapat melihat komponen rubrik.
- Admin dapat memperbarui komponen rubrik.
- Admin dapat menghapus komponen rubrik.
- Admin dapat melihat pengumpulan tugas.
- Admin dapat mengunduh berkas pengumpulan tugas.
- Admin dapat menambahkan nilai rubrik.
- Admin dapat memperbarui nilai rubrik.
- Admin dapat menghapus nilai rubrik.
- Admin dapat menambahkan nilai tambahan.
- Admin dapat memperbarui nilai tambahan.
- Admin dapat menghapus nilai tambahan.
- Admin dapat mengekspor nilai.
- Admin dapat menambahkan absensi praktikan.
- Admin dapat melihat absensi praktikan.
- Admin dapat memperbarui absensi praktikan.
- Admin dapat menghapus absensi praktikan.
- Admin dapat menambahkan absensi aslab.
- Admin dapat melihat absensi aslab.
- Admin dapat memperbarui absensi aslab.
- Admin dapat menghapus absensi aslab.
- Admin dapat mengekspor absensi.
- Admin dapat mengunggah template sertifikat praktikum.
- Admin dapat membuat sertifikat praktikum.
- Admin dapat mendistribusikan sertifikat praktikum.
- Admin dapat mengunduh sertifikat praktikum.

### E. Piket

- Admin dapat menambahkan periode piket.
- Admin dapat melihat periode piket.
- Admin dapat memperbarui periode piket.
- Admin dapat menghapus periode piket.
- Admin dapat menambahkan jadwal piket.
- Admin dapat melihat jadwal piket.
- Admin dapat memperbarui jadwal piket.
- Admin dapat menghapus jadwal piket.
- Admin dapat menambahkan absensi piket manual.
- Admin dapat melihat absensi piket.
- Admin dapat memperbarui absensi piket.
- Admin dapat menghapus absensi piket.
- Admin dapat memverifikasi absensi piket.
- Admin dapat membatalkan verifikasi absensi piket.
- Admin dapat menyetujui penggantian jadwal piket.
- Admin dapat menolak penggantian jadwal piket.
- Admin dapat melihat rekap absensi piket.

### F. Keuangan

- Admin dapat menambahkan nominal kas.
- Admin dapat melihat nominal kas.
- Admin dapat memperbarui nominal kas.
- Admin dapat menghapus nominal kas.
- Admin dapat mengaktifkan nominal kas.
- Admin dapat menonaktifkan nominal kas.
- Admin dapat menambahkan pemasukan.
- Admin dapat melihat pemasukan.
- Admin dapat memperbarui pemasukan.
- Admin dapat menghapus pemasukan.
- Admin dapat menambahkan pengeluaran.
- Admin dapat melihat pengeluaran.
- Admin dapat memperbarui pengeluaran.
- Admin dapat menghapus pengeluaran.
- Admin dapat melihat catatan kas.
- Admin dapat melihat laporan keuangan.
- Admin dapat mengekspor laporan keuangan.

### G. Inventaris

- Admin dapat menambahkan kategori aset.
- Admin dapat melihat kategori aset.
- Admin dapat memperbarui kategori aset.
- Admin dapat menghapus kategori aset.
- Admin dapat menambahkan detail aset.
- Admin dapat melihat detail aset.
- Admin dapat memperbarui detail aset.
- Admin dapat menghapus detail aset.
- Admin dapat membuat QR/label aset.
- Admin dapat menambahkan riwayat kondisi aset.
- Admin dapat melihat riwayat kondisi aset.
- Admin dapat memperbarui riwayat kondisi aset.
- Admin dapat menambahkan permohonan aset.
- Admin dapat melihat permohonan aset.
- Admin dapat memperbarui permohonan aset.
- Admin dapat menyetujui permohonan aset.
- Admin dapat menolak permohonan aset.
- Admin dapat menghapus permohonan aset.
- Admin dapat menambahkan peminjaman aset.
- Admin dapat melihat peminjaman aset.
- Admin dapat memperbarui status peminjaman aset.
- Admin dapat menghapus peminjaman aset.

### H. Surat Menyurat

- Admin dapat menambahkan surat masuk.
- Admin dapat melihat surat masuk.
- Admin dapat memperbarui surat masuk.
- Admin dapat menghapus surat masuk.
- Admin dapat mengekspor surat masuk.
- Admin dapat menambahkan surat keluar.
- Admin dapat melihat surat keluar.
- Admin dapat memperbarui surat keluar.
- Admin dapat menghapus surat keluar.
- Admin dapat mengekspor surat keluar.
- Admin dapat menambahkan disposisi.
- Admin dapat melihat disposisi.
- Admin dapat memperbarui status disposisi.
- Admin dapat menghapus disposisi.
- Admin dapat melihat konfigurasi surat.
- Admin dapat memperbarui konfigurasi surat.

### I. Kuesioner

- Admin dapat menambahkan kuesioner.
- Admin dapat melihat kuesioner.
- Admin dapat memperbarui kuesioner.
- Admin dapat menghapus kuesioner.
- Admin dapat menambahkan pertanyaan kuesioner.
- Admin dapat melihat pertanyaan kuesioner.
- Admin dapat memperbarui pertanyaan kuesioner.
- Admin dapat menghapus pertanyaan kuesioner.
- Admin dapat menambahkan opsi jawaban.
- Admin dapat melihat opsi jawaban.
- Admin dapat memperbarui opsi jawaban.
- Admin dapat menghapus opsi jawaban.
- Admin dapat menetapkan target kuesioner.
- Admin dapat melihat hasil kuesioner.
- Admin dapat mengekspor hasil kuesioner.

---

## 2) Role: Asisten

### A. Proker & Kegiatan

- Asisten dapat menambahkan proker sesuai hak akses.
- Asisten dapat melihat proker sesuai hak akses.
- Asisten dapat memperbarui proker sesuai hak akses.
- Asisten dapat menghapus proker sesuai hak akses.
- Asisten dapat menambahkan kegiatan sesuai hak akses.
- Asisten dapat melihat kegiatan sesuai hak akses.
- Asisten dapat memperbarui kegiatan sesuai hak akses.
- Asisten dapat menghapus kegiatan sesuai hak akses.
- Asisten dapat mengunggah dokumentasi kegiatan.
- Asisten dapat melihat dokumentasi kegiatan.
- Asisten dapat mengunduh dokumentasi kegiatan.
- Asisten dapat menghapus dokumentasi kegiatan.
- Asisten dapat mengunggah LPJ kegiatan.
- Asisten dapat melihat LPJ kegiatan.
- Asisten dapat mengunduh LPJ kegiatan.
- Asisten dapat menghapus LPJ kegiatan.
- Asisten dapat menambahkan peserta kegiatan.
- Asisten dapat melihat peserta kegiatan.
- Asisten dapat memperbarui peserta kegiatan.
- Asisten dapat menghapus peserta kegiatan.
- Asisten dapat melihat kalender kegiatan.

### B. Praktikum

- Asisten dapat melihat praktikum yang ditugaskan.
- Asisten dapat melihat kelas yang ditugaskan.
- Asisten dapat melihat pertemuan yang ditugaskan.
- Asisten dapat menambahkan pertemuan jika diberi akses.
- Asisten dapat memperbarui pertemuan jika diberi akses.
- Asisten dapat menghapus pertemuan jika diberi akses.
- Asisten dapat menambahkan modul praktikum.
- Asisten dapat melihat modul praktikum.
- Asisten dapat memperbarui modul praktikum.
- Asisten dapat menghapus modul praktikum.
- Asisten dapat menambahkan tugas praktikum.
- Asisten dapat melihat tugas praktikum.
- Asisten dapat memperbarui tugas praktikum.
- Asisten dapat menghapus tugas praktikum.
- Asisten dapat melihat pengumpulan tugas.
- Asisten dapat mengunduh file pengumpulan.
- Asisten dapat menambahkan nilai rubrik.
- Asisten dapat memperbarui nilai rubrik.
- Asisten dapat menghapus nilai rubrik.
- Asisten dapat menambahkan nilai tambahan.
- Asisten dapat memperbarui nilai tambahan.
- Asisten dapat menghapus nilai tambahan.
- Asisten dapat menambahkan absensi praktikan.
- Asisten dapat melihat absensi praktikan.
- Asisten dapat memperbarui absensi praktikan.
- Asisten dapat menghapus absensi praktikan.
- Asisten dapat menambahkan absensi aslab.
- Asisten dapat melihat absensi aslab.
- Asisten dapat memperbarui absensi aslab.
- Asisten dapat menghapus absensi aslab.
- Asisten dapat melihat sertifikat praktikum sesuai hak akses.
- Asisten dapat mengunduh sertifikat praktikum sesuai hak akses.

### C. Piket

- Asisten dapat melihat jadwal piket pribadi.
- Asisten dapat melakukan check-in absensi piket.
- Asisten dapat melakukan check-out absensi piket.
- Asisten dapat mengajukan penggantian jadwal piket.
- Asisten dapat melihat status penggantian jadwal piket.
- Asisten dapat memperbarui penggantian jadwal piket sebelum diproses.
- Asisten dapat membatalkan penggantian jadwal piket sebelum diproses.

### D. Inventaris, Surat, dan Kuesioner

- Asisten dapat melihat daftar aset inventaris.
- Asisten dapat melihat detail aset inventaris.
- Asisten dapat menambahkan permohonan aset pribadi.
- Asisten dapat melihat status permohonan aset pribadi.
- Asisten dapat memperbarui permohonan aset pribadi.
- Asisten dapat menghapus permohonan aset pribadi.
- Asisten dapat menambahkan surat masuk sesuai izin.
- Asisten dapat melihat surat masuk sesuai izin.
- Asisten dapat memperbarui surat masuk sesuai izin.
- Asisten dapat menghapus surat masuk sesuai izin.
- Asisten dapat menambahkan surat keluar sesuai izin.
- Asisten dapat melihat surat keluar sesuai izin.
- Asisten dapat memperbarui surat keluar sesuai izin.
- Asisten dapat menghapus surat keluar sesuai izin.
- Asisten dapat mengisi jawaban kuesioner.
- Asisten dapat melihat riwayat respons kuesioner pribadi.

---

## 3) Role: Dosen

### A. Proker & Kegiatan

- Dosen dapat melihat daftar proker.
- Dosen dapat melihat detail proker.
- Dosen dapat menyetujui kegiatan sesuai alur persetujuan.
- Dosen dapat menolak kegiatan sesuai alur persetujuan.

### B. Surat Menyurat

- Dosen dapat menambahkan surat masuk.
- Dosen dapat melihat surat masuk.
- Dosen dapat memperbarui surat masuk.
- Dosen dapat menghapus surat masuk.
- Dosen dapat mengekspor surat masuk.
- Dosen dapat menambahkan surat keluar.
- Dosen dapat melihat surat keluar.
- Dosen dapat memperbarui surat keluar.
- Dosen dapat menghapus surat keluar.
- Dosen dapat mengekspor surat keluar.
- Dosen dapat menambahkan disposisi surat.
- Dosen dapat melihat disposisi surat.
- Dosen dapat memperbarui status disposisi surat.
- Dosen dapat menghapus disposisi surat.
- Dosen dapat melihat konfigurasi surat.
- Dosen dapat memperbarui konfigurasi surat.

### C. Kuesioner

- Dosen dapat melihat kuesioner aktif.
- Dosen dapat mengisi jawaban kuesioner.
- Dosen dapat melihat riwayat respons pribadi.

---

## 4) Role: Kepala Departemen

### A. Monitoring Strategis

- Kepala Departemen dapat melihat dashboard inventaris.
- Kepala Departemen dapat melihat dashboard keuangan.
- Kepala Departemen dapat melihat dashboard praktikum.
- Kepala Departemen dapat melihat dashboard piket.
- Kepala Departemen dapat melihat dashboard surat menyurat.
- Kepala Departemen dapat melihat dashboard hasil kuesioner.
- Kepala Departemen dapat melihat daftar aset.
- Kepala Departemen dapat melihat riwayat kondisi aset.
- Kepala Departemen dapat melihat pemasukan.
- Kepala Departemen dapat melihat pengeluaran.
- Kepala Departemen dapat melihat catatan kas.
- Kepala Departemen dapat melihat laporan keuangan.
- Kepala Departemen dapat melihat data pelaksanaan praktikum.
- Kepala Departemen dapat melihat rekap absensi piket.

### B. Persetujuan dan Keputusan

- Kepala Departemen dapat melihat daftar proker untuk evaluasi.
- Kepala Departemen dapat melihat daftar kegiatan untuk evaluasi.
- Kepala Departemen dapat menyetujui proker sesuai kebijakan.
- Kepala Departemen dapat menolak proker sesuai kebijakan.
- Kepala Departemen dapat menyetujui kegiatan sesuai kebijakan.
- Kepala Departemen dapat menolak kegiatan sesuai kebijakan.
- Kepala Departemen dapat melihat LPJ final kepengurusan.
- Kepala Departemen dapat menyetujui LPJ final kepengurusan.
- Kepala Departemen dapat mengunci LPJ final kepengurusan.
- Kepala Departemen dapat mengekspor LPJ final kepengurusan (PDF).

---

## 5) Role: Praktikan

### A. Praktikum Akademik

- Praktikan dapat melihat daftar tugas aktif.
- Praktikan dapat melihat detail tugas aktif.
- Praktikan dapat mengumpulkan tugas.
- Praktikan dapat memperbarui pengumpulan tugas sesuai aturan sistem.
- Praktikan dapat membatalkan pengumpulan tugas sesuai aturan sistem.
- Praktikan dapat melihat status pengumpulan.
- Praktikan dapat melihat nilai tugas.
- Praktikan dapat melihat modul praktikum.
- Praktikan dapat mengunduh modul praktikum.

### B. Layanan Pendukung

- Praktikan dapat melihat sertifikat pribadi.
- Praktikan dapat mengunduh sertifikat pribadi.
- Praktikan dapat melihat kuesioner aktif.
- Praktikan dapat mengisi jawaban kuesioner.
- Praktikan dapat melihat riwayat respons kuesioner pribadi.

---

## Catatan Implementasi Akses

- Dokumen ini sudah diseragamkan dalam format **nama role + aksinya**.
- Pada implementasi saat ini masih ditemukan kemiripan permission antar role (hasil audit runtime).
- Disarankan membuat matriks final **Role × Route Name × Permission** lalu menyinkronkan seeder agar kontrol akses lebih presisi per role.
