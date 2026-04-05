# Penjelasan Detail Flow Semua Activity Diagram (Tanpa Modul Surat Menyurat)

Dokumen ini adalah versi detail dari narasi activity diagram untuk kebutuhan laporan. Setiap diagram dijelaskan dalam bentuk paragraf dengan pola alur: **aktor memulai proses → sistem memvalidasi/menentukan percabangan → sistem menyimpan/mengubah data → sistem menampilkan hasil akhir**. Cakupan disusun lengkap untuk seluruh activity diagram pada modul non-surat.

Total activity diagram yang dijelaskan: **58 diagram**.

---

## 1) Modul Inventaris

### ACT_01_MENGELOLA_ASET

Alur dimulai saat petugas inventaris membuka menu manajemen aset dan sistem menampilkan daftar aset aktif beserta aksi tambah, ubah, dan hapus. Ketika petugas menambah data, sistem memvalidasi identitas aset (nama, kategori, kode, lokasi, status kepemilikan, dan atribut wajib lain) lalu menyimpan jika data valid. Pada proses ubah, sistem memuat data lama sebagai baseline, memeriksa perubahan yang dikirim, kemudian menulis riwayat pembaruan agar jejak audit tetap ada; sedangkan pada proses hapus, sistem mengecek keterkaitan aset dengan transaksi (peminjaman, kondisi, atau log lain) untuk mencegah penghapusan yang melanggar integritas. Alur berakhir ketika daftar aset direfresh dan pengguna menerima umpan balik sukses/gagal sesuai hasil validasi.

### ACT_02_MELIHAT_DAFTAR_ASET

Proses dimulai ketika pengguna membuka halaman daftar aset untuk observasi inventaris. Sistem membaca parameter pencarian seperti kata kunci, kategori, lokasi, kondisi, dan status ketersediaan, lalu mengembalikan hasil yang sesuai dalam bentuk tabel/paginasi. Jika pengguna memilih salah satu baris, sistem menampilkan detail aset yang lebih lengkap (metadata aset, kondisi terakhir, dan informasi relasional yang diizinkan). Jika filter tidak menghasilkan data, sistem menampilkan keadaan kosong (empty state) agar pengguna memahami bahwa tidak ada data pada kriteria tersebut.

### ACT_03_SCAN_QR_PUBLIK

Alur dimulai ketika pengguna memindai QR code pada label aset menggunakan perangkat yang tersedia. Sistem menerjemahkan token QR, memverifikasi format token, lalu mencari kecocokan terhadap entitas aset yang terdaftar. Jika aset ditemukan dan boleh ditampilkan secara publik, sistem menampilkan ringkasan aset seperti nama barang, lokasi, status, dan informasi non-sensitif; jika token rusak/tidak valid atau aset tidak ditemukan, sistem menampilkan pesan kesalahan yang jelas. Alur ditutup dengan opsi pemindaian ulang agar pengguna dapat melanjutkan proses tanpa kembali ke menu awal.

### ACT_04_MENGELOLA_KONDISI_ASET

Proses dimulai dari petugas yang memilih aset tertentu untuk memperbarui kondisi fisik. Pengguna memasukkan status kondisi baru (misal baik, rusak ringan, rusak berat), catatan kerusakan, dan bila perlu lampiran bukti, lalu sistem memvalidasi format data serta konsistensi status terhadap transaksi berjalan. Jika lolos validasi, sistem menyimpan kondisi baru sebagai data terkini sekaligus menulis log riwayat perubahan kondisi untuk keperluan audit perawatan. Alur berakhir ketika sistem menampilkan status terbaru di daftar aset dan mengonfirmasi bahwa pembaruan berhasil disimpan.

### ACT_05_MENGELOLA_PEMINJAMAN

Alur dimulai saat petugas atau peminjam membuat transaksi peminjaman dengan memilih aset, rentang waktu pinjam, serta identitas peminjam. Sistem mengecek apakah aset tersedia, tidak sedang dipinjam pihak lain, dan peminjam memenuhi syarat administrasi. Jika valid, transaksi dibuat dengan status aktif; jika tidak, sistem menolak transaksi disertai alasan (bentrok jadwal, aset tidak tersedia, atau data tidak lengkap). Pada tahap pengembalian, sistem memverifikasi transaksi aktif, mencatat waktu kembali dan kondisi akhir aset, kemudian menutup transaksi dan mengubah status aset menjadi tersedia kembali.

### ACT_06_MENGELOLA_PERMOHONAN

Proses dimulai ketika pengelola membuka daftar permohonan penggunaan/peminjaman aset yang masuk. Sistem menampilkan antrean permohonan berdasarkan status (menunggu, disetujui, ditolak, selesai) agar pengelola dapat memprioritaskan penanganan. Saat satu permohonan ditinjau, sistem menyajikan detail kebutuhan, waktu, dan aset terkait untuk dasar keputusan. Pengelola kemudian memilih menyetujui atau menolak; sistem menyimpan keputusan, memperbarui status permohonan, dan jika disetujui dapat melanjutkan ke pembuatan transaksi peminjaman.

### ACT_07_MENGAJUKAN_PERMOHONAN

Alur dimulai dari sisi pengusul saat membuka formulir permohonan dan mengisi tujuan, periode penggunaan, daftar kebutuhan aset, serta catatan pendukung. Sistem memvalidasi kolom wajib, format tanggal, dan kelayakan awal permintaan sebelum menerima submit. Bila data valid, sistem membuat entri permohonan berstatus menunggu dan mengirimkan notifikasi ke pihak yang berwenang memproses. Pengusul kemudian dapat memantau progres dari daftar permohonan sampai keputusan final diterbitkan.

### ACT_08_APPROVAL_PERMOHONAN_KADEP

Proses dimulai saat Kepala Departemen mengakses daftar permohonan yang memerlukan persetujuan level otoritatif. Sistem menampilkan detail permohonan, justifikasi, dan konteks kebutuhan untuk mendukung proses penilaian. Kadep melakukan keputusan approve/reject, dan sistem merekam keputusan beserta waktu dan catatan keputusan untuk audit. Jika disetujui, alur berlanjut ke tahap operasional (pengadaan/penyediaan/peminjaman); jika ditolak, status ditutup dengan alasan yang dapat dilihat pemohon.

### ACT_09_MENGELOLA_KATEGORI_ASET

Alur dimulai ketika admin inventaris membuka master kategori aset sebagai referensi klasifikasi barang. Pada aksi tambah, sistem memvalidasi keunikan nama kategori dan kelengkapan deskripsi; pada aksi ubah, sistem memastikan pembaruan tidak merusak relasi dengan aset yang sudah ada. Untuk aksi hapus, sistem mengecek apakah kategori masih dipakai oleh aset aktif; bila masih dipakai, sistem menolak hapus dan meminta migrasi kategori terlebih dahulu. Alur berakhir saat daftar kategori diperbarui dan konsistensi referensi kategori tetap terjaga.

### ACT_10_MELIHAT_PERMOHONAN_PENGADAAN

Proses dimulai saat pengguna berwenang membuka halaman monitoring permohonan pengadaan. Sistem menampilkan daftar pengajuan berdasarkan filter periode, status approval, dan unit pengusul agar proses review lebih terarah. Ketika detail dibuka, sistem menampilkan rincian item yang diajukan, estimasi biaya, dan riwayat keputusan/komentar dari reviewer sebelumnya. Karena alur ini bersifat observasi, pengguna tidak mengubah data inti, melainkan menggunakan informasi tersebut untuk kontrol dan tindak lanjut administratif.

---

## 2) Modul Keuangan

### ACT_01_MENGELOLA_RIWAYAT_KEUANGAN

Alur dimulai ketika pengurus keuangan masuk ke menu riwayat transaksi untuk mencatat pemasukan/pengeluaran. Sistem meminta data transaksi (tanggal, nominal, jenis, kategori, sumber/tujuan, deskripsi) lalu melakukan validasi format angka, kelengkapan, dan konsistensi akun. Jika valid, transaksi disimpan dan berdampak pada saldo berjalan; jika tidak valid, sistem mengembalikan form dengan pesan koreksi. Alur selesai saat daftar riwayat diperbarui dan transaksi baru muncul sebagai bagian audit trail keuangan.

### ACT_02_MENGELOLA_NOMINAL_KAS

Proses dimulai saat admin keuangan membuka pengaturan nominal kas periodik. Pengguna mengubah nilai ketetapan kas beserta periode berlakunya, lalu sistem memvalidasi agar nilai tidak negatif, format benar, dan tidak bentrok dengan aturan periode yang sudah aktif. Setelah disimpan, sistem menandai nominal terbaru sebagai acuan operasional untuk proses penagihan atau pencatatan kas berikutnya. Jika terdapat konflik periode, sistem meminta pengguna menutup periode lama atau menyesuaikan tanggal efektif.

### ACT_03_MELIHAT_CATATAN_KAS

Alur dimulai ketika pengguna membuka catatan kas untuk menelusuri transaksi harian/bulanan. Sistem mengambil data berdasarkan filter yang dipilih (rentang waktu, jenis transaksi, kategori), kemudian menampilkannya dalam urutan kronologis agar mudah diaudit. Pengguna dapat membuka detail transaksi untuk melihat nomor referensi, bukti, dan catatan perubahan bila tersedia. Karena sifatnya read-only, alur fokus pada transparansi data tanpa modifikasi transaksi.

### ACT_04_MELIHAT_REKAP_KEUANGAN

Proses dimulai saat pengguna meminta rekap keuangan pada periode tertentu. Sistem menghitung total pemasukan, total pengeluaran, dan saldo akhir dengan mengagregasi data transaksi yang memenuhi filter. Hasil ditampilkan dalam ringkasan numerik dan dapat disertai komponen pendukung (per kategori atau per waktu) agar memudahkan interpretasi. Alur berakhir saat pengguna memperoleh gambaran kondisi keuangan periodik untuk evaluasi dan pelaporan.

### ACT_05_MELIHAT_RIWAYAT_KEUANGAN

Alur dimulai ketika pengguna melakukan penelusuran historis untuk kebutuhan audit atau pembuktian transaksi lama. Sistem mengambil data terdahulu berdasarkan kata kunci/parameter, menampilkan daftar hasil, dan memungkinkan pembukaan detail transaksi secara spesifik. Bila ditemukan anomali, pengguna dapat mencatat temuan untuk tindak lanjut administratif (bukan mengubah data langsung dalam alur ini). Proses berakhir saat informasi historis yang diperlukan berhasil ditemukan dan diverifikasi.

---

## 3) Modul Praktikum

### ACT_01_MENGELOLA_PRAKTIKUM

Alur dimulai ketika koordinator/asisten membuka menu praktikum untuk membuat kelas baru atau memperbarui kelas yang sudah ada. Sistem memvalidasi data inti seperti nama kelas, periode, mata kuliah, kapasitas, dan status aktif sebelum menyimpan perubahan. Jika membuat data baru, sistem membuat identitas praktikum dan relasi dasarnya; jika mengubah data, sistem memastikan perubahan tidak melanggar dependensi (misalnya jadwal/pertemuan aktif). Alur berakhir ketika kelas praktikum tercatat dan siap dipakai dalam proses turunan seperti pertemuan, modul, tugas, absensi, dan penilaian.

### ACT_02_MELIHAT_PRAKTIKUM

Proses dimulai saat pengguna masuk ke halaman daftar praktikum sesuai hak akses perannya (asisten, dosen, praktikan, atau admin). Sistem mengambil data yang relevan, menampilkan ringkasan kelas, dan menyediakan filter periode/status. Pengguna dapat membuka detail satu kelas untuk melihat informasi lengkap (jadwal, pengajar/aslab, peserta, dan progres kegiatan). Karena ini alur observasi, tidak ada mutasi data inti, hanya navigasi informasi untuk monitoring.

### ACT_03_MENGELOLA_PERTEMUAN

Alur dimulai ketika pengelola kelas menambahkan atau memperbarui sesi pertemuan. Sistem memvalidasi nomor pertemuan agar tidak duplikat, memeriksa jadwal terhadap potensi bentrok, serta memastikan relasi ke kelas praktikum valid. Jika valid, data pertemuan disimpan beserta topik/deskripsi materi sehingga dapat dipakai oleh absensi, modul, dan tugas. Alur selesai saat daftar pertemuan terbarui dan siap dieksekusi pada jadwal yang ditentukan.

### ACT_04_MENGELOLA_MODUL

Proses dimulai saat asisten/dosen membuat materi modul untuk pertemuan tertentu. Pengguna mengisi metadata modul dan mengunggah berkas, lalu sistem memvalidasi tipe file, ukuran, dan keterkaitan dengan pertemuan. Jika data valid, modul disimpan dan dipublikasikan; jika tidak, sistem menolak dengan pesan validasi agar pengguna memperbaiki input. Saat modul diubah, sistem mengganti versi tampil sehingga praktikan selalu melihat materi paling mutakhir.

### ACT_05_MENGAKSES_MODUL

Alur dimulai ketika praktikan membuka menu modul pada kelas yang diikutinya. Sistem memverifikasi akses berdasarkan keanggotaan kelas dan status publikasi modul, lalu menampilkan daftar materi yang tersedia. Praktikan memilih modul untuk dibaca atau diunduh sebagai bahan belajar sebelum tugas/pertemuan berjalan. Jika modul belum dipublikasikan atau akses ditolak, sistem menampilkan notifikasi sesuai kondisi.

### ACT_06_MENGELOLA_PRAKTIKAN

Proses dimulai saat pengelola kelas membuka menu anggota praktikan. Sistem menyediakan aksi tambah, ubah status, dan hapus keanggotaan dengan validasi agar satu praktikan tidak terdaftar ganda pada konteks yang dilarang. Setelah perubahan disimpan, sistem memperbarui jumlah peserta dan daftar anggota aktif kelas. Alur berakhir ketika komposisi kelas sinkron dengan kondisi akademik terbaru.

### ACT_07_MENGELOLA_ASLAB

Alur dimulai saat koordinator menugaskan asisten laboratorium pada kelas praktikum tertentu. Sistem mengecek apakah aslab tersedia pada periode/jadwal yang sama dan memastikan tidak terjadi bentrok penugasan. Jika valid, relasi aslab-kelas disimpan sehingga aslab memperoleh akses operasional sesuai tanggung jawabnya. Jika terjadi konflik jadwal, sistem menolak dan meminta penjadwalan ulang.

### ACT_08_MENGELOLA_TUGAS

Proses dimulai ketika pengajar membuat tugas dengan menentukan judul, deskripsi, tenggat, dan ketentuan berkas. Sistem memvalidasi kelengkapan dan aturan tenggat, kemudian mempublikasikan tugas ke kelas target jika data valid. Dalam siklus berikutnya, pengajar dapat memperbarui instruksi, memperpanjang tenggat, atau menutup tugas saat periode selesai. Alur berakhir saat status tugas tercatat jelas (draft, aktif, ditutup) dan dapat dipantau semua pihak terkait.

### ACT_09_MENGELOLA_RUBRIK

Alur dimulai saat pengajar menyusun rubrik sebagai standar penilaian tugas. Pengajar menentukan indikator, deskripsi level penilaian, dan bobot, sementara sistem memvalidasi total bobot agar konsisten dengan aturan penilaian. Rubrik yang valid disimpan sebagai template sehingga proses penilaian lebih objektif dan seragam antar-submission. Jika rubrik diperbarui, sistem menjaga versi aktif agar histori penilaian tetap terlacak.

### ACT_10_MENGELOLA_PENILAIAN

Proses dimulai ketika pengajar membuka daftar submission untuk dinilai. Sistem menampilkan karya praktikan, status pengumpulan, dan rubrik aktif, lalu pengajar mengisi skor serta catatan umpan balik. Sistem memvalidasi rentang skor, menghitung nilai akhir bila diperlukan, dan menyimpan hasil penilaian per submission. Alur berakhir ketika nilai dipublikasikan (sesuai kebijakan) sehingga praktikan dapat melihat hasil evaluasi.

### ACT_11_MENGUMPULKAN_TUGAS

Alur dimulai saat praktikan membuka detail tugas aktif dan menyiapkan berkas jawaban. Sistem memvalidasi batas ukuran, ekstensi file, serta tenggat waktu saat submit dilakukan. Jika lolos validasi, sistem menyimpan submission, memberi cap waktu kirim, dan mengubah status menjadi terkumpul; jika terlambat atau format salah, sistem memberi penolakan/penandaan sesuai aturan. Alur berakhir ketika praktikan menerima bukti pengumpulan yang bisa dilihat kembali di riwayat.

### ACT_12_MENGELOLA_ABSENSI

Proses dimulai ketika asisten/pengajar membuka absensi pada pertemuan tertentu. Sistem menampilkan daftar praktikan terdaftar, lalu petugas menandai status kehadiran (hadir, izin, sakit, alfa) untuk setiap peserta. Setelah submit, sistem memvalidasi konsistensi data dan menyimpan absensi sebagai catatan resmi per pertemuan. Data ini kemudian dipakai pada rekap performa praktikum dan komponen evaluasi akhir.

### ACT_13_MENGELOLA_SERTIFIKAT

Alur dimulai saat pengelola memproses penerbitan sertifikat praktikum. Sistem memverifikasi syarat kelulusan seperti nilai minimum, kehadiran, dan kelengkapan administrasi sebelum menyatakan peserta layak. Untuk peserta yang lolos, sistem membentuk data sertifikat, menyimpan nomor/identitas sertifikat, dan menyiapkan dokumen untuk diakses. Alur berakhir ketika status sertifikat peserta menjadi tersedia dan siap diunduh.

### ACT_14_MELIHAT_TUGAS

Proses dimulai ketika praktikan membuka halaman daftar tugas kelasnya. Sistem menampilkan seluruh tugas dengan indikator status (belum dikerjakan, sudah dikumpulkan, dinilai, lewat tenggat) sehingga pengguna mudah memprioritaskan pekerjaan. Saat tugas dibuka, sistem menyajikan instruksi detail, tenggat, dan syarat pengumpulan. Alur ini berakhir pada tahap pembacaan informasi tanpa perubahan data.

### ACT_15_RIWAYAT_PENGUMPULAN

Alur dimulai saat praktikan/pengajar membuka riwayat submission untuk satu kelas atau satu tugas. Sistem menampilkan daftar pengumpulan lengkap dengan waktu kirim, status validasi, dan catatan revisi bila ada. Pengguna dapat membuka detail submission untuk pembuktian teknis kapan dan file apa yang dikirim. Proses berakhir saat pengguna memperoleh jejak pengumpulan yang dibutuhkan untuk verifikasi.

### ACT_16_MELIHAT_SERTIFIKAT

Proses dimulai ketika praktikan membuka menu sertifikat setelah siklus penilaian selesai. Sistem memeriksa hak akses, status kelayakan, dan ketersediaan dokumen sertifikat milik pengguna. Jika sertifikat tersedia, sistem menampilkan daftar sertifikat beserta opsi lihat/unduh; jika belum tersedia, sistem menampilkan informasi status proses. Alur berakhir ketika pengguna berhasil memperoleh dokumen atau memahami alasan sertifikat belum dapat diakses.

### ACT_17_MELIHAT_REKAP_PRAKTIKUM

Alur dimulai saat pengguna berwenang meminta ringkasan hasil praktikum. Sistem mengompilasi nilai tugas, absensi, capaian pertemuan, dan indikator kelulusan ke dalam satu tampilan rekap. Pengguna dapat menerapkan filter kelas/periode untuk analisis yang lebih spesifik. Alur berakhir saat rekap digunakan sebagai dasar evaluasi pembelajaran dan pelaporan kinerja kelas.

---

## 4) Modul Kegiatan Proker & Kepengurusan

### ACT_01_MENGELOLA_PROKER

Alur dimulai ketika pengurus membuat usulan proker atau mengubah proker yang sudah ada. Sistem memvalidasi data pokok (nama proker, tujuan, periode, penanggung jawab, deskripsi) sebelum menyimpan. Jika valid, data proker tersimpan sebagai entitas induk untuk kegiatan, dokumentasi, evaluasi, dan approval. Alur berakhir ketika proker tampil pada daftar dan siap diproses pada tahapan berikutnya.

### ACT_02_PARAMETER_PENILAIAN_PROKER

Proses dimulai saat pengurus/evaluator menetapkan parameter penilaian untuk setiap proker. Sistem memvalidasi struktur parameter dan bobot agar total komponen evaluasi konsisten. Parameter yang disimpan menjadi standar baku saat evaluasi dilakukan, sehingga penilaian lebih terukur dan dapat dibandingkan antar-proker. Jika ada revisi, sistem memperbarui parameter aktif tanpa menghapus jejak versi sebelumnya.

### ACT_03_DOKUMENTASI_PROKER

Alur dimulai ketika pelaksana mengunggah dokumentasi pelaksanaan proker (berita, foto, file pendukung, atau laporan). Sistem memvalidasi format lampiran, ukuran file, dan keterkaitan dengan proker yang dipilih. Jika lolos validasi, dokumentasi disimpan dan dapat ditinjau pihak terkait sebagai bukti kegiatan. Alur berakhir dengan status dokumentasi tercatat serta siap ditarik ke laporan.

### ACT_04_AJUKAN_EVALUASI_PROKER

Proses dimulai saat pengurus mengajukan evaluasi atas proker yang telah berjalan. Sistem menerima pengajuan, memberi status menunggu evaluasi, dan mencatat metadata pengajuan (waktu, pengusul, catatan pendukung). Pengajuan ini lalu masuk ke antrian evaluator untuk ditinjau berdasarkan parameter yang berlaku. Alur berakhir ketika pengajuan tercatat resmi dan siap diproses pada tahap penilaian.

### ACT_05_MENYETUJUI_PROKER

Alur dimulai ketika pejabat berwenang meninjau usulan proker. Sistem menampilkan detail usulan, kesiapan dokumen, dan konteks kebutuhan agar keputusan dapat diambil secara terinformasi. Pengambil keputusan memilih setuju atau tolak, lalu sistem menyimpan keputusan beserta catatan agar jejak approval terdokumentasi. Status proker diperbarui sesuai hasil keputusan dan menjadi dasar eksekusi berikutnya.

### ACT_06_MENGELOLA_KEGIATAN

Proses dimulai saat pengurus membuat kegiatan turunan dari proker. Sistem memvalidasi relasi ke proker induk, tanggal pelaksanaan, lokasi, dan penanggung jawab agar tidak bentrok dengan agenda lain. Setelah valid, kegiatan disimpan dan dapat muncul pada kalender, daftar peserta, serta mekanisme approval kegiatan. Alur selesai ketika data kegiatan siap dieksekusi dan dipantau.

### ACT_07_LAPORAN_DOKUMENTASI_KEGIATAN

Alur dimulai saat pengguna meminta laporan dokumentasi kegiatan berdasarkan periode/proker tertentu. Sistem mengumpulkan semua dokumen pendukung yang relevan, mengelompokkan data, lalu menampilkan ringkasan beserta detail pendukung. Pengguna menggunakan hasil ini untuk monitoring progres dan pertanggungjawaban kegiatan. Karena fokusnya pelaporan, alur tidak melakukan perubahan data inti.

### ACT_08_PESERTA_KEGIATAN

Proses dimulai ketika panitia/pengurus mengelola data peserta kegiatan. Sistem memvalidasi identitas peserta, status pendaftaran, dan kuota sebelum menyimpan perubahan tambah/ubah/hapus peserta. Setelah valid, daftar peserta final terbentuk dan menjadi dasar absensi serta penerbitan sertifikat kegiatan. Alur berakhir saat daftar peserta terkonfirmasi sesuai kapasitas kegiatan.

### ACT_09_SERTIFIKAT_KEGIATAN

Alur dimulai saat panitia memproses sertifikat untuk peserta kegiatan yang memenuhi kriteria. Sistem memeriksa syarat kelayakan peserta (kehadiran, status partisipasi, dan ketentuan lain), lalu menghasilkan data sertifikat untuk yang lolos. Dokumen sertifikat disiapkan dan ditautkan ke peserta secara individual agar dapat diakses aman. Alur berakhir saat status sertifikat kegiatan berubah menjadi tersedia.

### ACT_10_MENYETUJUI_KEGIATAN

Proses dimulai ketika pihak berwenang meninjau usulan kegiatan yang diajukan pelaksana. Sistem menampilkan detail kegiatan, jadwal, kebutuhan sumber daya, dan relasi ke proker sebagai basis review. Keputusan approve/reject dicatat oleh sistem lengkap dengan catatan keputusan untuk audit. Hasil keputusan mengubah status kegiatan dan menentukan apakah kegiatan dapat lanjut ke tahap pelaksanaan.

### ACT_11_KALENDER_KEGIATAN

Alur dimulai saat pengguna membuka kalender kegiatan organisasi. Sistem mengambil kegiatan terjadwal pada periode yang dipilih dan menampilkannya dalam tampilan kalender agar mudah dibaca secara temporal. Pengguna dapat memilih salah satu agenda untuk melihat detail kegiatan, PIC, dan status persetujuan. Alur berakhir pada tahap konsumsi informasi untuk koordinasi lintas tim.

### ACT_12_MENGELOLA_KEPENGURUSAN

Proses dimulai ketika admin organisasi mengelola data kepengurusan (periode, struktur, status aktif/nonaktif). Sistem memvalidasi konsistensi periodisasi dan mencegah duplikasi periode aktif yang bertabrakan. Jika valid, data kepengurusan disimpan sebagai acuan resmi hak akses dan struktur organisasi. Alur berakhir ketika struktur kepengurusan terbaru berlaku pada modul terkait.

### ACT_13_MENGELOLA_ANGGOTA

Alur dimulai saat pengurus memperbarui data anggota dalam struktur kepengurusan. Sistem memvalidasi identitas anggota, posisi/jabatan, dan masa aktif sebelum menyimpan perubahan. Jika ada perpindahan jabatan, sistem memperbarui relasi anggota terhadap unit kerja yang baru agar struktur tetap sinkron. Alur berakhir saat daftar anggota aktif tercatat akurat.

### ACT_14_MELIHAT_DAFTAR_PROKER

Proses dimulai ketika pengguna membuka daftar proker untuk monitoring umum. Sistem menampilkan data proker dengan filter status (draft, diajukan, disetujui, berjalan, selesai) dan filter periode. Pengguna dapat membuka detail satu proker untuk melihat progres, dokumentasi, dan evaluasinya. Karena read-only, alur fokus pada transparansi dan pelacakan progres.

### ACT_15_MELIHAT_DAFTAR_KEGIATAN

Alur dimulai saat pengguna menelusuri daftar kegiatan yang terkait proker tertentu atau seluruh proker. Sistem menampilkan kegiatan berikut jadwal, status approval, dan penanggung jawab agar mudah dipantau. Pengguna membuka detail kegiatan jika diperlukan untuk koordinasi atau evaluasi. Alur berakhir saat informasi kegiatan yang dibutuhkan berhasil diperoleh.

### ACT_16_MENGEVALUASI_PROKER

Proses dimulai ketika evaluator membuka proker yang siap dinilai. Sistem menampilkan parameter penilaian aktif, lalu evaluator mengisi skor dan catatan evaluasi pada tiap indikator. Setelah submit, sistem memvalidasi kelengkapan nilai dan menyimpan hasil evaluasi sebagai data resmi. Alur berakhir ketika hasil evaluasi dapat dipakai sebagai umpan balik untuk perbaikan siklus proker berikutnya.

---

## 5) Modul Piket

### ACT_01_MENGELOLA_PERIODE_PIKET

Alur dimulai saat pengelola membuat periode piket baru dengan menentukan nama periode, tanggal mulai, dan tanggal selesai. Sistem memvalidasi agar periode tidak bertabrakan dengan periode aktif lain serta memastikan rentang waktu logis. Jika valid, periode disimpan dan ditandai aktif/nonaktif sesuai kebijakan. Periode aktif ini menjadi dasar semua proses jadwal, absensi, dan rekap piket.

### ACT_02_MENGELOLA_JADWAL_PIKET

Proses dimulai ketika pengurus menyusun jadwal piket untuk anggota pada periode tertentu. Sistem memvalidasi distribusi jadwal agar tidak bentrok pada hari/jam yang sama dan memastikan anggota yang dijadwalkan berstatus aktif. Setelah valid, jadwal disimpan dan dipublikasikan ke anggota. Alur berakhir saat jadwal tersedia dan siap dijalankan pada hari operasional.

### ACT_03_MENGELOLA_ABSENSI_PIKET

Alur dimulai saat petugas membuka absensi untuk jadwal piket hari berjalan. Sistem menampilkan daftar petugas terjadwal, lalu status kehadiran dicatat per anggota. Setelah submit, sistem memvalidasi data dan menyimpan absensi sebagai jejak performa piket. Data ini kemudian digunakan dalam rekap disiplin dan evaluasi periodik.

### ACT_04_MENGAJUKAN_GANTI_JADWAL

Proses dimulai ketika anggota berhalangan hadir dan mengajukan penggantian jadwal. Pengaju memilih jadwal yang akan diganti, calon pengganti, serta alasan, kemudian sistem mengecek kelengkapan dan kemungkinan bentrok. Jika valid, pengajuan disimpan dengan status menunggu persetujuan dan diteruskan ke pengurus. Alur berakhir saat pengajuan masuk antrian approval.

### ACT_05_MENYETUJUI_GANTI_JADWAL

Alur dimulai ketika pengurus meninjau daftar pengajuan ganti jadwal. Sistem menampilkan detail pengajuan termasuk jadwal asal, calon pengganti, dan dampak pada jadwal lain. Pengurus memutuskan setuju atau tolak; jika setuju, sistem memperbarui jadwal piket secara otomatis, jika tolak status pengajuan ditutup dengan catatan alasan. Alur berakhir ketika keputusan tersimpan dan anggota menerima hasilnya.

### ACT_06_MELIHAT_REKAP_ABSENSI

Proses dimulai saat pengguna berwenang membuka rekap absensi piket per periode. Sistem mengagregasi data kehadiran per anggota, menghitung tingkat kehadiran, lalu menampilkan ringkasan yang mudah dibandingkan. Pengguna dapat menelusuri detail jika menemukan anomali kedisiplinan. Alur berakhir pada penggunaan data rekap untuk evaluasi pembinaan anggota.

### ACT_07_MELIHAT_JADWAL_PIKET

Alur dimulai ketika anggota membuka jadwal piket pribadinya. Sistem memfilter jadwal berdasarkan identitas anggota dan periode aktif, lalu menampilkan hari, jam, dan status tugas. Jika ada perubahan jadwal karena approval ganti jadwal, tampilan langsung menyesuaikan data terbaru. Alur berakhir ketika anggota memperoleh kepastian jadwal pelaksanaan tugas.

---

## 6) Modul Kuesioner

### ACT_01_MENGELOLA_KUESIONER

Proses dimulai ketika admin/pengelola membuat instrumen kuesioner baru atau merevisi instrumen lama. Sistem memvalidasi struktur kuesioner (judul, daftar pertanyaan, tipe jawaban, opsi jawaban, target responden, periode aktif) agar siap dipublikasikan. Jika valid, kuesioner disimpan sebagai draft atau langsung dipublikasikan sesuai pilihan pengguna. Alur berakhir saat instrumen tersedia dan dapat diisi oleh responden yang berhak.

### ACT_02_MENGISI_KUESIONER

Alur dimulai saat responden membuka kuesioner aktif yang tersedia untuk dirinya. Responden mengisi jawaban per pertanyaan, lalu sistem memvalidasi kelengkapan dan konsistensi jawaban wajib sebelum menerima submit. Jika submit berhasil, sistem menyimpan respons sebagai data final dan biasanya mengunci pengisian ulang sesuai aturan satu responden satu respons. Alur berakhir ketika responden menerima konfirmasi bahwa jawaban telah tersimpan.

### ACT_03_MELIHAT_HASIL_KUESIONER

Proses dimulai ketika pihak berwenang membuka hasil kuesioner untuk analisis. Sistem mengolah respons menjadi ringkasan statistik (misalnya distribusi jawaban, rerata nilai, dan indikator lain), lalu menampilkan hasil dalam format yang mudah dibaca. Pengguna dapat menelusuri detail jawaban untuk pendalaman temuan bila diperlukan. Alur berakhir ketika hasil analisis dipakai sebagai dasar evaluasi layanan/kegiatan dan pengambilan keputusan.

---

## Catatan Validasi Cakupan

Dokumen ini mencakup seluruh file activity diagram berikut, **kecuali folder surat/activity**:

- inventaris/activity (10)
- keuangan/activity (5)
- praktikum/activity (17)
- kegiatan_proker/activity (16)
- piket/activity (7)
- kuesioner/activity (3)

Total: **58 activity diagram**.
