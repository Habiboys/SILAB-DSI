# Produksi buku panduan SILAB

## Hasil tahap pertama

Standar editorial: `RULES.md`. Isi contoh: `content/piket.json`, `content/inventaris.json`, `content/keuangan.json`, `content/praktikum.json`, dan `content/kepengurusan.json`. Penyusun bersama: `scripts/guidebook.py`. Entry point: `scripts/build.py`. Hasil: `output/guidebook/Panduan SILAB sampai Modul Kepengurusan.docx`. Dokumen memakai BAB 1 pengenalan, BAB 2 Piket, BAB 3 Inventaris, BAB 4 Keuangan, BAB 5 Praktikum, BAB 6 Kepengurusan, BAB 7 kendala umum; tidak memakai nomor bab kosong untuk modul yang belum ditulis.

Tidak ada perubahan API, skema, permission, atau route. Perbaikan impor komponen lokal untuk pelengkapan screenshot dijelaskan pada bagian penilaian. Builder tidak login, tidak membaca .env, dan tidak menulis database. Screenshot sebelumnya dibaca sebagai masukan, tidak ditangkap ulang dengan mutasi aplikasi.

## Kontrak isi

Setiap modul memiliki `id`, `title`, `introduction`, `flow`, `prerequisites`, `access`, `groups`, `issues`, `evidence`, dan `limitations`. `access` adalah baris peran—akses—tugas. Setiap kelompok memiliki `id`, `title`, dan `tasks`. Setiap tugas memiliki `id` stabil, `title`, `summary`, `before`, `steps`, `success`, `failure`, serta `figures` opsional.

Setiap gambar memiliki `id` unik, `path` relatif terhadap root repo, `caption`, dan `after_step` (nomor langkah berbasis 1). ID dipakai untuk bookmark dan rujukan; jangan memakai nomor bab sebagai ID. Semua gambar harus ada; builder berhenti dengan pesan jelas jika gambar hilang. Teks memakai `**Nama kontrol**` untuk penebalan terbatas. Isi tidak memuat angka heading, nomor langkah, atau nomor gambar.

`Guidebook` menyediakan komponen `chapter`, `subchapter`, `task`, `label`, `steps`, `bullets`, `figure`, `figure_reference`, `table`, dan `front_matter`. Format hanya didefinisikan di penyusun bersama. Modul baru mengikuti kontrak yang sama dan ditambahkan pada daftar argumen `--modules` sesuai urutan buku; jangan menyalin style dari builder lama.

## Alur produksi

1. Periksa route, middleware, controller, policy, dan label antarmuka. Gunakan graph discovery serta coverage; baca source langsung untuk freshness berubah atau gap. Rekam temuan pada `evidence` dan keterbatasan pada `limitations`.
2. Susun matriks akses dan prosedur. Jangan menerjemahkan komentar policy yang tidak dipanggil menjadi hak akses pasti. Jika konfigurasi role/jabatan bisa berubah, gunakan keterangan pengelola berwenang dan batas laboratoriumnya.
3. Pilih screenshot tugas yang sudah tersedia. `after_step` menempatkan gambar dekat tindakan yang dijelaskan. Tidak semua tugas wajib punya screenshot apabila tahap ini baru contoh struktur; tugas tanpa screenshot harus punya sumber dan keterbatasan yang transparan.
4. Jalankan builder dengan Python dari runtime Codex, bukan paket Python repo/global. Default lokasi Windows: `%USERPROFILE%/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`. Override dengan runtime resmi lain bila dipindah mesin.

```powershell
$runtimePython = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
& $runtimePython docs/guidebook/scripts/build.py
& $runtimePython docs/guidebook/scripts/validate.py 'output/guidebook/Panduan SILAB sampai Modul Kepengurusan.docx'
```

Builder menerima `--modules PATH [PATH ...]`, `--output PATH`, dan `--assets-root PATH`. Default module adalah Piket, Inventaris, Keuangan, Praktikum, lalu Kepengurusan; aset logo/foto berasal dari `public/images`, screenshot dari `output/absensi-piket`. Folder output sebelumnya harus dipertahankan untuk regenerasi screenshot; jika dipindahkan, salin seluruh aset dan sesuaikan `--assets-root`. Berkas Word final tetap mandiri karena gambar tertanam.

Sebelum operasi pembuatan dokumen pertama dalam tugas, jalankan marker artifact dari skill documents tepat sekali sesuai workflow skill. Ini merupakan langkah orkestrasi, bukan efek samping setiap impor builder.

5. Perbarui field melalui Microsoft Word dengan `scripts/finalize_word.ps1`. Script menormalisasi list template Heading 1–3 di dokumen melalui API Word agar semua tingkat dipertahankan, memperbarui field/TOC/daftar gambar, menyimpan DOCX, dan mengambil PNG setiap halaman dari layout Word. Tidak mengubah template global atau preferensi aplikasi pengguna.

```powershell
& docs/guidebook/scripts/finalize_word.ps1 -DocPath 'output/guidebook/Panduan SILAB sampai Modul Kepengurusan.docx' -OutputDir 'output/guidebook/qa'
& $runtimePython docs/guidebook/scripts/validate.py 'output/guidebook/Panduan SILAB sampai Modul Kepengurusan.docx' --require-updated
```

Gunakan `render_docx.py` dari skill documents bila LibreOffice tersedia. Pada lingkungan Windows ini, renderer standar sudah didiagnosis gagal karena LibreOffice tidak tersedia; fallback Word menghasilkan layout asli. PNG/PDF hanya untuk QA, bukan deliverable kecuali diminta. Jika COM/renderer gagal, laporkan penyebab dan jangan menyatakan visual sudah diverifikasi.

6. Buka seluruh PNG. Periksa heading, tabel, posisi gambar, caption, daftar isi, daftar gambar, section pagination, dan footer. Perbaiki isi/style, bangun ulang, perbarui field, lalu render ulang hingga bersih.

## Verifikasi bermakna

Validator memeriksa urutan tiga section, font/style dan hierarki, header kosong, field PAGE/TOC/SEQ/REF, multilevel numbering, restart langkah, bookmark dan referensi, gambar tertanam, serta ketiadaan label rahasia. Mode `--require-updated` memastikan daftar aktual telah diisi Word, nomor setiap heading pada `word-report.json` sesuai tingkatnya, dan tidak ada field reference error. Gunakan `--report PATH` jika report berada di lokasi selain folder `qa` di sebelah dokumen. Validasi XML tidak menggantikan inspeksi halaman.

Jalankan `check_scenarios.py` dengan runtime Python untuk uji aset hilang, ID duplikat, dan fixture ekspansi. Fixture menyisipkan modul contoh sebelum Piket; finalisasi dengan `-SkipImages` dan periksa Piket menjadi BAB 3, tugasnya 3.2.1, dan gambar dimulai 3.1. Fixture ada di output QA, bukan deliverable pengguna. Validator dengan `--require-updated --report output/guidebook/scenarios/qa/word-report.json` memeriksa hasil fixture setelah field diperbarui.

## Batas contoh Piket

Screenshot login, pendaftaran wajah, check-in, sesi, checkout, dan selesai berasal dari demonstrasi lokal sebelumnya. Pengajuan ganti jadwal, pengaturan pengelola, dan tinjauan wajah dijelaskan dari source dan label UI yang diperiksa, tanpa mengklaim telah menjalankan approval nyata. Hak akses bergantung role, jabatan, kepengurusan aktif, dan laboratorium. Dokumentasi diagram lama tidak dijadikan otoritas ketika bertentangan dengan controller.

Penerapan pada seluruh modul berikutnya menggunakan standar yang sama setelah contoh Piket lolos pemeriksaan; tidak memperluas scope tahap ini menjadi seluruh buku aplikasi.

## Edisi Piket dan Inventaris

Standar diperbarui menjadi isi justify spasi 1,5, Heading 1 center, serta caption gambar dan tabel center. Caption tabel menggunakan STYLEREF + SEQ Tabel dan daftar tabel otomatis. Script finalisasi memperbarui kedua jenis daftar caption melalui TablesOfFigures. Screenshot Inventaris dari pembacaan akun Asisten; form draft dibuka tanpa menyimpan data. Tindakan Kalab/Kadep/pengelola diverifikasi melalui source, bukan diklaim diuji transaksi nyata.


## Edisi Keuangan

BAB 4 mencakup transaksi umum, pembayaran kas Normal dan Lebih, koreksi, nominal kas, serta pemeriksaan untuk tindak lanjut. Screenshot berasal dari pembacaan data lokal tanpa perubahan transaksi. Akun pembaca tidak menyediakan tombol pencatatan; prosedur perubahan diperiksa melalui controller, policy, dan label UI. Nomor baris rekap yang tampil NaN dicatat sebagai kendala aplikasi, bukan diedit pada screenshot. QA edisi ini berada di output/guidebook/finance-qa; gunakan --report ke word-report.json pada folder tersebut untuk validator.



## Edisi Praktikum

Isi `content/praktikum.json` memuat 24 tugas dari persiapan hingga laporan. Screenshot menggunakan akun Asisten yang ditugaskan, tanpa menyimpan kegiatan, nilai, atau penerbitan. Halaman pengumpulan gagal tampil dengan galat `DataTable is not defined`; prosedur penilaian diperiksa dari source dan diberi keterbatasan yang jelas. Alur praktikan belum memiliki screenshot sesi praktikan. Laporan diperiksa sampai formulir dan daftar peringatan; data sumber belum lengkap untuk laporan final. QA berada di `output/guidebook/praktikum-qa`; gunakan word-report.json di folder itu pada argumen --report validator. Tidak ada perubahan kode aplikasi atau data keuangan/akademik.

Field tidak diperbarui otomatis saat pembukaan draf karena dapat menahan Word sebelum finalisasi. Script finalisasi memperbarui field secara eksplisit dan menyimpan nilainya sebelum render. Kemajuan pembukaan, normalisasi heading, dan setiap pass ditampilkan untuk diagnosis.


## Pelengkapan screenshot penilaian

Data penilaian tambahan dibaca dari deployment yang ditentukan pengguna. Deployment juga mengalami DataTable is not defined. Impor named DataTable ditambahkan pada source lokal TugasSubmissions.jsx dan build Vite berhasil. Browser memuat frontend build lokal sebagai pratinjau dengan data autentik deployment; tidak ada pemasangan perubahan ke server. Semua request mutasi diblokir setelah login selama capture. Akun Laila tidak memiliki tombol grade pada halaman ini; tidak ada perubahan role atau permission. Identitas peserta disamarkan saat screenshot. Tujuh tampilan dipakai: ringkasan, kolom, hasil, feedback, belum kumpul, rubrik, serta dialog ekspor; rubrik menggantikan screenshot sebelumnya. Prosedur perubahan nilai belum diuji simpan. Berkas revisi: output/guidebook/Panduan SILAB Praktikum dengan Penilaian.docx; QA: output/guidebook/penilaian-qa.


## Edisi Kepengurusan dan revisi judul

Default memasukkan content/kepengurusan.json sebagai BAB 6 dan kendala umum menjadi BAB 7. Hasil terbaru output/guidebook/Panduan SILAB sampai Modul Kepengurusan.docx; QA output/guidebook/kepengurusan-qa. Seluruh heading isi dan judul bagian awal 12 pt tebal dengan w:caps. Front Matter Title dan Heading 1 rata tengah, Heading 2?3 rata kiri. Cover dikecualikan. Validator memeriksa ukuran, kapital, dan perataan baru. Screenshot penilaian diambil ulang dari localhost melalui frontend preview lokal; request mutasi tetap diblokir. Kepengurusan memuat 16 prosedur serta keluaran PDF lokal yang valid; formulir tidak disimpan. Data contoh kegiatan kosong dan keputusan persetujuan tidak dijalankan. Penampil PDF aplikasi gagal, tetapi respons preview PDF valid dan halaman contoh dirender dengan pypdfium2 untuk ilustrasi buku. Laporan contoh belum lengkap atau disahkan.

## Sumber laporan Kepengurusan

Laporan Kalab dan Laporan LPJ Labor dijelaskan sebagai keluaran dari data proker dan kegiatan. Prosedur dimulai dengan melengkapi serta memeriksa data sumber pada laboratorium dan periode yang sama; pembuatan PDF bukan pengganti pencatatan proker atau kegiatan. LPJ lengkap mengikuti status persetujuan data sumber.


## Edisi Kuesioner

Default builder menambahkan content/kuesioner.json setelah Kepengurusan, dengan hasil Panduan SILAB sampai Modul Kuesioner.docx. Modul ini berisi tujuh prosedur dan empat screenshot akun Superadmin. Daftar lokal masih kosong: formulir dibuka tanpa menyimpan, sedangkan pengisian dan hasil diperiksa melalui source. QA edisi ini berada di output/guidebook/kuesioner-qa. Koreksi sumber laporan dari proker dan kegiatan tetap dipertahankan.


## Revisi judul dan paragraf

Heading 1 mempertahankan nomor multitingkat Bab dan memisahkan nama bab dengan line break dalam paragraf heading yang sama. Ini menjaga nomor subbab, caption, dan navigasi otomatis. Heading 2/3 serta judul bagian awal menggunakan title case, mempertahankan singkatan dan kata penghubung. Inden 1,25 cm diterapkan pada komponen paragraf naratif, bukan pada Normal secara global agar tabel serta caption tidak ikut bergeser. Hasil revisi: Panduan SILAB revisi judul dan paragraf.docx; QA: output/guidebook/judul-paragraf-qa.

