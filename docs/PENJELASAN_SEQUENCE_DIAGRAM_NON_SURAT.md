# Penjelasan Detail Flow Semua Sequence Diagram (Tanpa Modul Surat Menyurat)

Dokumen ini menjelaskan alur interaksi **sequence diagram** dalam bentuk paragraf untuk kebutuhan laporan. Fokus penjelasan ada pada urutan pesan antara aktor, antarmuka sistem, layanan/proses bisnis, dan basis data, mulai dari request masuk sampai respons akhir.

Cakupan dokumen ini: **semua sequence diagram non-surat** dari 7 modul (Auth, Inventaris, Keuangan, Praktikum, Kegiatan Proker & Kepengurusan, Piket, Kuesioner).

Total sequence diagram yang dijelaskan: **65 diagram**.

---

## 1) Modul Auth

### SEQ_01_LOGIN

Interaksi dimulai saat pengguna mengirim kredensial login dari form autentikasi ke server. Komponen autentikasi memvalidasi format input, mengambil data user dari basis data, lalu mencocokkan password terenkripsi dan status akun (aktif/tidak, terverifikasi/tidak). Jika valid, sistem membuat sesi/token, mencatat aktivitas login, lalu mengembalikan respons sukses beserta pengalihan ke dashboard; jika tidak valid, sistem mengirim pesan gagal autentikasi tanpa membuka sesi.

### SEQ_02_REGISTER

Alur dimulai ketika calon pengguna mengirim data pendaftaran. Layanan registrasi memvalidasi data wajib (nama, email, password, konfirmasi), memeriksa keunikan email, lalu membentuk akun baru di basis data dengan status awal tertentu. Setelah akun tersimpan, sistem dapat mengirim notifikasi/verifikasi email, menyiapkan role default, dan mengembalikan respons berhasil. Jika terjadi pelanggaran validasi atau email sudah terpakai, respons error dikirim ke klien untuk perbaikan input.

### SEQ_03_LUPA_RESET_PASSWORD

Interaksi dimulai saat pengguna meminta reset password melalui email. Sistem memvalidasi email, mencari akun terkait, lalu membuat token reset dengan masa berlaku tertentu dan mengirim tautan reset. Pada tahap setel ulang, pengguna mengirim token + password baru, sistem memverifikasi token, memperbarui hash password di basis data, dan menonaktifkan token yang sudah dipakai. Respons akhir mengonfirmasi reset berhasil atau gagal jika token tidak valid/kedaluwarsa.

### SEQ_04_LOGOUT

Alur dimulai saat pengguna menekan aksi logout. Sistem menerima request, memvalidasi sesi/token aktif, lalu menghancurkan sesi atau mencabut token agar akses lanjutan tidak berlaku. Setelah sesi dihapus, sistem mengembalikan respons sukses dan mengarahkan pengguna ke halaman login/public. Jika sesi sudah tidak valid sebelumnya, sistem tetap menutup alur dengan respons aman agar state aplikasi konsisten.

### SEQ_05_GANTI_PASSWORD

Interaksi dimulai ketika pengguna terautentikasi mengirim password lama dan password baru. Layanan keamanan memverifikasi password lama terhadap hash tersimpan, memeriksa kekuatan password baru, lalu memperbarui hash password di basis data jika valid. Sistem dapat mencatat log keamanan serta melakukan invalidasi sesi lain untuk mitigasi risiko. Respons akhir menyatakan perubahan berhasil atau menolak jika verifikasi gagal.

### SEQ_06_VERIFIKASI_EMAIL

Alur dimulai saat pengguna membuka tautan verifikasi email yang dikirim sistem. Server memvalidasi tanda tangan/link verifikasi, mengecek akun yang dituju, lalu menandai email sebagai terverifikasi pada basis data. Jika verifikasi sukses, sistem mengembalikan status terverifikasi dan mengarahkan pengguna ke halaman yang sesuai. Jika link tidak valid atau kedaluwarsa, sistem mengirim respons gagal dan opsi kirim ulang verifikasi.

### SEQ_07_KONFIRMASI_PASSWORD

Interaksi dimulai saat pengguna mengakses fitur sensitif yang memerlukan konfirmasi password ulang. Sistem meminta password saat ini, memverifikasi ke basis data, lalu memberi cap waktu konfirmasi agar pengguna dapat melanjutkan aksi penting untuk durasi tertentu. Jika verifikasi benar, request fitur sensitif diteruskan; jika salah, akses ditahan dan pengguna menerima notifikasi kegagalan konfirmasi.

---

## 2) Modul Inventaris

### SEQ_01_MENGELOLA_ASET

Alur dimulai saat petugas mengirim request tambah/ubah/hapus aset dari antarmuka inventaris. Controller memvalidasi payload, memanggil service untuk aturan bisnis (kode unik, kategori valid, status aset), lalu menyimpan perubahan ke basis data. Pada operasi hapus, service memeriksa keterkaitan transaksi agar integritas data tidak rusak. Respons akhir mengembalikan hasil operasi dan daftar aset terbaru ke antarmuka.

### SEQ_02_MELIHAT_DAFTAR_ASET

Interaksi dimulai ketika pengguna mengirim parameter filter/pencarian aset. Sistem membentuk query ke basis data berdasarkan kata kunci, kategori, lokasi, dan status, lalu mengirimkan hasil paginasi ke layer presentasi. Saat pengguna meminta detail, sistem mengambil data aset terpilih beserta relasi yang diizinkan. Respons akhir menampilkan daftar/detail secara read-only.

### SEQ_03_SCAN_QR_PUBLIK

Alur dimulai dari token QR yang dibaca klien publik lalu dikirim ke endpoint lookup aset. Service memvalidasi format token, mencari pasangan aset di basis data, dan memutuskan apakah informasi dapat dipublikasikan. Jika valid, server mengembalikan profil aset non-sensitif; jika tidak, server merespons not found/invalid token. Klien menampilkan halaman hasil scan sesuai status respons.

### SEQ_04_MENGELOLA_KONDISI_ASET

Interaksi dimulai saat petugas mengirim pembaruan kondisi aset. Controller memverifikasi hak akses, memvalidasi nilai kondisi/catatan/lampiran, lalu service menulis kondisi terbaru dan riwayat perubahan pada basis data. Jika ada dampak status (misalnya aset tidak layak pakai), service memperbarui flag ketersediaan aset. Respons akhir mengembalikan status kondisi terkini ke antarmuka.

### SEQ_05_MENGELOLA_PEMINJAMAN

Alur dimulai saat request peminjaman dikirim dengan data aset, peminjam, dan rentang waktu. Service memeriksa ketersediaan aset, konflik jadwal, serta syarat peminjam sebelum membuat transaksi pinjam. Pada tahap pengembalian, request return memicu pembaruan transaksi, pencatatan kondisi akhir, dan perubahan status aset menjadi tersedia. Server mengembalikan konfirmasi sukses/gagal pada tiap tahap.

### SEQ_06_MENGELOLA_PERMOHONAN

Interaksi dimulai dari pengelola saat membuka dan memproses antrean permohonan. Sistem mengambil daftar permohonan dari basis data, lalu ketika aksi keputusan dikirim, service memvalidasi status transisi (menunggu → disetujui/ditolak). Keputusan disimpan beserta catatan reviewer, dan bila disetujui dapat memicu proses lanjutan (peminjaman/pengadaan). Respons akhir memperbarui status permohonan di UI.

### SEQ_07_MENGAJUKAN_PERMOHONAN

Alur dimulai ketika pengusul mengirim formulir permohonan aset. Controller memvalidasi kelengkapan data kebutuhan, service membuat entri permohonan berstatus menunggu di basis data, lalu notifikasi dikirim ke pihak pemroses. Sistem mengembalikan nomor/identitas permohonan agar dapat dipantau. UI menampilkan status awal pengajuan.

### SEQ_08_APPROVAL_PERMOHONAN_KADEP

Interaksi dimulai saat Kepala Departemen membuka detail permohonan untuk approval. Sistem mengambil data permohonan dan konteks pendukung, lalu menerima keputusan approve/reject dari aktor. Service menyimpan keputusan final, mencatat metadata persetujuan, dan mengubah status proses. Respons akhir menampilkan hasil approval yang menjadi acuan tahap operasional berikutnya.

### SEQ_09_MENGELOLA_KATEGORI_ASET

Alur dimulai saat admin mengirim aksi CRUD kategori aset. Service memvalidasi keunikan nama kategori dan memeriksa relasi kategori terhadap aset sebelum operasi hapus. Basis data diperbarui sesuai aksi yang lolos validasi. Respons akhir mengembalikan daftar kategori mutakhir ke antarmuka.

### SEQ_10_MELIHAT_PERMOHONAN_PENGADAAN

Interaksi dimulai ketika pengguna berwenang meminta daftar permohonan pengadaan. Sistem mengeksekusi query berdasarkan filter status/periode, lalu mengembalikan ringkasan data. Pada pembukaan detail, service mengambil rincian item, estimasi biaya, dan jejak keputusan. UI menampilkan hasil sebagai informasi monitoring tanpa mutasi data.

---

## 3) Modul Keuangan

### SEQ_01_MENGELOLA_RIWAYAT_KEUANGAN

Alur dimulai ketika pengurus mengirim data transaksi pemasukan/pengeluaran. Controller memvalidasi nominal, tanggal, kategori, dan deskripsi; service kemudian menyimpan transaksi ke basis data serta menghitung dampaknya terhadap saldo berjalan. Jika diperlukan, log perubahan juga ditulis untuk audit. Respons akhir mengembalikan status transaksi dan nilai saldo terbaru.

### SEQ_02_MENGELOLA_NOMINAL_KAS

Interaksi dimulai saat admin keuangan mengirim perubahan nominal kas periodik. Service memvalidasi nilai dan rentang periode, memeriksa konflik dengan konfigurasi aktif, lalu menyimpan konfigurasi baru di basis data. Jika terjadi konflik, service mengembalikan error terstruktur untuk koreksi. UI menerima hasil simpan atau pesan gagal sesuai validasi.

### SEQ_03_MELIHAT_CATATAN_KAS

Alur dimulai saat pengguna meminta catatan kas dengan parameter pencarian tertentu. Query layer mengambil transaksi yang sesuai, mengurutkannya secara kronologis, lalu mengirimkan data paginasi ke UI. Bila pengguna membuka detail satu transaksi, sistem melakukan lookup berbasis ID. Respons menampilkan data observasi tanpa perubahan state.

### SEQ_04_MELIHAT_REKAP_KEUANGAN

Interaksi dimulai dari request rekap pada periode tertentu. Service agregasi menghitung total pemasukan, total pengeluaran, dan saldo akhir dari transaksi valid di basis data. Hasil ringkasan dikirim ke presenter/antarmuka dalam format laporan. Pengguna menerima gambaran kondisi keuangan periodik secara cepat.

### SEQ_05_MELIHAT_RIWAYAT_KEUANGAN

Alur dimulai ketika pengguna melakukan penelusuran historis transaksi lama. Sistem membentuk query arsip berdasar rentang tanggal/kata kunci, lalu mengembalikan hasil dan metadata transaksi untuk audit. Pada permintaan detail, service mengirimkan data sumber/tujuan dana dan catatan pendukung. UI menampilkan jejak riwayat sebagai bukti administratif.

---

## 4) Modul Praktikum

### SEQ_01_MENGELOLA_PRAKTIKUM

Interaksi dimulai saat koordinator/asisten mengirim request create/update/delete kelas praktikum. Service memvalidasi periode, mata kuliah, kapasitas, dan status kelas sebelum menyimpan perubahan ke basis data. Untuk update/hapus, sistem memeriksa dependensi aktif seperti pertemuan atau tugas agar tidak menimbulkan inkonsistensi. Respons akhir mengembalikan data kelas terbaru ke antarmuka.

### SEQ_02_MELIHAT_PRAKTIKUM

Alur dimulai ketika pengguna meminta daftar praktikum sesuai perannya. Sistem memfilter data berdasarkan hak akses, mengeksekusi query daftar kelas, lalu mengembalikan hasil ringkas ke UI. Saat detail dipilih, service mengambil data relasional seperti aslab, peserta, jadwal, dan progres. Respons ditampilkan sebagai tampilan monitoring/read-only.

### SEQ_03_MENGELOLA_PERTEMUAN

Interaksi dimulai saat pengelola kelas mengirim data pertemuan baru atau perubahan pertemuan lama. Service memvalidasi nomor pertemuan, jadwal, dan relasi ke kelas praktikum, lalu menulis perubahan ke basis data. Jika terdeteksi duplikasi/bentrok, service menolak dan mengembalikan pesan validasi. UI diperbarui dengan daftar pertemuan terkini.

### SEQ_04_MENGELOLA_MODUL

Alur dimulai saat pengajar mengirim metadata modul dan file materi. Sistem memvalidasi file (tipe/ukuran), memeriksa keterkaitan ke pertemuan, lalu menyimpan referensi modul ke basis data dan file ke storage. Pada update, versi/modifikasi modul diperbarui agar materi terbaru tersedia. Respons akhir mengonfirmasi status publikasi modul.

### SEQ_05_MENGAKSES_MODUL

Interaksi dimulai ketika praktikan meminta daftar modul kelasnya. Service memverifikasi keanggotaan pengguna dan status publikasi modul, lalu menarik data modul yang boleh diakses. Jika pengguna membuka/unduh modul, sistem menghasilkan respons file atau URL resource yang valid. UI menampilkan materi atau notifikasi jika akses ditolak.

### SEQ_06_MENGELOLA_PRAKTIKAN

Alur dimulai saat pengelola mengirim aksi tambah/hapus/ubah data peserta praktikum. Service memvalidasi identitas peserta, keanggotaan ganda, dan aturan kapasitas sebelum commit ke basis data. Setelah tersimpan, sistem memperbarui daftar anggota kelas serta metrik jumlah peserta. Respons akhir menampilkan komposisi peserta terbaru.

### SEQ_07_MENGELOLA_ASLAB

Interaksi dimulai saat koordinator menetapkan aslab pada kelas praktikum. Service memeriksa ketersediaan aslab pada periode/jadwal yang sama dan validitas relasi kelas. Jika valid, relasi penugasan disimpan; jika bentrok, sistem merespons error konflik. UI menerima status penugasan sebagai umpan balik keputusan.

### SEQ_08_MENGELOLA_TUGAS

Alur dimulai saat pengajar membuat atau memperbarui tugas praktikum. Controller memvalidasi data tenggat, ketentuan file, dan keterkaitan ke pertemuan/kelas, lalu service menyimpan status tugas (draft/aktif/ditutup). Saat dipublikasikan, sistem dapat mengirim notifikasi ke praktikan. Respons akhir mengembalikan daftar tugas beserta status terbarunya.

### SEQ_09_MENGELOLA_RUBRIK

Interaksi dimulai ketika pengajar mengirim komponen rubrik penilaian. Service memvalidasi struktur indikator dan total bobot, lalu menyimpan rubrik ke basis data sebagai template aktif. Jika bobot tidak valid, request ditolak dengan pesan koreksi. UI menampilkan rubrik yang berhasil disimpan untuk dipakai saat menilai.

### SEQ_10_MENGELOLA_PENILAIAN

Alur dimulai saat pengajar membuka submission lalu mengirim skor berdasarkan rubrik. Service memvalidasi rentang nilai dan kelengkapan komponen, menghitung nilai akhir jika diperlukan, lalu menyimpan hasil penilaian. Sistem juga menyimpan feedback tekstual untuk praktikan. Respons akhir mengubah status submission menjadi sudah dinilai.

### SEQ_11_MENGUMPULKAN_TUGAS

Interaksi dimulai ketika praktikan mengirim berkas submission. Sistem memvalidasi tenggat, ukuran, dan tipe file, kemudian menyimpan file ke storage serta metadata submission ke basis data. Jika melewati tenggat atau format salah, service merespons gagal/late policy sesuai aturan. UI menerima bukti submit beserta timestamp pengiriman.

### SEQ_12_MENGELOLA_ABSENSI

Alur dimulai saat asisten/pengajar mengirim data kehadiran per pertemuan. Service memvalidasi bahwa peserta terdaftar dalam kelas dan data absensi belum terkunci, lalu menyimpan status hadir/izin/sakit/alfa per peserta. Setelah commit, sistem menghitung ringkasan kehadiran untuk monitoring. Respons akhir mengembalikan rekap absensi per sesi.

### SEQ_13_MENGELOLA_SERTIFIKAT

Interaksi dimulai ketika pengelola menjalankan proses penerbitan sertifikat praktikum. Service memverifikasi kelayakan peserta dari nilai, kehadiran, dan syarat administratif, lalu membuat record sertifikat bagi yang lolos. Dokumen sertifikat disiapkan/ditautkan ke storage dan status peserta diperbarui. Respons akhir memberi informasi sertifikat berhasil diterbitkan atau alasan gagal.

### SEQ_14_MELIHAT_TUGAS

Alur dimulai saat praktikan meminta daftar tugas kelas. Sistem mengambil data tugas dan status per pengguna (belum dikerjakan/sudah dikumpulkan/sudah dinilai), lalu mengirimkannya ke antarmuka. Ketika detail tugas diminta, sistem mengembalikan instruksi lengkap dan aturan submit. UI menampilkan informasi untuk membantu prioritas pengerjaan.

### SEQ_15_RIWAYAT_PENGUMPULAN

Interaksi dimulai saat pengguna meminta histori pengumpulan tugas. Query layer mengambil daftar submission berdasarkan kelas/tugas/pengguna, lengkap dengan timestamp dan status validasi. Jika detail submission dibuka, sistem mengirim metadata file dan catatan pemeriksa. Respons akhir menyediakan jejak audit pengumpulan secara komprehensif.

### SEQ_16_MELIHAT_SERTIFIKAT

Alur dimulai ketika praktikan meminta daftar sertifikat miliknya. Service memverifikasi autentikasi dan hak akses, lalu mengambil sertifikat yang tersedia dari basis data. Jika dokumen dipilih, sistem mengembalikan resource untuk pratinjau/unduh. UI menampilkan status tersedia atau belum tersedia sesuai data.

### SEQ_17_MELIHAT_REKAP_PRAKTIKUM

Interaksi dimulai dari request rekap praktikum per kelas/periode. Service agregasi menggabungkan data absensi, nilai, dan submission untuk menghasilkan ringkasan performa. Hasil rekap dikirim ke antarmuka dalam format tabel/ringkasan analitik. Pengguna menerima output evaluasi untuk kebutuhan monitoring akademik.

---

## 5) Modul Kegiatan Proker & Kepengurusan

### SEQ_01_MENGELOLA_PROKER

Alur dimulai saat pengurus mengirim data pembuatan atau perubahan proker. Service memvalidasi atribut utama (nama, periode, deskripsi, penanggung jawab), lalu menyimpan ke basis data jika lolos aturan. Pada update/hapus, service memeriksa keterkaitan dengan kegiatan turunan agar konsisten. Respons akhir mengembalikan status operasi dan data proker terbaru.

### SEQ_02_PARAMETER_PENILAIAN_PROKER

Interaksi dimulai ketika pengurus/evaluator mengirim parameter penilaian. Sistem memvalidasi format parameter, rentang skor, dan bobot total sebelum menyimpan template penilaian. Jika bobot tidak konsisten, request ditolak dengan detail error. UI menerima parameter aktif yang siap dipakai pada evaluasi.

### SEQ_03_DOKUMENTASI_PROKER

Alur dimulai saat pelaksana mengunggah dokumentasi proker. Sistem menerima metadata + file, memvalidasi format/ukuran, lalu menyimpan file ke storage dan metadata ke basis data. Riwayat unggahan dicatat untuk audit. Respons akhir menampilkan dokumentasi yang berhasil tersimpan.

### SEQ_04_AJUKAN_EVALUASI_PROKER

Interaksi dimulai ketika pengurus mengirim pengajuan evaluasi proker. Service memvalidasi bahwa proker berada pada status yang dapat dievaluasi, lalu membuat entri evaluasi berstatus menunggu. Sistem meneruskan notifikasi ke evaluator terkait. UI menerima nomor pengajuan dan status awal proses.

### SEQ_05_MENYETUJUI_PROKER

Alur dimulai saat pejabat berwenang meminta detail usulan proker dan mengirim keputusan. Service memvalidasi otorisasi pengambil keputusan dan status usulan, lalu menyimpan keputusan approve/reject dengan catatan. Status proker diperbarui secara atomik agar tidak terjadi race condition. Respons akhir memperlihatkan hasil persetujuan di antarmuka.

### SEQ_06_MENGELOLA_KEGIATAN

Interaksi dimulai ketika pengurus mengirim data kegiatan turunan proker. Service memvalidasi relasi proker, jadwal, PIC, dan potensi bentrok agenda sebelum menyimpan. Setelah commit, data kegiatan tersedia untuk modul kalender, peserta, dan approval kegiatan. UI menerima daftar kegiatan yang sudah diperbarui.

### SEQ_07_LAPORAN_DOKUMENTASI_KEGIATAN

Alur dimulai dari request laporan dokumentasi kegiatan berdasarkan filter tertentu. Service mengekstrak data kegiatan + lampiran dari basis data, lalu membentuk kompilasi laporan untuk ditampilkan. Sistem mengirim ringkasan dan detail pendukung ke UI. Pengguna memperoleh output pelaporan tanpa mengubah data sumber.

### SEQ_08_PESERTA_KEGIATAN

Interaksi dimulai ketika panitia mengelola peserta kegiatan. Service memvalidasi identitas peserta, kuota, dan status partisipasi sebelum menyimpan perubahan daftar peserta. Jika kuota penuh atau peserta duplikat, sistem menolak operasi dengan pesan yang sesuai. Respons akhir menampilkan daftar peserta final per kegiatan.

### SEQ_09_SERTIFIKAT_KEGIATAN

Alur dimulai saat panitia memproses sertifikat peserta kegiatan. Service menilai kelayakan peserta berdasar aturan partisipasi, lalu membuat data sertifikat untuk peserta valid dan menyiapkan dokumen di storage. Status sertifikat peserta diperbarui agar dapat diakses. UI menerima daftar sertifikat yang berhasil diterbitkan.

### SEQ_10_MENYETUJUI_KEGIATAN

Interaksi dimulai ketika pihak berwenang meninjau usulan kegiatan dan mengirim keputusan. Service memvalidasi status usulan serta hak approval, kemudian menyimpan keputusan final. Jika disetujui, status kegiatan menjadi siap pelaksanaan; jika ditolak, status ditutup dengan catatan alasan. Respons akhir memperbarui tampilan status kegiatan.

### SEQ_11_KALENDER_KEGIATAN

Alur dimulai ketika pengguna meminta data kalender kegiatan pada periode tertentu. Sistem mengambil agenda kegiatan dari basis data, memetakan ke format kalender, lalu mengirimnya ke antarmuka. Saat event dipilih, sistem melakukan fetch detail kegiatan. UI menampilkan timeline kegiatan untuk koordinasi pelaksanaan.

### SEQ_12_MENGELOLA_KEPENGURUSAN

Interaksi dimulai ketika admin organisasi mengirim aksi kelola periode/struktur kepengurusan. Service memvalidasi periodisasi agar tidak ada dua periode aktif yang bertabrakan, lalu menyimpan perubahan ke basis data. Pembaruan struktur dapat memicu pembaruan hak akses organisasi. Respons akhir menampilkan struktur kepengurusan terkini.

### SEQ_13_MENGELOLA_ANGGOTA

Alur dimulai saat pengurus menambah/memperbarui data anggota. Service memvalidasi identitas, jabatan, unit, dan masa aktif sebelum commit. Jika terjadi konflik data anggota, sistem menolak dan mengembalikan detail perbaikan. UI menerima daftar anggota yang telah sinkron dengan struktur terbaru.

### SEQ_14_MELIHAT_DAFTAR_PROKER

Interaksi dimulai ketika pengguna meminta list proker untuk monitoring. Sistem mengeksekusi query berdasarkan status/periode, lalu mengembalikan daftar ringkasan ke antarmuka. Jika detail proker dibuka, service mengambil data progres, dokumentasi, dan evaluasi terkait. Respons akhir menampilkan informasi proker secara read-only.

### SEQ_15_MELIHAT_DAFTAR_KEGIATAN

Alur dimulai saat pengguna meminta daftar kegiatan turunan proker. Sistem memfilter kegiatan sesuai parameter, mengirim daftar ke UI, lalu melayani permintaan detail per kegiatan. Data yang dikirim mencakup jadwal, status, dan penanggung jawab. Pengguna memperoleh visibilitas penuh terhadap aktivitas organisasi.

### SEQ_16_MENGEVALUASI_PROKER

Interaksi dimulai ketika evaluator mengirim skor dan catatan evaluasi proker. Service memuat parameter aktif, memvalidasi input nilai, lalu menyimpan hasil evaluasi secara terstruktur di basis data. Jika seluruh komponen terpenuhi, sistem menandai evaluasi selesai dan memperbarui status proker terkait. Respons akhir mengonfirmasi hasil evaluasi tersimpan.

---

## 6) Modul Piket

### SEQ_01_MENGELOLA_PERIODE_PIKET

Alur dimulai saat pengelola mengirim data periode piket baru atau perubahan periode. Service memvalidasi rentang tanggal dan konflik dengan periode aktif lain, lalu menyimpan konfigurasi periode ke basis data. Jika konflik terdeteksi, sistem mengirim error validasi. UI menerima status periode yang berhasil diaktivasi.

### SEQ_02_MENGELOLA_JADWAL_PIKET

Interaksi dimulai ketika pengurus mengirim susunan jadwal piket. Service memeriksa bentrok jadwal dan ketersediaan anggota, lalu menyimpan assignment jadwal jika valid. Setelah commit, sistem menyiapkan data jadwal untuk ditampilkan ke anggota. Respons akhir mengembalikan jadwal piket terbaru.

### SEQ_03_MENGELOLA_ABSENSI_PIKET

Alur dimulai saat petugas mengirim catatan kehadiran berdasarkan jadwal aktif. Service memvalidasi bahwa jadwal dan anggota sesuai, lalu menulis data absensi ke basis data. Rekap kehadiran per anggota/periode diperbarui otomatis. UI menampilkan hasil pencatatan absensi yang baru disimpan.

### SEQ_04_MENGAJUKAN_GANTI_JADWAL

Interaksi dimulai ketika anggota mengirim permintaan pertukaran jadwal. Service memvalidasi jadwal asal, kandidat pengganti, dan kemungkinan bentrok sebelum membuat entri pengajuan berstatus menunggu. Notifikasi dikirim ke pengurus untuk proses approval. Respons akhir memberikan identitas pengajuan kepada anggota.

### SEQ_05_MENYETUJUI_GANTI_JADWAL

Alur dimulai saat pengurus meninjau pengajuan ganti jadwal dan mengirim keputusan. Service memvalidasi status pengajuan, lalu jika disetujui melakukan update assignment jadwal secara konsisten; jika ditolak, status ditutup dengan alasan. Basis data menyimpan jejak keputusan untuk audit. UI memperlihatkan hasil keputusan kepada pihak terkait.

### SEQ_06_MELIHAT_REKAP_ABSENSI

Interaksi dimulai ketika pengguna berwenang meminta rekap absensi piket. Service melakukan agregasi kehadiran berdasarkan periode dan anggota, lalu mengirim ringkasan statistik ke antarmuka. Pengguna dapat meminta detail per anggota jika diperlukan. Respons akhir membantu evaluasi disiplin piket.

### SEQ_07_MELIHAT_JADWAL_PIKET

Alur dimulai saat anggota meminta jadwal piket pribadinya. Sistem memfilter jadwal berdasarkan user dan periode aktif, lalu mengembalikan daftar tugas yang harus dijalankan. Jika ada perubahan dari approval ganti jadwal, data terbaru langsung diprioritaskan. UI menampilkan jadwal final sebagai panduan operasional.

---

## 7) Modul Kuesioner

### SEQ_01_MENGELOLA_KUESIONER

Interaksi dimulai ketika admin mengirim data pembuatan/perubahan kuesioner. Service memvalidasi struktur pertanyaan, tipe jawaban, opsi, target, dan periode publikasi sebelum menyimpan. Jika valid, kuesioner disimpan dengan status draft/aktif sesuai aksi. UI menerima hasil simpan dan daftar kuesioner terkini.

### SEQ_02_MENGISI_KUESIONER

Alur dimulai saat responden mengirim jawaban kuesioner. Service memverifikasi hak akses responden, memvalidasi kelengkapan jawaban wajib, lalu menyimpan respons ke basis data. Jika kebijakan satu kali isi aktif, sistem mencegah submit ulang untuk responden yang sama. Respons akhir mengonfirmasi bahwa jawaban berhasil direkam.

### SEQ_03_MELIHAT_HASIL_KUESIONER

Interaksi dimulai ketika pihak berwenang meminta hasil kuesioner. Service melakukan agregasi respons untuk membentuk statistik dan ringkasan analitik, lalu mengirimkan data hasil ke antarmuka. Pada permintaan pendalaman, sistem mengirim detail jawaban sesuai otorisasi. UI menampilkan hasil evaluasi sebagai dasar rekomendasi keputusan.

---

## 8) Lampiran Rincian Teknis Per Sequence Diagram

Bagian ini menambahkan detail teknis ringkas per diagram dengan format: **Trigger → Validasi/Proses inti → Output sukses → Alur alternatif (gagal/ditolak)**.

### A. Auth

- **SEQ_01_LOGIN**: pengguna kirim email+password → cek format, akun aktif, hash password, rate limit → sesi/token dibuat dan redirect dashboard → login ditolak jika kredensial salah/akun nonaktif.
- **SEQ_02_REGISTER**: pengguna submit data registrasi → cek field wajib, keunikan email, policy password → akun baru + role default + (opsional) email verifikasi → registrasi ditolak jika email sudah dipakai/format tidak valid.
- **SEQ_03_LUPA_RESET_PASSWORD**: pengguna minta reset via email → cek akun ada, buat token reset ber-expiry, kirim link → password baru tersimpan dan token invalidated → gagal jika token kedaluwarsa/tidak cocok.
- **SEQ_04_LOGOUT**: pengguna klik logout → cek sesi aktif, revoke token/invalidate session → user kembali ke halaman login/public → jika sesi tidak ada, sistem tetap mengakhiri alur secara aman.
- **SEQ_05_GANTI_PASSWORD**: pengguna kirim password lama+baru → verifikasi password lama, cek policy password baru → hash password diperbarui + log keamanan → ditolak jika password lama salah/policy gagal.
- **SEQ_06_VERIFIKASI_EMAIL**: pengguna buka link verifikasi → validasi signature dan masa berlaku link → status email_terverifikasi disimpan → gagal jika link rusak/kedaluwarsa.
- **SEQ_07_KONFIRMASI_PASSWORD**: pengguna akses fitur sensitif → minta re-entry password dan verifikasi hash → cap waktu konfirmasi dibuat, fitur sensitif dibuka → akses ditolak jika password tidak cocok.

### B. Inventaris

- **SEQ_01_MENGELOLA_ASET**: petugas kirim CRUD aset → validasi kode unik, kategori, field wajib, relasi → data aset tersimpan/terbarui/terhapus → hapus ditolak jika aset terikat transaksi aktif.
- **SEQ_02_MELIHAT_DAFTAR_ASET**: pengguna kirim filter pencarian → query paginasi + sorting + eager-load relasi aman → daftar/detail aset tampil → hasil kosong jika filter tidak menemukan data.
- **SEQ_03_SCAN_QR_PUBLIK**: klien kirim token QR → validasi token dan lookup aset → profil aset publik ditampilkan → invalid/not-found jika token tidak sah.
- **SEQ_04_MENGELOLA_KONDISI_ASET**: petugas kirim update kondisi → cek hak akses, enum kondisi, lampiran/catatan → kondisi terbaru + riwayat kondisi tersimpan → ditolak jika payload tidak valid.
- **SEQ_05_MENGELOLA_PEMINJAMAN**: pengguna kirim request pinjam/kembali → cek ketersediaan aset, konflik jadwal, syarat peminjam → transaksi pinjam-return tercatat + status aset berubah → ditolak jika aset tidak tersedia/konflik waktu.
- **SEQ_06_MENGELOLA_PERMOHONAN**: pengelola proses antrean permohonan → cek transisi status (pending→approved/rejected) → keputusan tersimpan + notifikasi pengusul → gagal jika status sebelumnya tidak kompatibel.
- **SEQ_07_MENGAJUKAN_PERMOHONAN**: pengusul submit form kebutuhan aset → validasi kelengkapan dan periode → permohonan status pending dibuat → ditolak jika data kebutuhan tidak lengkap.
- **SEQ_08_APPROVAL_PERMOHONAN_KADEP**: kadep kirim keputusan → validasi kewenangan dan status dokumen → approval/reject final tercatat → gagal jika user tidak berwenang.
- **SEQ_09_MENGELOLA_KATEGORI_ASET**: admin kelola kategori → cek keunikan nama dan dependensi aset → master kategori mutakhir → hapus ditolak jika kategori masih dipakai.
- **SEQ_10_MELIHAT_PERMOHONAN_PENGADAAN**: user berwenang buka monitoring → filter status/periode + load estimasi biaya/riwayat → ringkasan dan detail tampil → data tidak tampil jika scope otorisasi tidak memenuhi.

### C. Keuangan

- **SEQ_01_MENGELOLA_RIWAYAT_KEUANGAN**: pengurus submit transaksi → validasi nominal, kategori, tanggal, bukti → transaksi tersimpan + saldo diperbarui → gagal jika nominal/akun tidak valid.
- **SEQ_02_MENGELOLA_NOMINAL_KAS**: admin ubah nominal periodik → cek periode overlap dan nilai minimum → konfigurasi nominal kas baru aktif → ditolak jika periode bentrok.
- **SEQ_03_MELIHAT_CATATAN_KAS**: pengguna kirim filter catatan → query kronologis + paginasi → catatan kas tampil → empty state jika tidak ada catatan.
- **SEQ_04_MELIHAT_REKAP_KEUANGAN**: pengguna minta rekap periode → agregasi pemasukan-pengeluaran-saldo → dashboard rekap tampil → nilai nol jika periode tanpa transaksi.
- **SEQ_05_MELIHAT_RIWAYAT_KEUANGAN**: pengguna telusuri histori lama → query arsip + metadata audit → jejak transaksi tampil → akses ditolak jika user bukan role berwenang.

### D. Praktikum

- **SEQ_01_MENGELOLA_PRAKTIKUM**: koordinator kirim CRUD kelas → cek periode, kapasitas, relasi mata kuliah → data kelas tersimpan → hapus ditolak jika ada dependensi aktif.
- **SEQ_02_MELIHAT_PRAKTIKUM**: user minta daftar kelas → filter berdasarkan role/kelas akses → daftar + detail praktikum tampil → data dibatasi sesuai scope role.
- **SEQ_03_MENGELOLA_PERTEMUAN**: pengelola submit sesi pertemuan → cek nomor sesi unik dan konflik jadwal → pertemuan tersimpan → ditolak jika duplikat nomor/bentrok.
- **SEQ_04_MENGELOLA_MODUL**: pengajar upload/update modul → validasi tipe file, ukuran, relasi sesi → metadata+file modul tersimpan → gagal jika file tidak memenuhi aturan.
- **SEQ_05_MENGAKSES_MODUL**: praktikan request modul → cek keanggotaan kelas dan publikasi modul → file/preview diberikan → ditolak jika belum dipublikasikan.
- **SEQ_06_MENGELOLA_PRAKTIKAN**: pengelola kelola anggota kelas → validasi NIM/identitas, duplikasi, kapasitas → daftar praktikan diperbarui → tambah ditolak jika kuota penuh.
- **SEQ_07_MENGELOLA_ASLAB**: koordinator assign aslab → cek bentrok jadwal aslab dan periode aktif → penugasan aslab tersimpan → gagal jika aslab sudah terikat kelas lain di waktu sama.
- **SEQ_08_MENGELOLA_TUGAS**: pengajar buat/ubah tugas → validasi tenggat, aturan file, status publish → tugas aktif/draft tersimpan → ditolak jika tenggat tidak logis.
- **SEQ_09_MENGELOLA_RUBRIK**: pengajar submit rubrik → cek bobot total dan indikator wajib → rubrik versi aktif tersimpan → gagal jika bobot tidak konsisten.
- **SEQ_10_MENGELOLA_PENILAIAN**: pengajar input nilai → validasi rentang skor dan komponen rubrik → nilai akhir + feedback tersimpan → ditolak jika skor di luar rentang.
- **SEQ_11_MENGUMPULKAN_TUGAS**: praktikan upload submission → cek tenggat, ukuran, ekstensi → submission + timestamp tersimpan → ditolak/late jika melewati aturan.
- **SEQ_12_MENGELOLA_ABSENSI**: asisten input hadir/izin/sakit/alfa → cek peserta terdaftar dan lock status absensi → absensi sesi tersimpan → gagal jika sesi sudah dikunci.
- **SEQ_13_MENGELOLA_SERTIFIKAT**: pengelola generate sertifikat → cek syarat nilai+kehadiran+administrasi → record sertifikat dibuat + dokumen siap unduh → gagal jika syarat belum terpenuhi.
- **SEQ_14_MELIHAT_TUGAS**: praktikan request daftar tugas → sistem kirim status personal per tugas → daftar/detail tugas tampil → data kosong jika kelas belum punya tugas.
- **SEQ_15_RIWAYAT_PENGUMPULAN**: user minta histori submission → query per kelas/tugas/user + metadata → riwayat lengkap tampil → akses dibatasi untuk data milik sendiri/kelasnya.
- **SEQ_16_MELIHAT_SERTIFIKAT**: praktikan request sertifikat → cek autentikasi dan kepemilikan sertifikat → daftar+file sertifikat tampil → tidak tersedia jika belum terbit.
- **SEQ_17_MELIHAT_REKAP_PRAKTIKUM**: user minta rekap kelas → agregasi absensi, nilai, submission → ringkasan performa tampil → dibatasi hanya untuk role yang berwenang.

### E. Kegiatan Proker & Kepengurusan

- **SEQ_01_MENGELOLA_PROKER**: pengurus kirim CRUD proker → cek atribut inti + periode + PIC → data proker tersimpan → hapus ditolak jika proker punya kegiatan berjalan.
- **SEQ_02_PARAMETER_PENILAIAN_PROKER**: evaluator set parameter → validasi indikator dan bobot → template evaluasi aktif tersimpan → gagal jika bobot total tidak valid.
- **SEQ_03_DOKUMENTASI_PROKER**: pelaksana upload bukti kegiatan → cek format file dan relasi proker → dokumentasi tersimpan + log upload → ditolak jika file/bukti tidak valid.
- **SEQ_04_AJUKAN_EVALUASI_PROKER**: pengurus ajukan evaluasi → cek status proker layak evaluasi → tiket evaluasi pending dibuat → gagal jika proker belum memenuhi prasyarat.
- **SEQ_05_MENYETUJUI_PROKER**: pejabat kirim keputusan usulan → verifikasi otorisasi dan status usulan → status proker approved/rejected tercatat → gagal jika keputusan di tahap yang salah.
- **SEQ_06_MENGELOLA_KEGIATAN**: pengurus kelola kegiatan turunan → cek relasi proker, jadwal, PIC → kegiatan tersimpan → ditolak jika bentrok agenda.
- **SEQ_07_LAPORAN_DOKUMENTASI_KEGIATAN**: pengguna minta laporan → agregasi data kegiatan+lampiran → laporan ringkas-detail tampil → data dibatasi sesuai periode/scope akses.
- **SEQ_08_PESERTA_KEGIATAN**: panitia kelola peserta → cek kuota, duplikasi, status peserta → daftar peserta final tersimpan → tambah ditolak jika kuota penuh.
- **SEQ_09_SERTIFIKAT_KEGIATAN**: panitia generate sertifikat → cek kelayakan partisipasi → sertifikat peserta dibuat → gagal jika peserta belum memenuhi syarat.
- **SEQ_10_MENYETUJUI_KEGIATAN**: approver putuskan usulan kegiatan → validasi role approval + status usulan → kegiatan approved/rejected → gagal jika user tidak berhak.
- **SEQ_11_KALENDER_KEGIATAN**: user request kalender → query agenda per periode + mapping event → timeline kegiatan tampil → kosong jika belum ada agenda.
- **SEQ_12_MENGELOLA_KEPENGURUSAN**: admin kelola periode/struktur → cek overlap periode aktif → data kepengurusan tersimpan → ditolak jika konflik periodisasi.
- **SEQ_13_MENGELOLA_ANGGOTA**: pengurus update anggota → validasi identitas, jabatan, masa aktif → daftar anggota tersinkron → gagal jika data anggota duplikat/invalid.
- **SEQ_14_MELIHAT_DAFTAR_PROKER**: user minta list proker → filter status/periode + query ringkasan → daftar proker tampil → detail dibatasi oleh hak akses.
- **SEQ_15_MELIHAT_DAFTAR_KEGIATAN**: user minta list kegiatan → filter proker/periode/status → daftar kegiatan tampil → data terbatas sesuai otorisasi.
- **SEQ_16_MENGEVALUASI_PROKER**: evaluator submit skor akhir → cek kelengkapan komponen evaluasi → hasil evaluasi tersimpan + status diperbarui → gagal jika komponen belum lengkap.

### F. Piket

- **SEQ_01_MENGELOLA_PERIODE_PIKET**: pengelola buat/ubah periode → cek rentang tanggal dan overlap → periode aktif tersimpan → gagal jika bentrok periode.
- **SEQ_02_MENGELOLA_JADWAL_PIKET**: pengurus susun jadwal → validasi konflik hari/jam + ketersediaan anggota → assignment jadwal tersimpan → ditolak jika bentrok jadwal.
- **SEQ_03_MENGELOLA_ABSENSI_PIKET**: petugas input absensi → cek jadwal aktif dan anggota terjadwal → absensi tersimpan + rekap diperbarui → gagal jika jadwal tidak valid.
- **SEQ_04_MENGAJUKAN_GANTI_JADWAL**: anggota ajukan swap jadwal → cek kandidat pengganti dan konflik → pengajuan pending tercatat + notifikasi dikirim → gagal jika kandidat tidak memenuhi syarat.
- **SEQ_05_MENYETUJUI_GANTI_JADWAL**: pengurus approve/reject swap → validasi status pengajuan → jadwal diperbarui atau pengajuan ditutup → gagal jika pengajuan sudah diproses sebelumnya.
- **SEQ_06_MELIHAT_REKAP_ABSENSI**: user berwenang minta rekap → agregasi hadir/alfa per anggota → statistik kedisiplinan tampil → detail tampil sesuai filter periode.
- **SEQ_07_MELIHAT_JADWAL_PIKET**: anggota minta jadwal pribadi → filter by user + periode aktif → jadwal final ditampilkan → jika ada swap disetujui, jadwal otomatis mengikuti data terbaru.

### G. Kuesioner

- **SEQ_01_MENGELOLA_KUESIONER**: admin buat/ubah kuesioner → cek struktur pertanyaan, opsi, periode publish → kuesioner draft/aktif tersimpan → gagal jika struktur pertanyaan tidak valid.
- **SEQ_02_MENGISI_KUESIONER**: responden submit jawaban → verifikasi akses dan jawaban wajib → respons tersimpan final → submit ulang ditolak jika kebijakan one-response aktif.
- **SEQ_03_MELIHAT_HASIL_KUESIONER**: evaluator request hasil → agregasi statistik + detail sesuai otorisasi → dashboard hasil tampil → detail sensitif disembunyikan jika role tidak memenuhi.

---

## Catatan Validasi Cakupan

Dokumen ini mencakup seluruh sequence diagram berikut, **kecuali folder surat/sequence**:

- auth/sequence (7)
- inventaris/sequence (10)
- keuangan/sequence (5)
- praktikum/sequence (17)
- kegiatan_proker/sequence (16)
- piket/sequence (7)
- kuesioner/sequence (3)

Total: **65 sequence diagram**.
