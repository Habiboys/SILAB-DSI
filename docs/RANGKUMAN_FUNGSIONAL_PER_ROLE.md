# Rangkuman Fungsional Sistem SILAB per Role (Detail Aksi)

Dokumen ini merangkum fungsional sistem berdasarkan 5 role laporan: **Admin, Asisten, Dosen, Kepala Departemen, dan Praktikan**.

Format penulisan dibuat **aksi-per-aksi** (contoh: create, read, update, delete, approve, reject, export), bukan istilah umum.

---

## Dasar Verifikasi (Route & Permission)

Rangkuman ini disusun dengan memeriksa:

- Route aktif pada `routes/web.php`.
- Kelompok route bernama lintas modul (`praktikum`, `piket`, `inventaris`, `kegiatan`, `surat-menyurat`, `lpj-kepengurusan`, dll).
- Permission aktual dari database (`permissions` total: 114).

Catatan audit penting:

- Hasil pengecekan runtime menunjukkan role `admin`, `asisten`, `kadep`, dan `praktikan` saat ini memiliki jumlah permission unik yang sama (`114`).
- Artinya, implementasi permission aktual masih perlu normalisasi agar beda per role benar-benar tegas.

---

## 1) Role: Admin

### A. Kepengurusan

- Create data tahun kepengurusan.
- Read daftar tahun kepengurusan.
- Update data tahun kepengurusan.
- Delete data tahun kepengurusan.
- Create data kepengurusan lab.
- Read daftar dan detail kepengurusan lab.
- Update data kepengurusan lab.
- Delete data kepengurusan lab.
- Create data anggota kepengurusan (`kepengurusan_user`).
- Read daftar anggota kepengurusan.
- Update status anggota (aktif/nonaktif).
- Delete data anggota kepengurusan.

### B. Proker & Kegiatan

- Create proker.
- Read daftar dan detail proker.
- Update proker.
- Delete proker.
- Submit proker untuk diajukan.
- Approve proker.
- Reject proker.
- Create parameter proker.
- Read parameter proker.
- Update parameter proker.
- Delete parameter proker.
- Create penanggung jawab proker (`proker_pj`).
- Read daftar PJ proker.
- Update PJ proker.
- Delete PJ proker.
- Upload dokumentasi proker.
- Read dokumentasi proker.
- Delete dokumentasi proker.
- Create kegiatan.
- Read daftar dan detail kegiatan.
- Update kegiatan.
- Delete kegiatan.
- Approve kegiatan.
- Reject kegiatan.
- Create peserta kegiatan.
- Read daftar peserta kegiatan.
- Update status peserta (termasuk kelulusan/sertifikat).
- Delete peserta kegiatan.
- Upload dokumentasi kegiatan.
- Read dokumentasi kegiatan.
- Delete dokumentasi kegiatan.
- Upload file LPJ kegiatan.
- Download file LPJ kegiatan.
- Delete file LPJ kegiatan.
- Generate sertifikat kegiatan.
- Download sertifikat kegiatan.

### C. LPJ Final Kepengurusan

- Create draft LPJ final dari agregasi data.
- Read daftar LPJ final.
- Read detail LPJ final.
- Update draft LPJ final.
- Refresh ringkasan/rekap LPJ final.
- Submit LPJ final ke status review.
- Approve LPJ final.
- Lock LPJ final.
- Export LPJ final ke PDF.

### D. Praktikum

- Create mata kuliah.
- Read daftar mata kuliah.
- Update mata kuliah.
- Delete mata kuliah.
- Create praktikum.
- Read daftar dan detail praktikum.
- Update praktikum.
- Delete praktikum.
- Create kelas dan subkelas.
- Read daftar kelas/subkelas.
- Update kelas/subkelas.
- Delete kelas/subkelas.
- Redistribusi praktikan antar kelas.
- Redistribusi pertemuan antar kelas.
- Redistribusi tugas antar kelas.
- Create data praktikan (manual).
- Import data praktikan (Excel).
- Assign user existing ke data praktikan.
- Read daftar praktikan.
- Update status praktikan.
- Delete data praktikan.
- Assign praktikan ke kelas.
- Create data aslab praktikum.
- Read daftar aslab.
- Update penugasan aslab.
- Delete aslab praktikum.
- Create pertemuan praktikum.
- Read detail pertemuan.
- Update pertemuan.
- Delete pertemuan.
- Create modul praktikum.
- Read modul praktikum.
- Update modul praktikum.
- Delete modul praktikum.
- Create tugas praktikum.
- Read daftar tugas.
- Update tugas.
- Delete tugas.
- Create komponen rubrik.
- Read komponen rubrik.
- Update komponen rubrik.
- Delete komponen rubrik.
- Read pengumpulan tugas.
- Download berkas pengumpulan.
- Create nilai rubrik.
- Update nilai rubrik.
- Delete nilai rubrik.
- Create nilai tambahan.
- Update nilai tambahan.
- Delete nilai tambahan.
- Export nilai.
- Create absensi praktikan.
- Read absensi praktikan.
- Update absensi praktikan.
- Delete absensi praktikan.
- Create absensi aslab.
- Read absensi aslab.
- Update absensi aslab.
- Delete absensi aslab.
- Export absensi.
- Upload template sertifikat praktikum.
- Generate sertifikat praktikum.
- Distribusi sertifikat praktikum.
- Download sertifikat praktikum.

### E. Piket

- Create periode piket.
- Read periode piket.
- Update periode piket.
- Delete periode piket.
- Create jadwal piket.
- Read jadwal piket.
- Update jadwal piket.
- Delete jadwal piket.
- Create absensi piket (manual).
- Read absensi piket.
- Update absensi piket.
- Delete absensi piket.
- Verify absensi piket.
- Unverify/revisi verifikasi absensi piket.
- Approve ganti jadwal piket.
- Reject ganti jadwal piket.
- Read rekap absensi piket.

### F. Keuangan

- Create nominal kas.
- Read nominal kas.
- Update nominal kas.
- Delete nominal kas.
- Activate/Deactivate nominal kas.
- Create pemasukan.
- Read pemasukan.
- Update pemasukan.
- Delete pemasukan.
- Create pengeluaran.
- Read pengeluaran.
- Update pengeluaran.
- Delete pengeluaran.
- Read catatan kas.
- Read laporan keuangan.
- Export laporan keuangan.

### G. Inventaris

- Create kategori aset.
- Read kategori aset.
- Update kategori aset.
- Delete kategori aset.
- Create detail aset.
- Read detail aset.
- Update detail aset.
- Delete detail aset.
- Generate QR/label aset.
- Create riwayat kondisi aset.
- Read riwayat kondisi aset.
- Update kondisi aset.
- Create permohonan aset.
- Read permohonan aset.
- Update permohonan aset.
- Approve permohonan aset.
- Reject permohonan aset.
- Delete permohonan aset.
- Create peminjaman aset.
- Read peminjaman aset.
- Update status peminjaman/pengembalian.
- Delete peminjaman aset.

### H. Surat Menyurat

- Create surat masuk.
- Read surat masuk.
- Update surat masuk.
- Delete surat masuk.
- Export surat masuk.
- Create surat keluar.
- Read surat keluar.
- Update surat keluar.
- Delete surat keluar.
- Export surat keluar.
- Create disposisi.
- Read disposisi.
- Update status disposisi (dibaca/selesai).
- Delete disposisi.
- Read konfigurasi surat.
- Update konfigurasi surat.

### I. Kuesioner

- Create kuesioner.
- Read kuesioner.
- Update kuesioner.
- Delete kuesioner.
- Create pertanyaan kuesioner.
- Read pertanyaan.
- Update pertanyaan.
- Delete pertanyaan.
- Create opsi jawaban.
- Read opsi jawaban.
- Update opsi jawaban.
- Delete opsi jawaban.
- Set target kuesioner.
- Read hasil kuesioner.
- Export hasil kuesioner.

---

## 2) Role: Asisten

### A. Proker & Kegiatan

- Create proker (sesuai scope jabatan aktif).
- Read daftar proker.
- Read detail proker.
- Update proker (yang diizinkan).
- Delete proker (yang diizinkan).
- Create kegiatan.
- Read daftar kegiatan.
- Read detail kegiatan.
- Update kegiatan (yang diizinkan).
- Delete kegiatan (yang diizinkan).
- Upload dokumentasi kegiatan.
- Read dokumentasi kegiatan.
- Delete dokumentasi kegiatan.
- Upload LPJ kegiatan.
- Download LPJ kegiatan.
- Delete LPJ kegiatan.
- Create peserta kegiatan.
- Read peserta kegiatan.
- Update peserta kegiatan.
- Delete peserta kegiatan.
- Read kalender kegiatan.

### B. Praktikum

- Read daftar praktikum yang ditugaskan.
- Read detail kelas/pertemuan yang ditugaskan.
- Create pertemuan praktikum (jika diberikan akses).
- Update pertemuan praktikum (jika diberikan akses).
- Delete pertemuan praktikum (jika diberikan akses).
- Create modul praktikum.
- Read modul praktikum.
- Update modul praktikum.
- Delete modul praktikum.
- Create tugas praktikum.
- Read tugas praktikum.
- Update tugas praktikum.
- Delete tugas praktikum.
- Read pengumpulan tugas.
- Download file pengumpulan.
- Create nilai rubrik.
- Update nilai rubrik.
- Delete nilai rubrik.
- Create nilai tambahan.
- Update nilai tambahan.
- Delete nilai tambahan.
- Create absensi praktikan.
- Read absensi praktikan.
- Update absensi praktikan.
- Delete absensi praktikan.
- Create absensi aslab.
- Read absensi aslab.
- Update absensi aslab.
- Delete absensi aslab.
- Read sertifikat praktikum.
- Download sertifikat praktikum (sesuai hak akses).

### C. Piket

- Read jadwal piket pribadi.
- Create check-in absensi piket.
- Update check-out absensi piket.
- Create pengajuan ganti jadwal piket.
- Read status pengajuan ganti jadwal piket.
- Update pengajuan ganti jadwal (sebelum diproses).
- Delete/batalkan pengajuan ganti jadwal (sebelum diproses).

### D. Inventaris, Surat, dan Kuesioner

- Read daftar aset inventaris.
- Read detail aset inventaris.
- Create permohonan aset.
- Read status permohonan aset pribadi.
- Update permohonan aset pribadi.
- Delete permohonan aset pribadi.
- Create surat masuk/keluar (jika diizinkan).
- Read surat masuk/keluar (jika diizinkan).
- Update surat masuk/keluar (jika diizinkan).
- Delete surat masuk/keluar (jika diizinkan).
- Create jawaban kuesioner.
- Read riwayat respon kuesioner pribadi.

---

## 3) Role: Dosen

### A. Proker & Kegiatan

- Read daftar proker.
- Read detail proker.
- Approve kegiatan sesuai alur persetujuan.
- Reject kegiatan sesuai alur persetujuan.

### B. Surat Menyurat

- Create surat masuk.
- Read surat masuk.
- Update surat masuk.
- Delete surat masuk.
- Export surat masuk.
- Create surat keluar.
- Read surat keluar.
- Update surat keluar.
- Delete surat keluar.
- Export surat keluar.
- Create disposisi surat.
- Read disposisi surat.
- Update status disposisi.
- Delete disposisi surat.
- Read konfigurasi surat.
- Update konfigurasi surat.

### C. Kuesioner

- Read kuesioner aktif.
- Create jawaban kuesioner.
- Read riwayat respon pribadi.

---

## 4) Role: Kepala Departemen

### A. Monitoring Strategis

- Read dashboard inventaris.
- Read daftar aset.
- Read riwayat kondisi aset.
- Read dashboard keuangan.
- Read pemasukan/pengeluaran.
- Read catatan kas.
- Read laporan keuangan.
- Read dashboard praktikum.
- Read data pelaksanaan praktikum.
- Read dashboard piket.
- Read rekap absensi piket.
- Read dashboard surat menyurat.
- Read dashboard hasil kuesioner.

### B. Approval dan Keputusan

- Read daftar proker untuk evaluasi.
- Approve proker sesuai kebijakan.
- Reject proker sesuai kebijakan.
- Read daftar kegiatan untuk evaluasi.
- Approve kegiatan sesuai kebijakan.
- Reject kegiatan sesuai kebijakan.
- Read LPJ final kepengurusan.
- Approve LPJ final kepengurusan.
- Lock LPJ final kepengurusan.
- Export LPJ final kepengurusan (PDF).

---

## 5) Role: Praktikan

### A. Praktikum Akademik

- Read daftar tugas aktif.
- Read detail tugas.
- Create pengumpulan tugas.
- Update pengumpulan tugas (sebelum penilaian/batas waktu jika sistem mengizinkan).
- Delete/batalkan pengumpulan tugas (sesuai aturan sistem).
- Read status pengumpulan.
- Read nilai tugas.
- Read daftar modul praktikum.
- Download modul praktikum.

### B. Layanan Pendukung

- Read sertifikat pribadi.
- Download sertifikat pribadi.
- Read kuesioner aktif.
- Create jawaban kuesioner.
- Read riwayat respon kuesioner pribadi.

---

## Catatan Implementasi Akses

- Dokumen ini sengaja ditulis detail dalam bentuk aksi eksplisit (create/read/update/delete/approve/reject/export/dll).
- Pada implementasi saat ini masih ditemukan role dengan permission yang terlalu mirip (hasil audit runtime).
- Disarankan tahap lanjutan membuat matriks final **Role × Route Name × Permission** lalu melakukan sinkronisasi seeder agar kontrol akses benar-benar presisi per role.
