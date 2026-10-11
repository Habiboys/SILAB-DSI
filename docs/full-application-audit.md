# Audit aplikasi SILAB

Status: **berlangsung**. Dokumen ini mencatat bukti pengujian; belum menyatakan seluruh aplikasi selesai diaudit atau bebas error.

Hasil pengujian pada **11 Oktober 2026**: **112 tes backend / 1.152 assertion lulus**, putaran browser lengkap sebelumnya **87 tes lulus tanpa skip**, **420 probe HTTP tanpa error server**, build produksi lulus. Perubahan lanjutan diuji dengan regresi terarah yang dicatat di bawah. Status audit menyeluruh tetap berlangsung karena batas cakupan dan integrasi nyata yang dicatat di bagian akhir; hasil ini tidak dianggap bukti setiap fitur/cabang sudah diuji.

## Lingkungan dan batas data

Database asli tidak digunakan. MySQL 8.0.30 khusus audit berjalan pada `127.0.0.1:33179`, dengan data baru di `.audit/mysql/data`. Database backend: `silab_audit_tests`; browser: `silab_audit_e2e`. Runner browser memeriksa `@@datadir` sebelum menggunakan database, memakai storage/session/log terpisah, mail array, dan tidak menjalankan worker notifikasi eksternal.

Tes piket memakai header khusus runner audit untuk waktu Senin pukul 10:00 pada minggu berjalan. Header hanya dibaca dalam `tests/Support/AuditEnvironment.php` oleh server audit lokal, setelah pemeriksaan datadir; entry point production tidak memuatnya. Ini memungkinkan tes jadwal/check-in pada akhir pekan. Kamera memakai video palsu Chromium; tes ini tidak membuktikan akurasi pengenalan wajah nyata.

Inventaris terdapat dalam `full-application-audit-map.json`: 345 route sebelum pembersihan, 326 setelah pembersihan, lalu 327 setelah upgrade framework menambahkan route storage bertanda tangan. Terdapat 70 berkas controller, 67 model dan 90 halaman JSX. Peta mencatat hasil probe HTTP tiap controller; status CRUD tetap pending sampai ada bukti lengkap. Graph MCP tidak dapat diakses (`Transport closed`), sehingga pemeriksaan lanjutan memakai sumber langsung. Hasil graph lama tidak dianggap bukti kelengkapan.

## Temuan dan perbaikan sementara

| Severity | Masalah | Akar penyebab | Perbaikan / bukti |
| --- | --- | --- | --- |
| High | Instalasi database baru gagal | Migration struktur dijalankan sebelum tabel users tersedia; FK kelas memakai kolom yang belum dibuat; index nilai rubrik dihapus sebelum FK | Guard tabel, buat kolom kelas nullable, lepaskan FK sebelum index. Migrasi penuh berhasil pada database audit baru. |
| High | Tabel penugasan aslab tidak tersedia pada instalasi baru | Tidak ada migration pembuatan `aslab_praktikum`, sementara migration lanjutan menggunakannya | Migration additive dengan guard tabel, UUID relasi dan unique pasangan. Rollback sengaja mempertahankan data penugasan. |
| High | Penghapusan akun menghasilkan SQL error | Pemeriksaan riwayat menggunakan `ganti_jadwal_piket.user_id` yang sudah diganti | Gunakan relasi `kepengurusanUser` ke pengguna. |
| High | Akun yang dihapus dapat muncul kembali / logout gagal | Route memakai Sanctum request guard; logout generic tidak tersedia. Logout web merotasi remember token dan menyimpan model yang sudah dihapus | Logout current device pada guard web setelah penghapusan; verifikasi backend sedang dijalankan ulang. |
| Medium | 19 route mengarah ke method controller yang tidak tersedia | Resource routes default mengekspos halaman/actions tanpa implementasi | Batasi resource ke handler yang tersedia; hapus route nonimplementasi tanpa referensi frontend. Regression test memeriksa semua handler route publik dan tersedia. |
| Medium | Seeder izin struktur gagal | Kolom string `jabatan` / `permission` masih digunakan setelah tabel beralih ke FK UUID | Kedua seeder memakai `struktur_id` dan `permission_id`, insert idempotent; pengujian sedang berlangsung. |
| Medium | Suite browser tidak dapat dikumpulkan | Regex dan akhir skenario submit PDF terputus | Pulihkan kedua bagian dengan assertion URL, pengumpulan, file, dan persistensi setelah reload. Koleksi berhasil: 79 tes / 13 berkas. |
| Low | Tes bawaan tidak sesuai proses login/profil saat ini | Akun tanpa role diarahkan ke approval; profil staff tidak mengubah email dan membutuhkan identitas | Tambahkan skenario login admin, praktikan dan pending approval; periksa identitas profil tersimpan dan email/verifikasi tetap persis sama. |

## Pengujian sementara

### Audit lanjutan kas, denda, disposisi dan sertifikat

- Aturan denda dikonfirmasi pengguna: **per hari ketidakhadiran**. Jadwal Senin dan Kamis yang keduanya terlewat berarti dua kali nominal denda. Perhitungan sekarang menghitung tanggal jadwal yang sudah lewat (sampai kemarin), dalam rentang periode dan masa keberadaan jadwal; tanggal mendatang tidak ditagih. Absensi selesai berstatus approved dihitung hadir, sesuai syarat verifikasi sebelumnya. Jadwal soft-delete tetap berkontribusi pada riwayat sebelum dihapus. Rekap dan sinkronisasi memakai kalkulator yang sama.
- GET rekap sebelumnya memanggil sinkronisasi denda; GET disposisi mengubah status dibaca, termasuk saat arsip dibuka. Kedua penulisan otomatis dihapus. Pembaruan tagihan dilakukan melalui tombol **Perbarui tagihan denda**; status disposisi melalui aksi **Tandai dibaca** yang sudah tersedia. Mutasi tetap melewati guard arsip dan izin.
- Tes awal membuktikan pembayaran kas yang diedit/dihapus meninggalkan saldo tagihan lama. Update/delete kini mengunci tagihan dan menghitung ulang pembayaran dari ledger dalam transaksi, untuk kas maupun denda. Kenaikan pembayaran melebihi tagihan ditolak dan di-rollback; pengurangan/penghapusan tetap dapat memperbaiki kelebihan bayar lama.
- Mutasi transaksi, nominal kas, pembayaran dan sinkronisasi kini memeriksa policy keuangan. Akses lab saja tidak cukup. Policy nominal kas semula memanggil method `hasPosition` yang tidak tersedia; kini memakai layanan izin struktur yang ada. Update nominal hanya memakai data tervalidasi.
- Daftar sertifikat dan opsi filternya kini dibatasi ke pemilik untuk praktikan dan lab untuk staf; unduhan staf lintas lab ditolak. File sertifikat baru disimpan di disk private. File lama tetap dapat diunduh melalui controller berizin dari disk public, sementara konfigurasi Apache/Nginx memblokir URL langsung `/storage/sertifikat/`. Proteksi file lama pada deployment lain memerlukan aturan server setara; runtime webserver tersebut belum diuji di lingkungan ini.
- Regresi terarah sebelum pengujian penyimpanan privat: **11 tes, 85 assertion lulus** (`.audit/extended-integrity-verified.log`), termasuk dua hari piket per minggu, tanggal mendatang, histori jadwal, idempotensi, koreksi pembayaran, disposisi arsip/penerima dan scope sertifikat.
- Browser terarah: **21 tes lulus** (`.audit/playwright-extended-audit.json`), mencakup enam login, transaksi/laporan keuangan, 38 index, tombol denda dan CRUD/export surat. Setelah tombol denda dipisahkan ke Partials, pengujian tombol kembali lulus (`.audit/playwright-fine-partials-final.json`) dan build lulus (`.audit/build-extended-final.log`).
- Suite backend lanjutan lengkap: **112 tes / 1.152 assertion lulus** (`.audit/phpunit-audit-continuation.xml`). Termasuk akses Bendahara berdasarkan struktur aktif dan pembuatan DOCX sungguhan di penyimpanan privat. Setelah tautan sertifikat peserta kegiatan diarahkan melalui controller berizin, regresi sertifikat kembali lulus: **3 tes / 43 assertion** (`.audit/certificate-link-final.xml`).
- Probe HTTP lanjutan: **49 permintaan, nol error server**, untuk sertifikat, keuangan dan rekap absensi (`.audit/http-extended.json`).
- Build setelah perbaikan tautan unduhan sertifikat peserta kegiatan lulus dalam **18,07 detik** (`.audit/build-certificate-link-final.log`). Link kini mengikuti endpoint unduhan berizin, sesuai penyimpanan sertifikat privat.

- **Putaran browser lengkap terbaru: 87/87 lulus, tanpa skip atau tes tidak dijalankan**, selama 7,3 menit (`.audit/playwright-complete-final.json`). Termasuk enam login role, arsip, inventaris/pengadaan, kegiatan/proker/LPJ, keuangan, kuesioner, navigasi, enam kontrol tabel, PDF desktop/mobile, check-in piket, praktikum sampai upload PDF, serta CRUD/upload/edit tanggal/hapus/export surat.

- Regresi lengkap 11 Oktober 2026: **99 tes backend, 1.056 assertion lulus** (`.audit/phpunit-complete-final.xml`). Mencakup konkurensi peminjaman, upload/pembatalan file privat, penolakan lintas kelas/pemilik, dan arsip. Putaran sebelumnya mempunyai 3 error/2 failure karena role diperiksa pada fixture arsip tanpa tabel role; pemeriksaan role kini hanya dilakukan untuk dua route mahasiswa terkait, dan seluruh assertion arsip kembali lulus.
- Probe HTTP lengkap terbaru: **420 permintaan, nol error server, 94 respons 403** (`.audit/http-post-upgrade.json`). Penolakan izin dicatat sebagai respons, bukan dianggap bukti bahwa semua hak akses sudah benar.
- Dua regresi browser terakhir **lulus** (`.audit/playwright-submission-navigation-fixed.json`): navigasi detail/back/forward mempertahankan seluruh nilai query tanpa bergantung urutan/encoding; mahasiswa upload PDF dan melihat file setelah reload.
- Paket simple-qrcode/BaconQrCode masih mengeluarkan deprecation nullable implisit pada PHP 8.4. Ini tidak menggagalkan suite, tetapi tetap perlu upgrade kompatibel; file vendor tidak diedit dan peringatannya tidak disembunyikan.
- Syntax terbaru: **415 berkas PHP diperiksa** (`.audit/syntax-complete.json`). Sebanyak 414 lolos langsung; satu proses pemeriksa mengalami crash Windows tanpa pesan syntax (exit 3221225477). Pengulangan `php -l database/migrations/2026_04_01_110000_add_verification_columns_to_absensi_table.php` lulus tanpa perubahan sumber.

- Suite lengkap terakhir sebelum regresi konkurensi dan upload mahasiswa: **94 tes, 1.037 assertion lulus** (`.audit/phpunit-master-final.xml`).
- Putaran browser koreksi: **81 lulus dari 87 tes, 6 gagal** (`.audit/playwright-corrected-full.json`). Regresi terarah berikutnya: **14 lulus, 2 gagal**; tersisa pemeriksaan konteks navigasi dan penolakan upload mahasiswa. Hasil putaran tersebut tidak dinyatakan lulus seluruhnya.
- Pada 11 Oktober 2026, pengujian dua proses membuktikan aset yang sama dapat dipinjam dua kali. Mutasi sekarang mengunci baris aset secara berurutan dan memvalidasi ketersediaan di dalam transaksi. Regresi setelah perbaikan lulus dalam suite 99 tes.
- Upload mahasiswa ditolak oleh pemeriksaan akses staf laboratorium. Pengecualian dibatasi pada route pengumpulan/pembatalan praktikan, tetap melewati pemeriksaan periode aktif dan konteks data. Controller memeriksa enrollment aktif dalam kelas tugas; pembatalan wajib milik pengguna sendiri. Nama berkas memakai UUID untuk menghindari tabrakan unggahan dengan nama sama. Regresi positif, lintas kelas, lintas pemilik dan arsip sedang berjalan.

- PHPUnit awal dengan migration nyata MySQL: 60 tes, 813 assertion, 5 gagal. Hasil awal dipertahankan sebagai temuan, bukan disembunyikan.
- Setelah perbaikan awal: 62 tes, 834 assertion, 1 gagal pada penghapusan akun; kegagalan lanjutan mengungkap masalah logout/remember token di atas.
- Suite sebelum upgrade: **84 tes, 940 assertion lulus** (`.audit/phpunit-current.xml`). Suite setelah upgrade Laravel 12: **90 tes, 981 assertion lulus** (`.audit/phpunit-post-upgrade.xml`), termasuk seed idempotent/production, rubrik, pembatasan nilai maksimum, akses aslab lewat body, unduhan submission privat dan halaman pengumpulan sebenarnya.
- Regresi inventaris, profil, nilai tambahan dan izin struktur: **21 tes, 102 assertion lulus**.
- Suite setelah perbaikan rekap lintas tahun: **91 tes, 999 assertion lulus** (`.audit/phpunit-final.xml`). Regresi nama unduhan laporan keuangan ditambahkan sesudahnya dan diuji terpisah.
- Pengalihan URL pengumpulan dan kontrak halaman Inertia: **5 tes, 31 assertion lulus**.
- Status kepengurusan dan unduhan PDF tahun `2026/2027`: **2 tes, 11 assertion lulus**, termasuk signature `%PDF-`.
- Probe HTTP nyata: **420 permintaan**, tujuh role, 60 endpoint GET tanpa parameter path per role. Awalnya 11 respons 500; akar penyebabnya Request salah dan nama unduhan LPJ mengandung slash. Regresi terarah **14 permintaan, nol error server**, satu penolakan izin. Respons 403/404/422/400 dicatat, tidak dianggap bukti CRUD lulus.
- Build produksi `npm run build` **lulus**; terdapat peringatan ukuran chunk. Build awal ditolak sandbox (`spawn EPERM`); pengulangan dengan izin proses lokal berhasil.
- Pengujian browser nyata memakai enam login role dan database audit. Putaran pertama masih mengandung kegagalan selector modal lama, timeout navigasi, fixture yang belum lengkap, serta skenario yang dilewati. Hasil ini **tidak dinyatakan lulus**. Selector memakai accessible role dialog, menghindari submit backdrop, dan pengujian inventaris sedang diulang dengan pemeriksaan persistensi.
- Tes arsip berbasis fixture tidak menggantikan pengujian login/database nyata.
- Putaran browser setelah upgrade: **61 lulus, 17 gagal, 1 dilewati, 2 tidak dijalankan** (`.audit/playwright-post-upgrade.json`). Kegagalan mengungkap callback tabel, API transform React dan fixture/selector yang tidak sesuai. Hasil tidak dihitung lulus; putaran koreksi lengkap dengan enam regresi kontrol tabel sedang berjalan.
- Pemeriksaan syntax terbaru: **395 berkas PHP, nol error**. Build frontend terakhir setelah pembaruan npm, worker PDF, perbaikan surat dan layout LPJ lulus (`.audit/build-final.log`).

## Temuan lanjutan

| Severity | Temuan | Tindakan / status |
| --- | --- | --- |
| High | Inventaris tidak konsisten membatasi lab dan izin pada beberapa mutasi | Middleware memeriksa izin, lab URL/body, aset, permohonan, peminjaman dan bulk sebelum mutasi. Regresi lintas lab dan CRUD lulus. |
| High | FK nilai tambahan tidak tersedia, kode masih mengandalkan dua skema berbeda | Migration additive menambah FK submission, mempertahankan kolom lama, backfill pasangan tunggal; bonus sebelum upload tidak membuat pengumpulan palsu dan ditautkan ketika pengumpulan sebenarnya dibuat. Regresi CRUD/total nilai lulus. |
| High | Seeder instalasi memakai model/kolom lama dan akun contoh pada production | Urutan role diperbaiki, aset memakai DetailAset/skema sekarang, seed akun/aset idempotent. Default production hanya membuat role; akun contoh ditolak. Pengujian suite terbaru berlangsung. |
| Medium | URL daftar pengumpulan memakai halaman React dan relasi yang tidak tersedia | Redirect ke halaman submissions yang tersedia; regresi URL dan kontrak halaman lulus. |
| Medium | Endpoint status selalu 500; LPJ tahun akademik gagal diunduh | Import HTTP Request dan gunakan helper yang tersedia; normalisasi tahun pada nama file. Tes backend dan HTTP ulang lulus. |
| Medium | Field foto/deskripsi opsional gagal karena kolom NOT NULL | Nilai kosong dinormalisasi pada aset, konversi permohonan dan kategori; regresi penyimpanan lulus. |
| Low | Semua halaman memicu prefetch banyak aset | Hapus prefetch global; halaman tetap dimuat sesuai navigasi. Build lulus. |
| High | Nilai rubrik memakai kunci skema lama dan menerima komponen/submission di luar tugas | Upsert berdasarkan submission; validasi tugas, enrollment, komponen dan nilai maksimum sebelum menulis. Regresi single/matrix dan akses aslab lewat body lulus. |
| High | Unduhan submission melalui nama file tidak memeriksa pemilik | Wajib pemilik submission atau pengelola praktikum yang berwenang; pencocokan basename harus persis. Regresi pemilik, pengguna lain dan nama parsial lulus. |
| Medium | Edit surat multipart tidak mengirim spoof method, tanggal ISO tidak cocok untuk input date | Transform payload dengan `_method: PUT` dan normalisasi tanggal. Regresi CRUD browser setelah reload sedang berjalan. |
| Medium | Worker PDF CDN berbeda versi dari API setelah pembaruan | Bundel worker paket yang sama. Build lulus; pengujian canvas desktop/mobile sedang berjalan. |
| High | Pencarian/jumlah baris pada enam halaman dapat crash | Callback `ServerDataTable` mengirim nilai, sementara surat, aset, permohonan, mata kuliah dan pagination proker membaca `event.target`. Kontrak pemanggil diperbaiki; enam regresi browser memeriksa URL, reload dan error JavaScript. |
| High | Rekap keuangan menghilangkan transaksi tahun kedua dalam periode akademik | Filter `whereYear` memakai label `2026/2027`. Rekap kini memakai FK periode terpilih tanpa memotong tahun kalender. Tes awal gagal; regresi laporan setelah perbaikan lulus: 3 tes, 29 assertion. |
| High | Dua peminjam bersamaan berhasil meminjam aset yang sama | Pemeriksaan status dilakukan sebelum transaksi tanpa row lock. Query berurutan `lockForUpdate` dan validasi ulang berada dalam transaksi. Regresi dua proses lulus: satu diterima, satu ditolak. |
| High | Praktikan dapat membatalkan pengumpulan orang lain jika lolos pemeriksaan lab | Tidak ada pemeriksaan pemilik pada controller. Pembatalan kini mensyaratkan user pemilik enrollment dan menghapus berkas pada disk private yang benar. Regresi lintas pemilik ditambahkan. |
| High | Pengumpulan dapat memilih enrollment kelas lain dan nama file dapat bertabrakan | Enrollment semula hanya disaring menurut praktikum; nama memakai detik dan nama asli. Kini memilih enrollment aktif dalam scope kelas tugas dan memakai UUID untuk nama simpan. |
| Medium | Upload mahasiswa ditolak atau redirect berakhir 403 setelah tersimpan | Middleware menganggap praktikan sebagai staf lab; redirect kemudian menambahkan konteks staf. Pengecualian khusus route pengumpulan/pembatalan tetap menjaga arsip dan konteks induk. Redirect mahasiswa mempertahankan URL asal. Regresi browser upload dan reload lulus. |
| Medium | Logo lama tertinggal atau berisiko dihapus sebelum upload pengganti berhasil | Penghapusan memakai jalur filesystem berbeda dari disk upload. Upload baru dilakukan dahulu, update DB lalu hapus logo lama melalui disk public. Regresi lifecycle logo lulus. |
| Medium | Rentang tahun kepengurusan terbalik diterima | Tidak ada aturan urutan tanggal. Store/update memakai `after_or_equal:mulai`; regresi create/update invalid lulus. |

## Dependensi dan kesiapan rilis

Constraint PHP root kini **`^8.4.1`**, mengikuti kebutuhan Symfony 8 dalam lockfile. Lingkungan yang menjalankan PHP 8.2/8.3 harus ditingkatkan sebelum memakai dependensi ini; Dockerfile sudah memakai PHP 8.4. Pemeriksaan platform dilakukan dengan PHP 8.4.25.

Audit terhadap registry resmi berhasil pada 10 Oktober 2026. Composer melaporkan **67 advisory pada 21 paket**; npm melaporkan **33 paket terdampak (3 critical, 27 high, 3 moderate)**. Angka npm menghitung paket transitif yang terdampak, bukan jumlah kerentanan unik. Hasil sebelumnya dari registry/proxy lokal yang melaporkan nol tidak dipakai sebagai bukti keamanan.

Temuan mencakup framework Laravel 11, dompdf, Guzzle, PhpSpreadsheet, FPDI, Symfony, axios, PDF.js dan rantai Firebase/tooling. Beberapa tidak menyediakan perbaikan dalam batas versi sekarang; upgrade lintas versi utama perlu migrasi dan pengujian kompatibilitas. Belum ada klaim bahwa dependensi aman atau aplikasi siap rilis. Hasil mentah tersimpan lokal di `.audit/composer-audit.json` dan `.audit/npm-audit-official.json` (UTF-16 keluaran redirect PowerShell).

Pembaruan npm tanpa `--force` dan penghapusan Inertia lama yang tidak digunakan mengurangi advisory. Override patch gRPC dan tar kemudian menghasilkan **nol critical**. Audit JSON resmi ulang mencatat **15 paket high**, semuanya rantai PDF.js/react-pdf-viewer; keluaran ringkas `npm install --legacy-peer-deps` hanya menyebut satu akar temuan sehingga angka ringkas itu tidak dipakai sebagai jumlah paket terdampak. Kompatibilitas API streaming tar telah lulus pengujian. Semua pembaca PDF memakai `isEvalSupported: false`, sesuai [mitigasi resmi Mozilla untuk CVE-2024-4367](https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq), dan worker dibundel dari versi paket yang sama agar tidak tergantung CDN atau mengalami ketidakcocokan versi. Ini mitigasi eksploit yang didokumentasikan, bukan klaim bahwa paket PDF.js sudah bebas advisory.

Composer menolak resolusi aman dengan batas Laravel 11 dan FPDI tepat 2.6. Batas diperbarui ke Laravel `^12.69` dan FPDI `^2.6.7`, dengan acuan [panduan upgrade Laravel](https://laravel.com/framework/docs/12.x/upgrade). Pemasangan berhasil: Laravel 12.69.3 dan FPDI 2.6.8. Audit ulang registry resmi menghasilkan advisory kosong dan abandoned kosong (`.audit/composer-audit-after.json`); persyaratan platform PHP 8.4.25 lulus. Sebanyak 90 tes backend lulus setelah upgrade. Pengujian browser setelah upgrade masih berlangsung.

Konfigurasi Supervisor kini mencakup `schedule:work`, karena empat jadwal reminder sebelumnya tidak mempunyai proses scheduler di image aplikasi. `.env.example` memakai Asia/Jakarta, sesuai default aplikasi. Tidak ada deployment, scheduler atau pengiriman reminder yang dijalankan dalam audit ini; validasi runtime Docker masih pending. Pemeriksaan Docker 11 Oktober menemukan CLI 29.7.2, tetapi akses daemon dari sandbox ditolak dan percobaan akses di luar sandbox tidak memberi hasil sehingga dihentikan. Tidak ada container/build Docker yang dijalankan.

Pemeriksaan 67 model setelah migration menemukan empat model legacy dengan tabel tidak tersedia: RiwayatKeuangan, RubrikPenilaian, Surat dan tes. Sebagian masih mempunyai relasi/policy lama. Jangan membuat tabel atau menghapus model sebelum dependensi penggunaannya selesai diperiksa.

## Menjalankan pengujian terisolasi

```powershell
./tests/Support/start-audit-mysql.ps1
php vendor/phpunit/phpunit/phpunit --configuration phpunit.audit.xml
php tests/Support/audit-prepare.php
php -d max_execution_time=120 -S 127.0.0.1:8129 -t public tests/Support/audit-router.php
# Pada terminal lain:
npx playwright test --config=playwright.audit.config.js
```

Script MySQL menerima `-MysqlBin` untuk instalasi MySQL 8 lain. Port 33179 harus memakai `.audit/mysql/data`; runner memeriksa datadir dan menolak database lain. PHPUnit memakai MySQL, karena migration historis memerlukan sintaks MySQL; tidak mengklaim mendukung SQLite. `.audit/` diabaikan Git dan konteks Docker. Fixture dan kata sandinya khusus lingkungan audit; jangan gunakan runner ini untuk production.

## Cakupan fungsional yang sudah mempunyai bukti

| Modul | Bukti yang tersedia | Batas cakupan |
| --- | --- | --- |
| Auth, profil, role | Login enam role di browser; feature test login/logout/profil/penghapusan akun | SSO nyata tidak dijalankan |
| Kepengurusan aktif dan arsip | Feature test kepemilikan lab/periode, mutasi arsip, transfer dan riwayat pengguna | Tidak menguji seluruh kombinasi data produksi |
| Inventaris, kategori, permohonan, peminjaman | CRUD dan pembatasan lab di backend; alur peminjaman/pengembalian per item di browser; konkurensi dua proses | Beban banyak pengguna belum diuji |
| Proker dan kegiatan | Buat, ajukan, setujui/tolak, dokumentasi foto, export LPJ; pencarian/pagination tersimpan setelah reload | Seluruh variasi sertifikat belum diuji |
| Praktikum, kelas, praktikan, pertemuan, tugas | Pembuatan, enrollment dan upload PDF browser; rubrik single/matrix, bonus, batas nilai, akses/pembatalan file privat backend | Tidak menguji semua variasi penilaian dan kelas |
| Piket | Penjadwalan, kamera Chromium, check-in foto dan persistensi setelah reload | Kamera palsu; geofence dan pengenalan wajah nyata belum diuji |
| Keuangan | Pemasukan/pengeluaran browser; konsistensi total; rekap lintas tahun dan PDF backend | Tidak menguji data keuangan produksi |
| Surat masuk/keluar | Buat dengan upload, edit tanggal, hapus dan reload di browser; pencarian/jumlah baris | Seluruh variasi disposisi/template surat belum diuji |
| Master lab, tahun, mata kuliah | CRUD backend, lifecycle logo, rentang tanggal, duplikasi kode; kontrol tabel browser | Seluruh variasi struktur/izin belum diuji di browser |
| Kuesioner | Buat kuesioner dan isi sebagai praktikan di browser | Seluruh bentuk agregasi laporan belum diuji |
| Navigasi, UI, PDF | 38 index, breadcrumb/back desktop/tablet/mobile; render PDF desktop/mobile dengan worker lokal | Tidak menjamin semua halaman dan viewport |
| Infrastruktur | Migration MySQL, build frontend, platform Composer, audit dependensi | Docker runtime, queue dan scheduler nyata belum dijalankan |

## Belum diverifikasi

Cakupan di luar skenario pada tabel masih memerlukan pengujian lanjutan. Integrasi SSO, notifikasi pihak ketiga, serta pengenalan wajah nyata memerlukan layanan/kredensial terpisah; belum dinyatakan lulus. Runtime Docker, queue/scheduler, beban tinggi, dan seluruh kombinasi role/data/viewport belum terverifikasi. Temuan dependency npm masih tersisa seperti dijelaskan di atas.

## Berkas perubahan di workspace

Daftar berikut adalah snapshot perubahan workspace, termasuk perubahan yang sudah ada sebelum audit. Tidak semua baris merupakan perubahan baru pada sesi ini. Direktori baru dirinci dalam repositori; artefak mentah `.audit/` sengaja tidak dilacak.

- `app/Http/Controllers/AbsensiController.php`
- `app/Http/Controllers/DendaPiketController.php`
- `app/Http/Controllers/DisposisiSuratController.php`
- `app/Http/Controllers/KegiatanController.php`
- `app/Http/Controllers/RiwayatKeuanganController.php`
- `app/Http/Controllers/SertifikatController.php`
- `app/Http/Controllers/SuratMasukController.php`
- `app/Http/Controllers/TagihanKasController.php`
- `app/Policies/RiwayatKeuanganPolicy.php`
- `app/Services/CertificateService.php`
- `app/Services/PaymentBalance.php`
- `app/Services/PiketAttendanceSummary.php`
- `docker/nginx/app.conf`
- `docs/full-application-audit-map.json`
- `docs/full-application-audit.md`
- `public/.htaccess`
- `public/build/manifest.json`
- `resources/js/Pages/Kegiatan/PesertaManager.jsx`
- `resources/js/Pages/RekapAbsen.jsx`
- `resources/js/Pages/RekapAbsen/`
- `tests/Feature/CertificateScopeTest.php`
- `tests/Feature/DispositionIntegrityTest.php`
- `tests/Feature/FinanceIntegrityTest.php`
- `tests/Feature/PiketFineCalculationTest.php`
- `tests/e2e/piket/rekap-denda.spec.js`
