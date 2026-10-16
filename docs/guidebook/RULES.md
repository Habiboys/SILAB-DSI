# Standar buku panduan SILAB

Versi standar 1.0 — 15 Oktober 2026. Berlaku untuk buku gabungan dan contoh modul. Standar ini mengatur dokumen pengguna, bukan perubahan aplikasi.

## Susunan buku

Cover → Pengantar → Cara menggunakan panduan → Daftar isi → Daftar gambar → BAB 1 Pengenalan sistem dan peran → bab per modul → bab kendala umum. Edisi gabungan memakai BAB 2 Modul Piket, BAB 3 Modul Inventaris, BAB 4 Modul Keuangan, BAB 5 Modul Praktikum, BAB 6 Modul Kepengurusan, dan BAB 7 Penanganan kendala umum. Nomor bab tidak diketik ke isi judul agar modul dapat dipindah atau ditambahkan.

Cover menggunakan logo SILAB, tulisan di bagian atas, dan foto laboratorium di bagian bawah. Cover tidak menampilkan nomor halaman. Bagian awal memakai angka Romawi kecil mulai i; BAB 1 memakai angka Arab mulai 1.

## Hierarki

| Elemen | Fungsi | Word Style | Contoh tampilan |
|---|---|---|---|
| Bab | Modul atau topik utama | Heading 1 | BAB 2 Modul Piket |
| Subbab | Pengantar, kelompok peran, atau kendala modul | Heading 2 | 2.2 Asisten dan petugas piket |
| Tugas | Satu tujuan pengguna | Heading 3 | 2.2.1 Melakukan check-in |
| Label | Bagian prosedur tanpa nomor | Procedure Label | Sebelum mulai |
| Langkah | Tindakan berurutan | Numbered List | 1. Pilih Buka Kamera |
| Poin | Syarat atau informasi sejajar | Bulleted List | Kamera tersedia |
| Caption | Identitas screenshot | Caption | Gambar 2.1 Formulir check-in |

Maksimum tiga tingkat heading. Jangan melompati tingkat. Jangan memakai heading untuk screenshot, nama tombol, catatan, atau label prosedur. Rincian langkah memakai a, b, c hanya bila benar-benar diperlukan; jangan membuat heading 2.2.1.1. Daftar isi hanya mengambil Heading 1–3. Judul bagian awal menggunakan Front Matter Title tanpa masuk daftar isi utama.

## Isi modul dan pembagian peran

1. Awali modul dengan tujuan, alur, prasyarat, dan tabel peran—akses—tugas.
2. Tentukan tugas dari route, middleware, controller, policy, dan antarmuka yang berlaku. Jangan menganggap nama role atau komentar lama membuktikan hak akses. Catat sumber dan keterbatasan pada berkas isi modul.
3. Peran yang hanya melihat cukup disebutkan di tabel pembuka. Jangan membuat prosedur khusus untuk melihat saja.
4. Pemeriksaan data harus menjadi langkah prosedur bila diperlukan sebelum keputusan, approval, verifikasi, atau tindak lanjut.
5. Prosedur identik untuk beberapa peran ditulis sekali pada Tugas bersama dan menyebutkan peran yang berlaku. Jangan membuat kelompok ini jika tidak diperlukan.
6. Setiap tugas memuat penjelasan singkat, Sebelum mulai, Langkah, dan Hasil berhasil. Tambahkan Jika gagal jika ada kendala yang perlu ditangani.
7. Untuk approval, jelaskan pemohon, peninjau, data yang diperiksa, keputusan setuju/tolak, perubahan status, dan tindak lanjut pemohon. Jangan menyatukan pengajuan dan persetujuan sebagai satu tindakan.
8. Gunakan label menu dan kontrol sesuai aplikasi. Tebalkan kontrol seperlunya; paragraf isi tetap normal. Hindari istilah teknis internal pada petunjuk pengguna.
9. Langkah memakai daftar bernomor Word, dimulai kembali dari 1 pada setiap tugas. Syarat memakai bullet Word. Angka tidak ditulis manual pada teks langkah.

## Tata letak

| Elemen | Format |
|---|---|
| Halaman isi | A4, margin 2,5 cm di keempat sisi |
| Semua teks | Times New Roman, hitam; hapus font dan warna tema yang menimpa style |
| Heading 1 | 12 pt, tebal, kapital, rata tengah, mulai halaman baru |
| Heading 2 | 12 pt, tebal, kapital, rata kiri |
| Heading 3 dan Procedure Label | 12 pt, tebal |
| Isi dan daftar | 12 pt, normal, justify atau rata kiri-kanan, spasi 1,5 |
| Caption gambar dan tabel | 10 pt, rata tengah, spasi 1; caption gambar di bawah gambar, caption tabel di atas tabel |
| Footer | 10 pt, spasi 1 |
| Header | Kosong pada semua bagian dan varian halaman |
| Footer isi | Nama singkat panduan dan field PAGE |

Bab baru wajib mulai halaman baru. Subbab dan tugas mengikuti aliran isi, bukan dipaksa satu halaman per tugas. Heading melekat pada paragraf berikutnya; gambar melekat pada caption. Jangan membuat kotak catatan dekoratif. Tabel hanya untuk perbandingan, matriks akses, status, dan data sejajar; gunakan border abu-abu tipis, padding cukup, dan header berulang.

## Gambar dan navigasi otomatis

- Screenshot ditempatkan sesudah langkah yang relevan, sebelum Hasil berhasil. Jangan mengumpulkannya sebagai bab screenshot.
- Pertahankan rasio gambar, gunakan lebar area isi, dan pastikan kontrol terbaca. Untuk formulir kecil, ambil screenshot elemen melalui browser bila perlu; jangan menggambar ulang UI.
- Caption memakai field STYLEREF untuk nomor bab dan SEQ Gambar dengan reset per Heading 1, sehingga menghasilkan Gambar 2.1, Gambar 2.2, dan seterusnya.
- Rujukan gambar memakai bookmark + REF dengan hyperlink. Penomoran bab/subbab memakai numbering multilevel terhubung Heading 1–3.
- Daftar isi memakai TOC level 1–3 dengan hyperlink. Daftar gambar memakai TOC berdasarkan SEQ Gambar. Nomor halaman di kedua daftar dihitung Word, bukan diketik manual.
- Perbarui seluruh field, daftar isi, dan daftar gambar sebelum menyimpan hasil final. Penambahan atau pemindahan modul tidak boleh membutuhkan penggantian nomor manual.

## Bukti, data demo, dan keamanan isi

Bedakan screenshot yang telah diamati dari petunjuk yang diverifikasi melalui source. Jika screenshot suatu tugas belum tersedia, sebutkan pada catatan penyusunan; jangan membuat UI rekaan. Kamera virtual dan durasi demo harus dijelaskan. Demo satu menit bukan nilai valid form periode umum: form saat pemeriksaan membatasi lama piket 30–480 menit dan rentang Senin–Jumat pada minggu yang sama.

Jangan menaruh password, token, cookie sesi, atau isi .env di buku maupun data modul. Gunakan screenshot yang relevan saja. Jangan mengubah database atau menjalankan skenario mutasi saat membangun dokumen; persiapan demo merupakan pekerjaan terpisah dengan otorisasi dan pemulihan data yang jelas.

## Penerimaan

- Navigation Pane menunjukkan bab → peran/topik → tugas tanpa tingkat terlewat.
- Daftar isi dan daftar gambar berisi hasil aktual, hyperlink, dan nomor halaman yang telah diperbarui.
- Nomor tugas dan gambar berubah otomatis saat bab dipindahkan; langkah setiap tugas dimulai dari 1.
- Tidak ada prosedur berulang untuk role baca saja; tugas approval tetap menjelaskan pemeriksaan data.
- Setiap tugas punya prasyarat, langkah, dan hasil berhasil; sumber hak akses dapat ditelusuri.
- Seluruh halaman dirender dan dibaca: tidak ada clipping, heading tertinggal, caption terpisah, atau screenshot tidak terbaca.
- Header kosong, footer benar, font konsisten, dan kredensial tidak masuk hasil.

## Pembaruan format edisi gabungan

Teks naratif dan langkah menggunakan justify serta spasi 1,5. Judul bab rata tengah; judul subbab, tugas, dan label tetap rata kiri. Gambar dan tabel diletakkan di tengah area isi. Caption gambar dan tabel selalu rata tengah dengan nomor per bab. Sel tabel dan daftar isi tetap rata kiri dengan spasi 1,15 untuk keterbacaan; caption dan footer spasi 1. Daftar tabel otomatis diletakkan setelah daftar gambar. Aturan ini menggantikan format isi rata kiri spasi 1,15 pada versi awal.


## Revisi judul bagian awal dan ukuran judul

Seluruh judul isi maksimal 12 pt dan ditampilkan dengan huruf kapital melalui Word Style. Heading 1, Heading 2, dan Heading 3 memakai 12 pt tebal. Judul bab rata tengah; subbab dan tugas tetap rata kiri. Pengantar, Cara Menggunakan Panduan, Daftar Isi, Daftar Gambar, dan Daftar Tabel memakai Front Matter Title 12 pt tebal, kapital, rata tengah. Label prosedur tetap 12 pt tebal. Cover dikecualikan dan mempertahankan format judulnya. Aturan ini menggantikan ukuran 18/14 pt serta perataan kiri judul bagian awal dari versi sebelumnya.

## Modul Kuesioner

BAB 7 adalah Modul Kuesioner; kendala umum menjadi BAB 8. Pembuatan kuesioner dilakukan oleh Superadmin. Pisahkan prosedur pengelolaan, pengisian oleh responden sasaran, dan pemeriksaan hasil untuk evaluasi. Jangan menyatakan ekspor Excel, anonimitas, atau sinkronisasi jawaban eksternal tersedia tanpa bukti.


## Revisi judul dua baris dan inden paragraf

Judul bab terdiri dari dua baris dalam satu Heading 1: nomor otomatis Bab 1 pada baris pertama, nama bab huruf kapital pada baris kedua. Keduanya rata tengah, tebal, 12 pt. Heading 2 dan Heading 3 menggunakan kapital awal kata dengan kata penghubung/preposisi tetap kecil serta singkatan tetap kapital; contohnya Koordinator Divisi dan Penanggung Jawab. Judul bagian awal mengikuti kapital awal kata dan tetap rata tengah. Aturan ini menggantikan ketentuan kapital semua sebelumnya. Paragraf naratif memakai inden baris pertama 1,25 cm, justify, spasi 1,5. Heading, label, langkah, bullet, tabel, caption, footer, serta cover tidak diberi inden naratif.


## Penegasan judul bagian awal

Judul PENGANTAR, CARA MENGGUNAKAN PANDUAN, DAFTAR ISI, DAFTAR GAMBAR, dan DAFTAR TABEL termasuk judul besar: kapital semua, tebal, rata tengah, 12 pt. Aturan ini menggantikan ketentuan title case pada judul bagian awal dalam revisi sebelumnya. Heading 2/3 tetap kapital awal kata; format bab dua baris dan inden paragraf tetap berlaku.


## Penyederhanaan bagian awal

Bagian Cara Menggunakan Panduan serta Keterangan Contoh dan Batas Penyusunan beserta isinya dihapus dari buku sesuai revisi pengguna. Urutan bagian awal menjadi cover, Pengantar, Daftar Isi, Daftar Gambar, Daftar Tabel. Catatan sumber dan keterbatasan produksi tetap disimpan dalam data modul untuk penyusun.


## Revisi footer

Footer hanya berisi nomor halaman otomatis, rata tengah di bawah, tanpa nama panduan atau teks tambahan. Cover tetap tanpa nomor terlihat. Bagian awal memakai Romawi kecil dan isi memakai angka Arab mulai 1.

## Revisi pengenalan aplikasi

Nomor bab ditulis BAB 1, BAB 2, dan seterusnya dengan huruf kapital semua; nama bab tetap kapital pada baris kedua. BAB 1 berjudul PENGENALAN APLIKASI dan memuat pengertian SILAB, tujuh modul utama, enam role pengguna, pembagian jabatan pada role Dosen dan Asisten, serta cara masuk dan memilih kepengurusan. Tujuh modul adalah Kepengurusan, Piket, Inventaris, Praktikum, Keuangan, Kuesioner, dan Surat Menyurat. Enam role adalah Superadmin, Ketua Departemen, Admin, Dosen, Asisten, dan Praktikan. Bedakan jumlah modul aplikasi dari cakupan prosedur buku: pengenalan Surat Menyurat tidak berarti bab prosedurnya sudah disertakan.

## Penghapusan tabel pembagian akses modul

Tabel Peran–Akses–Tugas dengan caption Pembagian akses dihapus dari seluruh modul, beserta paragraf penjelasan pengguna baca saja yang mengikutinya. Subbab pembuka bernama Pengantar Modul dan tetap berisi pengantar, alur singkat, serta prasyarat. Ketentuan ini menggantikan kewajiban tabel pembagian akses pada bagian Isi modul dan pembagian peran. Penjelasan enam role dan pembagian jabatan dalam BAB 1 tetap dipertahankan.

