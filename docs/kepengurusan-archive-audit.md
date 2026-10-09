# Audit kepengurusan aktif dan arsip SILAB

Tanggal: 9 Oktober 2026. Cakupan: route aplikasi, kepemilikan model, middleware, controller, React, relasi penghapusan, dan pengujian terisolasi.

## Aturan dan sumber status

`kepengurusan_lab.is_active` menentukan apakah data sebuah periode dapat dikelola. Nilai false ditampilkan sebagai **Arsip**. `tahun_kepengurusan.isactive` merupakan pilihan tahun master; `kepengurusan_user.is_active` merupakan status keanggotaan dalam periode. Keduanya tidak menggantikan status kepengurusan laboratorium.

Status aktif pengguna membutuhkan keanggotaan aktif **dan** kepengurusan induk aktif. Pergantian periode tidak lagi mengaktifkan atau menonaktifkan seluruh anggota secara massal. Status anggota yang tersimpan di periode lama tetap utuh.

Arsip dapat dibaca sesuai izin pengguna. Mutasi membutuhkan dua syarat terpisah: periode pemilik data aktif dan pengguna memiliki izin operasi tersebut. Superadmin tetap terkena pembatasan arsip.

## Peta modul

| Modul dan halaman | Pemilik data | Perlakuan arsip |
| --- | --- | --- |
| KepengurusanLab, SK, sertifikat kepengurusan | Kepengurusan laboratorium langsung | Baca/download; pembaruan SK, template, dan penerbitan sertifikat ditolak |
| Anggota, jabatan anggota | `kepengurusan_user.kepengurusan_lab_id` | Keanggotaan periode arsip tidak dapat ditambah, diubah, atau dihapus |
| Proker/Index, Show, parameter, evaluasi, dokumentasi, penanggung jawab | Proker → kepengurusan | Daftar/detail/LPJ tersedia; mutasi termasuk approval dan pengelolaan lampiran ditolak |
| Kegiatan/Index, Show, Kalender, Sertifikat, peserta, laporan, dokumentasi | Kegiatan → proker → kepengurusan | Baca kalender/detail/lampiran; CRUD, approval, peserta, dan penerbitan ditolak |
| RiwayatKeuangan, RekapKeuangan, CatatanKas, nominal kas, tagihan, denda | Transaksi/nominal/tagihan/denda → kepengurusan; sinkronisasi menggunakan induk nominal/periode piket | Baca/rekap; transaksi, pembayaran, sinkronisasi, dan perubahan nominal ditolak |
| Praktikum, kelas dan subkelas, aslab, peserta | Praktikum → kepengurusan; kelas/enrollment → praktikum | Baca daftar/detail/report; CRUD, import dan pemindahan kelas dibatasi |
| Pertemuan/Index, Absensi, ModulPraktikum | Pertemuan → kelas → praktikum; modul/absensi → pertemuan | Baca, search, filter, lampiran; upload, publikasi, radio absensi dan simpan dibatasi |
| TugasPraktikum/Index, TugasSubmissions, komponen rubrik, nilai tambahan | Tugas → kelas/pertemuan → praktikum; submission/rubrik/nilai → tugas | Baca dan export nilai; pengumpulan, grading, penolakan, bulk matrix, dan import nilai dibatasi |
| Praktikan/DaftarTugasDetail | Tugas → praktikum; enrollment peserta bersifat per praktikum | Riwayat dan lampiran tetap tampil; pengumpulan ulang dibatasi |
| JadwalPiket, PeriodePiket, GantiJadwalPiket, AmbilAbsen, RiwayatAbsen, pengaturan piket | Kepengurusan langsung atau absensi → jadwal piket | Baca jadwal/riwayat; pengelolaan, permintaan penggantian, check-in/out dan verifikasi dibatasi |
| Piket/Wajah, WajahReview | Face enrollment → kepengurusan | Riwayat terlihat; enrollment/revoke/keputusan dibatasi berdasarkan periode pemilik; antrean campuran menggunakan status per baris |
| SuratMenyurat/SuratMasuk, SuratKeluar, Disposisi, Konfigurasi | Surat/konfigurasi → kepengurusan; disposisi → surat masuk | Baca/download/search; CRUD, disposisi, status dan konfigurasi tidak dapat diubah |
| Sertifikat dan verifikasi publik | Sertifikat → kepengurusan atau praktikum | Pembacaan/download/verifikasi tetap tersedia; penerbitan di controller pemilik terlindungi |

Data master laboratorium, definisi struktur/jabatan, mata kuliah, inventaris/aset, akun/profil, komunikasi internal, dan survei tidak otomatis menjadi data periode. Pengelolaan global tersebut tetap mengikuti izin sebelumnya. Penghapusan master tahun/struktur atau akun yang berpotensi merusak relasi historis memperoleh perlindungan khusus. Nama/profil dan definisi master tetap merupakan data bersama, bukan snapshot identitas per periode.

Inventaris route dapat ditinjau pada [kepengurusan-route-audit.json](kepengurusan-route-audit.json): **218 route** di controller konteks kepengurusan, terdiri dari 84 pembacaan, 132 operasi/form yang diperiksa guard, dan dua operasi transisi periode. Angka ini merupakan inventaris route terdaftar, bukan jumlah skenario browser yang diuji.

## Temuan dan perubahan

1. Middleware lama mempunyai pengecualian admin, menebak konteks dari ID, dan mengganti konteks berdasarkan sesi. Penggantinya memeriksa pemilik resource sebenarnya dan seluruh ID induk yang relevan dalam body, termasuk array bulk.
2. ID periode aktif dalam body tidak dapat menutupi resource arsip dalam URL. Laboratorium/tahun yang tidak sesuai ditolak. Resource anak juga diperiksa terhadap induk URL/induk tugas atau praktikum yang dipilih.
3. Mutasi menggunakan transaksi dan membaca ulang status periode dengan row lock. Form yang dibuka ketika periode aktif tetap ditolak apabila periode sudah diarsipkan saat disimpan.
4. Middleware `EnsureKepengurusanWritable` dipasang pada grup web. Alias `active.kepengurusan` menjadi adapter kompatibilitas. Policy, middleware role/permission, dan pemeriksaan controller tetap dijalankan.
5. `KepengurusanAccess` menjadi resolver kepemilikan bersama. React memperoleh `kepengurusan_context` dari resolver yang sama; `useKepengurusanAccess`, `useMutationPermissions`, dan pemeriksaan permission menutup aksi perubahan. Navigasi menuju pembacaan tidak ikut dihilangkan.
6. Layout menampilkan badge **Arsip** dan keterangan baca saja. Form konfigurasi surat dan absensi dapat dibaca tanpa input yang dapat mengubah data; search/filter tidak dibungkus dengan disabled state.
7. Pergantian kepengurusan sebelumnya mengubah status semua anggota, termasuk anggota yang telah nonaktif. Sekarang hanya status kepengurusan induk yang berubah; aktivasi diserialkan menggunakan lock laboratorium.
8. Anggota diperbarui/dihapus berdasarkan pasangan user dan periode tujuan. Penambahan anggota memeriksa periode dan permission sebelum membuat akun/profil.
9. Penghapusan praktikan sebelumnya dapat menghapus enrollment seluruh praktikum dan akun global. Sekarang hanya enrollment praktikum tujuan yang dihapus.
10. Approval wajah sebelumnya mengganti data approved lintas periode; revoke juga tidak dibatasi ke periode tujuan. Sekarang keduanya menggunakan periode pemilik. Pending enrollment periode lama tidak menghalangi enrollment baru di periode aktif.
11. Penghapusan akun dengan relasi arsip ditolak sebelum event penghapusan Spatie dapat melepas role/permission. Penghapusan dibungkus transaksi dan status periode terkait dibaca dengan lock. Akun tanpa riwayat periode tetap dapat dihapus.
12. Pengambilan daftar submission sebelumnya menulis status `dinilai` melalui GET. Penyesuaian sekarang hanya pada response, tanpa menyimpan perubahan ke database.
13. Kegiatan dan kalender sebelumnya dapat mengganti pilihan arsip dengan periode aktif. Pemilihan eksplisit kini dipertahankan. Fallback daftar proker lintas periode pada form kegiatan dihapus; form edit menggunakan periode pemilik kegiatan.
14. Master tahun tidak lagi mengaktifkan kepengurusan/anggota lintas laboratorium. Tahun yang dipakai arsip tidak dapat diubah; tahun yang dipakai kepengurusan tidak dapat dihapus. Pemeriksaan penghapusan struktur menggunakan relasi anggota yang benar, menggantikan pemanggilan relasi `users()` yang tidak tersedia.

## Pengecualian bisnis

- Pembuatan periode dan aktivasi/nonaktivasi periode tetap tersedia melalui permission yang sudah ada. Aktivasi ulang arsip merupakan tindakan transisi eksplisit, bukan izin untuk mengedit arsip tanpa mengaktifkannya.
- Transfer anggota lama membaca periode sumber dan hanya menulis periode target yang aktif, berbeda, dan berada di laboratorium yang sama. Permission transfer tetap wajib; sumber tidak diubah.
- Kedaluwarsa enrollment wajah pending tetap menjalankan penghapusan embedding/foto sesuai mekanisme retensi keamanan yang sudah ada, termasuk pada periode lama. Ini merupakan lifecycle biometrik, bukan operasi pengelolaan riwayat biasa.
- Pembuatan file export/report saat download tetap diperbolehkan selama tidak mengubah record historis. Download sendiri tetap bergantung pada izin semula.

## Database

Tidak ada migration, migrasi data, seeding, penghapusan historis, atau perubahan database aplikasi yang dijalankan. Skema existing tetap digunakan. Perlindungan cascade dilakukan sebelum operasi aplikasi; tidak ditambahkan trigger database. SQL langsung, bulk query di luar jalur aplikasi, atau perubahan manual oleh operator database bukan cakupan guard HTTP ini.

Tidak dilakukan normalisasi massal pada data existing. Jika terdapat periode aktif ganda atau relasi yatim dari data lama, diperlukan pemeriksaan dataset tersendiri. Resolver menolak konteks mutasi yang tidak jelas; proses aktivasi mengembalikan satu periode aktif per laboratorium melalui jalur aplikasi.

## Hasil pengujian

Perintah backend:

```text
php artisan test --compact --filter='KepengurusanArchiveAccessTest|FaceEnrollmentAccessTest|NavigationContextTest'
```

Hasil: **26 test lulus, 100 assertion**. Suite menggunakan SQLite memory untuk pengujian database, bukan koneksi database aplikasi. Cakupan meliputi:

- POST/PUT/DELETE arsip serta URL edit langsung ditolak; GET daftar/detail/export/download tetap diteruskan.
- Mutasi aktif diteruskan; authorization downstream tetap dapat menolak pengguna tanpa izin.
- Resource arsip dari proker, keuangan, piket, surat, praktikum, dan wajah tidak dapat disamarkan dengan konteks aktif.
- Body nested/bulk, lab/tahun palsu, induk yang salah, laboratorium lain, dan form dengan status stale ditolak.
- Pengujian HTTP route `proker.update` memastikan binding dan urutan middleware nyata; handler akhir diganti handler uji untuk memeriksa penulisan aktif dan snapshot arsip secara terisolasi.
- Transfer hanya menuju periode aktif pada lab yang sama; snapshot sumber tidak berubah.
- Aktivasi mempertahankan seluruh status anggota; anggota periode arsip tidak dihitung sebagai anggota aktif.
- Penghapusan akun yang terkait arsip ditolak; akun tanpa riwayat periode tetap dapat dihapus.
- Revoke wajah aktif tidak mengubah snapshot wajah periode lain; encryption, penyimpanan privat, approval dan expiration tetap lulus.
- Modul global tidak diblokir hanya karena pilihan periode arsip; regresi navigation context tetap lulus.

Perintah browser:

```text
npm run build
npx playwright test --config=playwright.archive.config.js
```

Hasil: build produksi berhasil; **5 test Chromium lulus**. Browser menggunakan bundle React/CSS produksi dan Inertia fixture pada server lokal, tanpa login/seeding/database aplikasi. Diuji form konfigurasi arsip pada 1440 px dan 390 px, search token, tidak adanya overflow horizontal, form aktif yang editable, antrean wajah dengan pemilik aktif/arsip, dan tombol tambah proker pada periode aktif/arsip.

Lint PHP pada file yang berubah lulus. `git diff --check` lulus. Build masih memberi peringatan existing tentang `eval` dari pdfjs dan ukuran bundle besar.

## Batas validasi dan pemeliharaan

- Belum dijalankan CRUD browser penuh dengan akun sungguhan untuk setiap role dan seluruh modul. Uji browser ini memeriksa UI nyata dengan fixture; uji backend memeriksa guard, ownership, transisi, dan sebagian jalur HTTP, bukan setiap controller bisnis secara menyeluruh.
- Belum diuji concurrency dengan dua koneksi MySQL, filesystem failure saat upload, dan snapshot seluruh database/file produksi. SQLite test tidak membuktikan perilaku row locking MySQL.
- Suite E2E existing yang memerlukan akun/data aplikasi tidak dijalankan. Suite PHPUnit penuh juga tidak dijalankan karena konfigurasi default menggunakan koneksi MySQL aplikasi.
- Controller periode baru dan alias ID resource baru harus didaftarkan pada `KepengurusanAccess`; inventory route dan test perlu diperbarui bersama fitur tersebut.
- Graph digunakan pada tier Verify dan dicocokkan dengan source. Metadata freshness berubah selama pengeditan; rentang partial parsing pada AmbilAbsen dan Praktikum dibaca langsung. Tidak ada klaim bahwa graph membuktikan kelengkapan semua hubungan runtime.
