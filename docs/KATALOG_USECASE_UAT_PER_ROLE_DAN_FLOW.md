# Katalog Use Case untuk UAT (Per Modul, Per Role, + Flow Ringkas)

Dokumen ini disusun ulang dari seluruh file use case modul yang **saat ini ada** agar tidak ada yang tertinggal saat menyusun UAT.

## 1) Cakupan yang Diverifikasi

Sumber yang dibaca:
- [docs/auth/usecase/UC_AUTH.puml](docs/auth/usecase/UC_AUTH.puml)
- [docs/inventaris/usecase/UC_INVENTARIS.puml](docs/inventaris/usecase/UC_INVENTARIS.puml)
- [docs/keuangan/usecase/UC_KEUANGAN.puml](docs/keuangan/usecase/UC_KEUANGAN.puml)
- [docs/praktikum/usecase/UC_PRAKTIKUM.puml](docs/praktikum/usecase/UC_PRAKTIKUM.puml)
- [docs/kegiatan_proker/usecase/UC_KEGIATAN_PROKER.puml](docs/kegiatan_proker/usecase/UC_KEGIATAN_PROKER.puml)
- [docs/piket/usecase/UC_PIKET.puml](docs/piket/usecase/UC_PIKET.puml)
- [docs/surat/usecase/UC_SURAT.puml](docs/surat/usecase/UC_SURAT.puml)
- [docs/kuesioner/usecase/UC_KUESIONER.puml](docs/kuesioner/usecase/UC_KUESIONER.puml)

Catatan penting:
- Kode `UC01`, `UC02`, dst **berulang** di tiap modul. Untuk UAT, dokumen ini menormalkan kode menjadi prefiks modul, mis. `INV-UC01`, `PRAK-UC01`, `AUTH-UC01`.
- Tidak ada file use case terpisah khusus `kepengurusan` dan `sertifikat` pada struktur terbaru; cakupannya muncul pada:
  - `KEG-UC12` / `KEG-UC13` (kepengurusan & anggota),
  - `PRAK-UC13` dan `PRAK-UC16` (sertifikat praktikum),
  - `KEG-UC09` (sertifikat kegiatan).

---

## 2) Daftar Use Case Per Modul + Penjelasan + Flow Ringkas

## 2.1 Auth

| Kode | Use Case | Aktor | Penjelasan singkat | Flow ringkas |
|---|---|---|---|---|
| AUTH-UC01 | Login | Publik | Masuk ke sistem sesuai kredensial | Buka login → isi kredensial → validasi → masuk dashboard role |
| AUTH-UC02 | Register | Publik | Registrasi akun baru | Buka register → isi data → submit → akun terbentuk/menunggu verifikasi |
| AUTH-UC03 | Lupa & Reset Password | Publik | Reset password via token email | Minta link reset → buka link token → set password baru |
| AUTH-UC04 | Logout | Pengguna | Keluar dari sesi | Klik logout → sesi dihapus → kembali ke login |
| AUTH-UC05 | Ganti Password | Pengguna | Ubah password saat login | Buka profil/keamanan → isi password lama+baru → simpan |
| AUTH-UC06 | Verifikasi Email | Pengguna | Verifikasi email akun | Buka tautan verifikasi → sistem menandai email terverifikasi |
| AUTH-UC07 | Konfirmasi Password | Pengguna | Re-auth untuk aksi sensitif | Akses fitur sensitif → diminta password → lanjut bila valid |

## 2.2 Inventaris

| Kode | Use Case | Aktor | Penjelasan singkat | Flow ringkas |
|---|---|---|---|---|
| INV-UC01 | Mengelola Aset (CRUD, QR/Label, Export) | Admin | Kelola data aset secara penuh | Buka daftar aset → tambah/edit/hapus → simpan → QR/label/export bila perlu |
| INV-UC02 | Melihat Daftar Aset | Admin, Asisten, Dosen, Kadep | Melihat aset sesuai akses lab | Buka menu aset → filter/search → lihat hasil |
| INV-UC03 | Melihat Detail Aset Publik (Scan QR) | Publik (+Asisten via generalisasi) | Lihat detail aset dari QR | Scan QR → buka halaman publik aset → lihat detail |
| INV-UC04 | Mengelola Kondisi Aset (Update+Riwayat) | Admin | Ubah kondisi aset dan catat histori | Pilih aset → ubah kondisi → isi catatan → riwayat tercatat |
| INV-UC05 | Mengelola Peminjaman Aset | Admin, Asisten | Proses pinjam-kembali aset | Pilih aset → input peminjaman → update status → proses pengembalian |
| INV-UC06 | Mengelola Permohonan Pengadaan | Admin | Kelola daftar permohonan pengadaan | Buka permohonan → telaah data → ubah status/kelola data |
| INV-UC07 | Mengajukan Permohonan Pengadaan | Asisten | Ajukan kebutuhan aset baru | Buka form pengadaan → isi item/alasan → submit pending |
| INV-UC08 | Menyetujui/Menolak Permohonan Pengadaan | Kadep | Approval akhir pengadaan | Buka detail permohonan → approve/reject + catatan |
| INV-UC09 | Mengelola Kategori Aset | Admin | Kelola master kategori aset | Buka kategori → tambah/edit/hapus/bulk delete |
| INV-UC10 | Melihat Permohonan Pengadaan | Asisten, Dosen, Kadep | Monitoring status permohonan | Buka daftar permohonan → filter status → lihat detail |

## 2.3 Keuangan

| Kode | Use Case | Aktor | Penjelasan singkat | Flow ringkas |
|---|---|---|---|---|
| KEU-UC01 | Mengelola Riwayat Keuangan (CRUD+Export PDF) | Admin | Kelola transaksi masuk/keluar | Buka transaksi → tambah/edit/hapus → simpan → export bila perlu |
| KEU-UC02 | Mengelola Nominal Kas | Admin | Set nominal kas aktif/inaktif | Buka nominal kas → tambah/update/toggle/hapus |
| KEU-UC03 | Melihat Catatan Kas | Admin, Asisten, Dosen, Kadep | Lihat matriks pembayaran anggota | Buka catatan kas → filter periode → lihat status |
| KEU-UC04 | Melihat Rekap Keuangan | Admin, Dosen, Kadep | Lihat ringkasan bulanan | Buka dashboard rekap → pilih periode → lihat total |
| KEU-UC05 | Melihat Riwayat Keuangan (View-Only) | Admin, Asisten, Dosen, Kadep | Lihat daftar transaksi tanpa ubah data | Buka riwayat transaksi → filter/search → lihat detail |

## 2.4 Praktikum

| Kode | Use Case | Aktor | Penjelasan singkat | Flow ringkas |
|---|---|---|---|---|
| PRAK-UC01 | Mengelola Praktikum | Admin | Kelola entitas praktikum utama | Buka master praktikum → tambah/edit/hapus → simpan |
| PRAK-UC02 | Melihat Daftar Praktikum | Asisten, Dosen, Kadep, Praktikan | Lihat praktikum sesuai hak akses | Buka daftar praktikum → filter semester/periode |
| PRAK-UC03 | Mengelola Pertemuan | Admin, Asisten | Kelola jadwal pertemuan | Pilih praktikum → tambah/edit/hapus pertemuan |
| PRAK-UC04 | Mengelola Modul Praktikum | Admin, Asisten | Kelola materi praktikum | Pilih pertemuan → upload/edit/hapus modul |
| PRAK-UC05 | Mengakses Modul Praktikum | Praktikan (+role lain via daftar) | Akses & unduh materi | Buka modul → pilih file → unduh/baca |
| PRAK-UC06 | Mengelola Praktikan | Admin, Asisten | Kelola data peserta praktikum | import/tambah manual → assign/update status |
| PRAK-UC07 | Mengelola Aslab | Admin, Asisten | Kelola aslab & penugasannya | pilih user aslab → assign ke praktikum/kelas |
| PRAK-UC08 | Mengelola Tugas Praktikum | Admin, Asisten | Kelola tugas dan publish | buat/edit/hapus tugas → atur deadline/status |
| PRAK-UC09 | Mengelola Komponen Rubrik | Admin, Asisten | Definisi komponen dan bobot nilai | tambah/edit/hapus komponen rubrik |
| PRAK-UC10 | Mengelola Penilaian Tugas | Admin, Asisten | Input/ubah nilai tugas | pilih submission → nilai manual/rubrik → simpan |
| PRAK-UC11 | Mengumpulkan Tugas | Praktikan | Submit tugas file/link | buka tugas aktif → upload/link → submit |
| PRAK-UC12 | Mengelola Absensi Praktikum | Admin, Asisten | Kelola absensi peserta/aslab | pilih pertemuan → input/edit absensi |
| PRAK-UC13 | Mengelola Sertifikat Praktikum | Admin, Asisten | Generate/distribusi sertifikat | upload template → generate → distribusikan |
| PRAK-UC14 | Melihat Tugas & Detail Tugas | Praktikan | Lihat detail instruksi tugas | buka daftar tugas → pilih tugas → lihat instruksi |
| PRAK-UC15 | Melihat Riwayat Pengumpulan Tugas | Praktikan | Lihat status submit/nilai | buka riwayat → lihat status/feedback |
| PRAK-UC16 | Melihat Sertifikat Sendiri | Praktikan | Akses sertifikat pribadi | buka menu sertifikat → lihat daftar → unduh |
| PRAK-UC17 | Melihat Rekap Nilai & Absensi | Dosen, Kadep | Supervisi hasil akademik | buka rekap praktikum → filter kelas/periode |

## 2.5 Kegiatan & Proker

| Kode | Use Case | Aktor | Penjelasan singkat | Flow ringkas |
|---|---|---|---|---|
| KEG-UC01 | Mengelola Proker | Admin | Kelola data program kerja | tambah/edit/hapus proker |
| KEG-UC02 | Mengelola Parameter Penilaian Proker | Admin | Atur parameter evaluasi proker | tambah/edit parameter → simpan |
| KEG-UC03 | Mengelola Dokumentasi Proker | Admin | Kelola dokumen proker | upload/update/hapus dokumentasi |
| KEG-UC04 | Mengajukan Proker | Admin | Ajukan proker ke approver | pilih proker draft → ajukan |
| KEG-UC05 | Menyetujui/Menolak Proker | Admin, Dosen, Kadep | Approval/review proker | buka proker diajukan → approve/reject |
| KEG-UC06 | Mengelola Kegiatan | Admin | Kelola data kegiatan | tambah/edit/hapus kegiatan |
| KEG-UC07 | Mengelola Laporan & Dokumentasi Kegiatan | Admin, Asisten | Kelola LPJ & dokumentasi kegiatan | upload/lihat/unduh/hapus LPJ/dokumen |
| KEG-UC08 | Mengelola Peserta Kegiatan | Admin, Asisten | Kelola peserta/panitia | tambah/hapus/update peserta |
| KEG-UC09 | Mengelola Sertifikat Kegiatan | Admin | Template + generate sertifikat kegiatan | upload template → generate sertifikat |
| KEG-UC10 | Menyetujui/Menolak Kegiatan | Dosen, Kadep | Approval kegiatan | buka pengajuan kegiatan → approve/reject |
| KEG-UC11 | Melihat Kalender Kegiatan | Asisten, Dosen, Kadep, Admin* | Monitoring jadwal kegiatan | buka kalender → lihat event per tanggal |
| KEG-UC12 | Mengelola Kepengurusan | Admin | Kelola data kepengurusan | tambah/edit data kepengurusan |
| KEG-UC13 | Mengelola Anggota | Admin | Kelola anggota kepengurusan | tambah/edit/hapus anggota |
| KEG-UC14 | Melihat Daftar Proker | Dosen, Kadep | Lihat list proker untuk monitoring | buka daftar proker → filter status |
| KEG-UC15 | Melihat Daftar Kegiatan | Dosen, Kadep | Lihat list kegiatan | buka daftar kegiatan → filter periode |
| KEG-UC16 | Mengevaluasi Proker | Dosen, Kadep | Memberi penilaian/evaluasi proker | buka detail proker → isi evaluasi |

Keterangan `Admin*` pada `KEG-UC11`:
- Di diagram, `Admin --|> Asisten`, sehingga Admin mewarisi akses Asisten termasuk kalender.

## 2.6 Piket

| Kode | Use Case | Aktor | Penjelasan singkat | Flow ringkas |
|---|---|---|---|---|
| PIK-UC01 | Mengelola Periode Piket | Admin | Kelola periode piket aktif | tambah/edit/hapus/toggle periode |
| PIK-UC02 | Mengelola Jadwal Piket | Admin | Assign jadwal per asisten | pilih periode → assign slot → simpan |
| PIK-UC03 | Mengelola Absensi Piket | Admin | Check-in/check-out/verifikasi absensi | input absensi → validasi waktu/status |
| PIK-UC04 | Mengajukan Ganti Jadwal | Asisten | Request tukar jadwal | pilih slot → ajukan pengganti/alasan |
| PIK-UC05 | Menyetujui/Menolak Ganti Jadwal | Admin | Approve/reject request | buka request pending → approve/reject |
| PIK-UC06 | Melihat Rekap Absensi | Admin, Dosen, Kadep | Monitoring rekap kehadiran | buka rekap → filter periode/asisten |
| PIK-UC07 | Melihat Jadwal Piket | Dosen, Kadep | Lihat jadwal piket (view) | buka jadwal → lihat slot/hari |

## 2.7 Surat Menyurat

| Kode | Use Case | Aktor | Penjelasan singkat | Flow ringkas |
|---|---|---|---|---|
| SUR-UC01 | Kirim Surat Pribadi | Admin, Asisten | Kirim surat antar user/lab | isi form surat → kirim |
| SUR-UC02 | Lihat Surat Masuk | Admin, Asisten | Lihat inbox surat | buka surat masuk → filter/cari |
| SUR-UC03 | Lihat Surat Keluar | Admin, Asisten | Lihat outbox surat | buka surat keluar → lihat status |
| SUR-UC04 | Lihat Detail & Unduh | Admin, Asisten, Dosen, Kadep | Baca detail surat dan unduh lampiran | buka detail surat → unduh berkas |
| SUR-UC05 | Kirim Surat Resmi | Admin (dan Asisten Sekretaris) | Kirim surat resmi lab | isi metadata resmi + lampiran → kirim |
| SUR-UC06 | Lihat Arsip Surat Resmi | Admin, Dosen, Kadep | Lihat arsip resmi lintas surat | buka arsip resmi → filter periode/lab |

## 2.8 Kuesioner

| Kode | Use Case | Aktor | Penjelasan singkat | Flow ringkas |
|---|---|---|---|---|
| KUES-UC01 | Mengelola Kuesioner | Admin | CRUD kuesioner & konfigurasi target | buat/edit/hapus kuesioner |
| KUES-UC02 | Mengisi Kuesioner | Asisten, Praktikan | Respon kuesioner aktif | buka kuesioner target → isi jawaban → submit |
| KUES-UC03 | Melihat Hasil Kuesioner | Admin, Dosen, Kadep | Monitoring statistik hasil | buka hasil → lihat ringkasan/detail respon |

---

## 3) Matrix Ringkas Use Case per Role (Final untuk RTM UAT)

## 3.1 Admin
- Auth: `AUTH-UC04`, `AUTH-UC05`, `AUTH-UC06`, `AUTH-UC07`
- Inventaris: `INV-UC01`, `INV-UC04`, `INV-UC05`, `INV-UC06`, `INV-UC09`, `INV-UC02`
- Keuangan: `KEU-UC01`, `KEU-UC02`, `KEU-UC03`, `KEU-UC04`, `KEU-UC05`
- Praktikum: `PRAK-UC01`, `UC03`, `UC04`, `UC06`, `UC07`, `UC08`, `UC09`, `UC10`, `UC12`, `UC13`
- Kegiatan/Proker: `KEG-UC01` s.d. `UC13` + `KEG-UC11` (via generalisasi)
- Piket: `PIK-UC01`, `UC02`, `UC03`, `UC05`, `UC06`
- Surat: `SUR-UC01` s.d. `SUR-UC06`
- Kuesioner: `KUES-UC01`, `KUES-UC03`

## 3.2 Asisten
- Auth: `AUTH-UC04`, `AUTH-UC05`, `AUTH-UC06`, `AUTH-UC07`
- Inventaris: `INV-UC02`, `INV-UC03`*, `INV-UC05`, `INV-UC07`, `INV-UC10`
- Keuangan: `KEU-UC03`, `KEU-UC05`
- Praktikum: `PRAK-UC02`, `UC03`, `UC04`, `UC06`, `UC07`, `UC08`, `UC09`, `UC10`, `UC12`, `UC13`
- Kegiatan/Proker: `KEG-UC07`, `UC08`, `UC11`
- Piket: `PIK-UC04`
- Surat: `SUR-UC01`, `UC02`, `UC03`, `UC04`, `SUR-UC05`**
- Kuesioner: `KUES-UC02`

Keterangan:
- `INV-UC03`*: Asisten mewarisi akses Publik scan QR pada diagram inventaris.
- `SUR-UC05`**: hanya jika berjabatan sekretaris (`surat.create_resmi`).

## 3.3 Dosen
- Inventaris: `INV-UC02`, `INV-UC10`
- Keuangan: `KEU-UC03`, `UC04`, `UC05`
- Praktikum: `PRAK-UC02`, `PRAK-UC17`
- Kegiatan/Proker: `KEG-UC05`, `UC10`, `UC11`, `UC14`, `UC15`, `UC16`
- Piket: `PIK-UC06`, `PIK-UC07`
- Surat: `SUR-UC04`, `SUR-UC06`
- Kuesioner: `KUES-UC03`

## 3.4 Kadep
- Mewarisi semua use case Dosen (berdasarkan generalisasi di beberapa modul), ditambah:
- Inventaris: `INV-UC08` (approve/reject permohonan pengadaan)

## 3.5 Praktikan
- Auth: umumnya `AUTH-UC04`–`UC07` (sebagai pengguna login)
- Praktikum: `PRAK-UC02`, `UC05`, `UC11`, `UC14`, `UC15`, `UC16`
- Kuesioner: `KUES-UC02`

## 3.6 Publik (non-login)
- Auth: `AUTH-UC01`, `UC02`, `UC03`
- Inventaris: `INV-UC03` (scan QR detail aset)

---

## 4) Cara Menurunkan ke Dokumen UAT (Agar Tepat)

Untuk setiap use case di atas, minimal turunkan 3 skenario uji:
1. **Happy path** (alur normal berhasil).
2. **Negative path** (validasi gagal/akses ditolak).
3. **Boundary/aturan bisnis** (mis. deadline, status approval, scope parent-subclass).

Template singkat per baris UAT:
- `ID UAT` | `Role` | `Kode Use Case` | `Skenario` | `Expected` | `ISO 25010` | `ISO 9241-11` | `Status` | `Nilai`

Dengan format ini, UAT kamu akan tepat karena selalu punya jejak: **Role -> Use Case -> Skenario Uji**.
