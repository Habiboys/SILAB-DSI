# Dokumentasi 26 Diagram (Activity & Sequence)

Dokumen ini disusun untuk membantu pembaca memahami alur proses pada sistem SILAB secara utuh, dari awal sampai akhir. Penjelasan dibuat dengan bahasa yang lebih naratif agar tidak terasa seperti daftar langkah yang kaku. Jadi, setiap diagram tidak hanya menyebutkan urutan proses, tetapi juga menjelaskan konteks: siapa yang memulai proses, kenapa langkah itu dilakukan, bagaimana sistem merespons, dan kapan proses dinyatakan selesai.

Secara umum, ada dua sudut pandang yang dipakai:
- **Activity Diagram** untuk melihat alur kerja pengguna dan sistem secara proses bisnis.
- **Sequence Diagram** untuk melihat urutan interaksi antar komponen sistem (halaman, controller, model, dan pengguna).

Dengan cara ini, pembaca bisa memahami “alur besar” sekaligus “alur komunikasi teknis” tanpa harus membaca kode program terlebih dahulu.

---

## A. Penjelasan 14 Activity Diagram

### 1) Activity Diagram Login
Pada diagram ini, proses dimulai ketika pengguna membuka halaman login karena ingin masuk ke sistem. Pengguna kemudian mengisi email dan password, lalu menekan tombol login. Di titik ini, sistem tidak langsung mengizinkan masuk, tetapi terlebih dahulu memeriksa apakah kombinasi email dan password tersebut benar. Jika data tidak sesuai, sistem mengembalikan pengguna ke form login disertai informasi bahwa kredensial tidak valid, sehingga pengguna perlu memperbaiki inputnya.

Jika data valid, sistem membuat sesi login sebagai tanda bahwa pengguna sudah terautentikasi. Setelah sesi terbentuk, sistem menentukan halaman tujuan berdasarkan peran pengguna. Praktikan diarahkan ke halaman yang relevan dengan aktivitas praktikum (misalnya daftar tugas), sedangkan peran lain diarahkan ke dashboard utama. Proses berakhir ketika pengguna berhasil masuk ke halaman tujuan.

### 2) Activity Diagram Ubah Password
Pada diagram ini, alur dimulai ketika pengguna yang sudah login masuk ke menu pengaturan akun lalu memilih fitur ubah password. Tujuan proses ini adalah menjaga keamanan akun, terutama ketika pengguna ingin mengganti kata sandi lama dengan yang baru. Sistem menampilkan form yang biasanya berisi password lama, password baru, dan konfirmasi password baru.

Setelah pengguna mengisi form dan mengirimkannya, sistem melakukan beberapa pemeriksaan penting. Pertama, sistem memastikan password lama benar agar perubahan tidak dilakukan oleh pihak yang tidak berhak. Kedua, sistem memeriksa apakah password baru memenuhi aturan keamanan (misalnya panjang minimum atau kombinasi karakter tertentu). Ketiga, sistem mencocokkan password baru dengan konfirmasinya.

Jika ada pemeriksaan yang gagal, sistem menampilkan pesan kesalahan yang jelas supaya pengguna tahu bagian mana yang perlu diperbaiki. Jika semua valid, sistem memperbarui password akun, menyimpan perubahan secara aman, lalu menampilkan notifikasi bahwa password berhasil diubah. Proses berakhir ketika pengguna menerima konfirmasi keberhasilan.

### 3) Activity Diagram Mengelola Aset
Diagram ini menggambarkan pekerjaan admin saat mengelola data aset laboratorium. Proses biasanya dimulai ketika admin membuka menu inventaris untuk melihat kondisi data aset saat ini. Sistem menampilkan daftar aset sebagai titik awal, lalu admin memilih tindakan yang ingin dilakukan, misalnya menambah aset baru, mengubah data aset lama, menghapus aset, atau menyiapkan label QR.

Saat admin memilih salah satu tindakan, sistem menampilkan form atau konfirmasi yang sesuai. Admin kemudian mengisi data yang dibutuhkan, misalnya nama aset, kategori, lokasi, atau informasi pendukung lain. Setelah data dikirim, sistem melakukan validasi agar data yang masuk tetap rapi dan sesuai aturan. Jika ada kesalahan, admin diminta memperbaiki data. Jika data benar, sistem menyimpan perubahan dan menampilkan notifikasi bahwa proses pengelolaan aset berhasil dilakukan.

### 4) Activity Diagram Mengajukan Permohonan Pengadaan
Diagram ini berfokus pada proses ketika asisten mengajukan kebutuhan pengadaan barang. Alur dimulai saat asisten membuka menu permohonan pengadaan dan memilih opsi untuk membuat pengajuan baru. Pada tahap ini, asisten mengisi informasi inti pengajuan, seperti judul, kebutuhan, dan alasan pengadaan, lalu menambahkan daftar item yang ingin diajukan.

Setelah data diisi, asisten mengirim permohonan. Sistem kemudian memeriksa kelengkapan data, karena pengajuan yang tidak lengkap akan menyulitkan proses review berikutnya. Jika masih ada data kurang, sistem meminta perbaikan. Jika semua lengkap, sistem menyimpan pengajuan beserta detail item-itemnya dan memberi status awal bahwa pengajuan sedang menunggu proses lanjutan. Dari sini, pengaju bisa memantau perkembangan status permohonannya.

### 5) Activity Diagram Mengelola Riwayat Keuangan
Diagram ini menjelaskan bagaimana admin mengelola transaksi keuangan yang sudah tercatat. Alur dimulai saat admin masuk ke menu riwayat keuangan, lalu sistem menampilkan daftar transaksi yang sudah ada. Dari daftar tersebut, admin bisa menambah transaksi baru, mengubah transaksi lama, menghapus transaksi yang tidak relevan, atau mengekspor data untuk kebutuhan pelaporan.

Untuk aksi tambah dan edit, sistem menampilkan form transaksi agar admin bisa mengisi data seperti nominal, jenis transaksi, tanggal, dan keterangan. Untuk aksi hapus, biasanya sistem meminta konfirmasi agar tidak terjadi penghapusan tidak sengaja. Setelah aksi dipilih, sistem memvalidasi data. Jika valid, perubahan disimpan dan sistem menampilkan notifikasi sukses. Jika tidak valid, sistem memberi informasi bagian mana yang perlu diperbaiki.

### 6) Activity Diagram Melihat Catatan Kas
Diagram ini menjelaskan proses melihat catatan kas dari sudut pandang pengguna yang berhak (misalnya admin, asisten, dosen, atau kadep). Proses dimulai ketika pengguna membuka menu catatan kas. Sistem memeriksa hak akses pengguna, lalu mengambil data yang diperlukan, seperti data kepengurusan aktif, data pembayaran kas, dan status pembayaran setiap anggota.

Setelah data dihitung dan dirangkum, sistem menampilkan catatan kas dalam bentuk yang mudah dibaca, biasanya berupa matriks atau rekap per periode. Pengguna bisa menyaring data berdasarkan bulan atau anggota tertentu agar pembacaan lebih fokus. Jadi, walaupun alurnya terlihat sederhana, nilai utamanya ada pada bagaimana sistem merangkum data besar menjadi informasi yang langsung bisa dipakai untuk evaluasi.

### 7) Activity Diagram Mengelola Praktikum
Diagram ini menggambarkan alur dasar pengelolaan data praktikum oleh admin. Ketika admin membuka menu praktikum, sistem menampilkan daftar praktikum yang tersedia sebagai bahan kelola. Dari sana admin bisa melakukan tindakan utama: menambah data praktikum, memperbarui data, atau menghapus data yang sudah tidak dipakai.

Setiap tindakan membawa admin ke form atau konfirmasi sesuai kebutuhan. Admin mengisi data, lalu sistem memvalidasi agar data tetap konsisten. Jika ada bagian yang tidak sesuai, sistem mengembalikan pesan kesalahan supaya bisa diperbaiki. Jika data sudah benar, sistem menyimpan perubahan dan menampilkan notifikasi bahwa pengelolaan praktikum berhasil.

### 8) Activity Diagram Mengelola Praktikan
Pada diagram ini, fokusnya adalah pengelolaan peserta praktikum (praktikan) di dalam satu kelas atau praktikum tertentu. Proses dimulai saat admin/asisten membuka detail praktikum pada bagian praktikan. Sistem menampilkan daftar praktikan yang sudah terdaftar, lalu pengguna memilih aksi: menambah praktikan manual, impor dari file, atau menghapus data dari daftar.

Untuk tambah manual, pengguna memilih atau mengisi data praktikan satu per satu. Untuk impor, pengguna mengunggah file sesuai format yang ditentukan. Setelah data dikirim, sistem melakukan pemeriksaan validitas data. Jika format atau isi tidak sesuai, sistem meminta perbaikan. Jika valid, sistem menyimpan data praktikan dan mengaitkannya ke praktikum yang dipilih. Proses ditutup dengan notifikasi hasil agar pengguna tahu apakah tindakan berhasil.

### 9) Activity Diagram Mengelola Anggota
Diagram ini menjelaskan pengelolaan anggota dalam konteks kepengurusan. Alurnya dimulai ketika admin membuka menu anggota, lalu sistem menampilkan daftar anggota aktif. Dari halaman ini, admin bisa menambahkan anggota baru, mengubah data anggota yang sudah ada, atau menghapus anggota dari kepengurusan tertentu.

Ketika admin memilih aksi, sistem menampilkan form yang relevan. Admin mengisi data yang dibutuhkan, seperti jabatan, divisi, atau data personal yang berkaitan. Sistem kemudian memvalidasi data sebelum menyimpan perubahan. Jika ada ketidaksesuaian, admin diminta revisi. Jika data valid, sistem menyimpan dan menampilkan informasi bahwa pengelolaan anggota telah berhasil dijalankan.

### 10) Activity Diagram Mengelola Kepengurusan / Periode Kepengurusan
Diagram ini berfokus pada pengaturan periode kepengurusan agar struktur organisasi tetap rapi per tahun atau periode. Proses dimulai dari admin membuka menu kepengurusan, kemudian sistem menampilkan daftar periode yang sudah ada. Admin dapat menambah periode baru, mengubah periode lama, menghapus data tertentu, atau menetapkan salah satu periode sebagai periode aktif.

Pada tiap aksi, sistem menyesuaikan tampilan form/konfirmasi. Setelah admin mengirim perubahan, sistem memvalidasi data dan memastikan tidak ada konflik utama (misalnya data ganda atau status aktif yang tidak sesuai aturan). Jika semua valid, perubahan disimpan. Hasil akhirnya adalah data periode kepengurusan yang terkelola dengan jelas dan siap dipakai modul lain.

### 11) Activity Diagram Mengambil Absensi Piket
Diagram ini menggambarkan absensi piket yang dilakukan asisten. Alur dimulai saat asisten membuka menu absensi piket. Sistem menampilkan kondisi absensi saat ini, lalu asisten memilih tindakan yang sesuai kondisi lapangan: check-in, check-out, atau menandai tidak hadir/izin.

Setiap tindakan membutuhkan bukti atau keterangan, misalnya foto dan catatan kegiatan. Setelah dikirim, sistem memvalidasi data tersebut berdasarkan aturan absensi. Jika ada data yang belum lengkap atau tidak sesuai, asisten diminta memperbaiki. Jika valid, sistem menyimpan absensi dan menampilkan notifikasi berhasil. Dengan alur ini, pencatatan piket menjadi lebih akurat dan terdokumentasi.

### 12) Activity Diagram Mengajukan Ganti Jadwal
Diagram ini menjelaskan proses pengajuan ganti jadwal oleh asisten saat ada benturan jadwal piket. Proses dimulai saat asisten membuka menu ganti jadwal dan memilih opsi ajukan penggantian. Asisten kemudian mengisi form pengajuan, biasanya berisi jadwal asal, jadwal pengganti, dan alasan pengajuan.

Setelah form dikirim, sistem memeriksa kelengkapan dan kesesuaian data. Jika data belum valid, pengajuan belum bisa dikirim dan asisten perlu memperbaiki input. Jika valid, sistem menyimpan pengajuan, mengirim notifikasi ke pihak admin, dan menandai status bahwa pengajuan sedang menunggu persetujuan. Proses berakhir saat pengajuan tercatat dengan baik di sistem.

### 13) Activity Diagram Mengisi Kuesioner
Diagram ini menunjukkan alur pengisian kuesioner oleh asisten atau praktikan. Pengguna memulai dari menu kuesioner, memilih kuesioner aktif, lalu sistem menampilkan daftar pertanyaan. Pengguna mengisi jawaban sesuai pengalaman atau penilaian yang diminta, kemudian mengirim jawaban melalui tombol submit.

Setelah submit, sistem memvalidasi apakah semua bagian wajib sudah terisi. Jika ada yang kosong, pengguna diminta melengkapi terlebih dahulu. Jika lengkap, sistem menyimpan jawaban sebagai data respon resmi dan menampilkan konfirmasi bahwa pengisian berhasil. Alur ini penting agar data evaluasi yang masuk tetap utuh dan bisa diolah lebih lanjut.

### 14) Activity Diagram Melihat Hasil Kuesioner
Diagram ini berfokus pada proses melihat hasil kuesioner oleh admin atau kadep. Alur dimulai ketika pengguna membuka menu hasil kuesioner. Sistem menampilkan daftar kuesioner yang tersedia, lalu pengguna memilih salah satu untuk ditinjau.

Setelah pilihan dilakukan, sistem mengambil data rekap jawaban dan menampilkannya dalam bentuk ringkasan yang mudah dibaca. Karena tujuan utamanya adalah membaca hasil, alur pada diagram ini cenderung lurus tanpa banyak percabangan. Proses dianggap selesai ketika pengguna berhasil melihat rekap hasil sebagai bahan evaluasi.

---

## B. Penjelasan 14 Sequence Diagram

### 1) Sequence Diagram Login
Sequence ini memperlihatkan komunikasi antar komponen saat proses login berlangsung. Pengguna memulai dari browser dengan membuka halaman login. Browser meminta halaman ke `AuthenticatedSessionController`, lalu controller mengirim form login.

Setelah pengguna mengirim email dan password, browser meneruskan data ke controller. Controller kemudian meminta `User Model` melakukan autentikasi. Jika hasil autentikasi gagal, controller mengirim respons gagal dan pengguna tetap di halaman login. Jika berhasil, controller membuat sesi pengguna dan mengirim perintah redirect ke halaman yang sesuai peran pengguna. Intinya, sequence ini menegaskan bahwa keputusan sukses/gagal login terjadi di lapisan controller dengan bantuan model.

### 2) Sequence Diagram Ubah Password
Sequence ini memperlihatkan alur komunikasi saat pengguna mengganti password akun. Proses dimulai ketika pengguna membuka halaman pengaturan akun melalui browser, lalu browser meminta tampilan form ubah password ke controller yang menangani profil atau keamanan akun.

Setelah form ditampilkan, pengguna mengirim data password lama, password baru, dan konfirmasi password baru. Browser meneruskan data tersebut ke controller. Controller kemudian memeriksa kecocokan password lama lewat model user, sekaligus memvalidasi format password baru dan kecocokan dengan kolom konfirmasi.

Jika salah satu validasi gagal, controller mengirim respons gagal ke browser beserta pesan yang sesuai, lalu pengguna tetap di halaman yang sama untuk memperbaiki input. Jika semua validasi berhasil, controller meminta model untuk memperbarui password pengguna (dengan penyimpanan yang aman), lalu mengirim respons sukses ke browser. Browser menampilkan notifikasi bahwa password berhasil diubah.

### 3) Sequence Diagram Mengelola Aset
Pada sequence ini, interaksi dimulai saat admin membuka halaman inventaris. Browser meminta data ke `InventarisController`, lalu controller mengambil data dari model aset dan kategori sebelum mengirimkan kembali ke halaman.

Ketika admin melakukan aksi (tambah/edit/hapus), browser mengirim request lanjutan sesuai aksi tersebut. Controller memproses permintaan itu ke model terkait, termasuk pencatatan kondisi awal aset jika dibutuhkan. Setelah model mengembalikan hasil, controller mengirim respons ke browser berupa notifikasi sukses atau status hasil proses. Jadi, sequence ini menekankan perpindahan data dari antarmuka ke controller, lalu ke model, dan kembali lagi ke antarmuka.

### 4) Sequence Diagram Mengajukan Permohonan Pengadaan
Sequence ini menjelaskan bagaimana data pengajuan diproses dari form sampai tersimpan. Asisten mengisi form di browser, lalu browser mengirim request ke `InventarisController`. Controller terlebih dahulu menyimpan data header permohonan pada `PermohonanAset Model`.

Setelah data utama tersimpan, controller melanjutkan penyimpanan setiap item ke `PermohonanItem Model`. Jika semua item berhasil diproses, controller mengirim respons sukses ke browser dan status awal pengajuan ditetapkan sebagai menunggu proses. Alur ini menunjukkan bahwa satu pengajuan biasanya diproses dalam dua lapis data: data utama dan data item detail.

### 5) Sequence Diagram Mengelola Riwayat Keuangan
Di sequence ini, admin berinteraksi dengan browser untuk membuka dan mengelola transaksi keuangan. Browser meminta data ke `RiwayatKeuanganController`, kemudian controller mengambil data transaksi dari `RiwayatKeuangan Model` dan data nominal kas dari `NominalKas Model`.

Untuk aksi tambah atau edit, browser mengirim data transaksi ke controller, lalu controller meneruskan perubahan ke model. Untuk aksi hapus, browser mengirim ID transaksi yang dipilih. Setelah model menyelesaikan proses, controller mengirim respons ke browser agar tampilan diperbarui dan pengguna mendapat notifikasi hasil.

### 6) Sequence Diagram Melihat Catatan Kas
Sequence ini memperlihatkan alur saat pengguna hanya ingin melihat rekap catatan kas. Browser mengirim permintaan ke `RiwayatKeuanganController`, lalu controller mengumpulkan data dari beberapa sumber: transaksi keuangan, nominal kas, dan data pengguna/anggota.

Setelah semua data terkumpul, controller menyusunnya menjadi rekap yang siap tampil, lalu mengirimkan ke browser. Browser menampilkan hasil dalam bentuk catatan kas yang mudah dibaca. Karena tidak ada proses ubah data utama, sequence ini lebih banyak berisi alur baca dan penyusunan data.

### 7) Sequence Diagram Mengelola Praktikum
Pada sequence ini, admin membuka halaman praktikum dan browser meminta data ke `PraktikumController`. Controller mengambil data konteks kepengurusan/lab, lalu mengambil daftar praktikum yang sesuai. Data kemudian dikirim ke browser untuk ditampilkan.

Ketika admin menambah, mengubah, atau menghapus praktikum, browser mengirim request lanjutan ke controller. Controller memproses request tersebut melalui `Praktikum Model`, lalu mengembalikan hasil ke browser. Pola interaksi ini menunjukkan alur CRUD standar: request dari halaman, proses di controller-model, lalu respons balik ke halaman.

### 8) Sequence Diagram Mengelola Praktikan
Sequence ini menggambarkan interaksi yang sedikit lebih kaya karena ada beberapa cara input data praktikan. Pengguna membuka tab praktikan, browser meminta daftar ke `PraktikanController`, dan controller menyiapkan data dari model praktikan serta relasi ke praktikum.

Untuk penambahan manual, browser mengirim data user terpilih; controller mengecek keberadaan data user/praktikan, lalu membuat relasi ke kelas/praktikum. Untuk impor file, browser mengirim berkas dan controller memproses isinya sebelum menyimpan ke model terkait. Setelah proses selesai, controller mengirimkan status hasil ke browser. Alur ini memperlihatkan bahwa satu fitur bisa punya lebih dari satu jalur input, tetapi tetap berakhir pada respons terpusat dari controller.

### 9) Sequence Diagram Mengelola Anggota
Sequence ini memperlihatkan pengelolaan anggota yang melibatkan beberapa entitas: data akun, profil, dan relasi kepengurusan. Admin berinteraksi dari `AnggotaPage`, lalu halaman meminta data ke `AnggotaController`. Controller mengambil data yang dibutuhkan dan mengirimnya kembali untuk ditampilkan.

Saat admin menambah anggota, controller tidak hanya membuat satu data, tetapi juga menyiapkan profil dan relasi ke kepengurusan. Saat edit, beberapa entitas bisa ikut diperbarui agar data tetap konsisten. Saat hapus, yang dihapus umumnya relasi ke kepengurusan sesuai konteks modul. Dengan demikian, sequence ini menegaskan bahwa pengelolaan anggota adalah proses multi-objek, bukan satu tabel saja.

### 10) Sequence Diagram Mengelola Periode Kepengurusan
Pada sequence ini, admin mengelola data periode melalui halaman kepengurusan. Halaman mengirim request ke controller periode/tahun, lalu controller mengambil data periode dari model dan menampilkannya ke halaman.

Ketika admin menambah atau mengubah periode, browser mengirim data ke controller untuk diproses. Untuk pembuatan periode lab, controller biasanya melakukan pengecekan dulu agar tidak terjadi duplikasi. Jika lolos, data disimpan dan hasil dikirim kembali ke halaman. Sequence ini menonjolkan pentingnya validasi sebelum simpan pada data periode yang sifatnya struktural.

### 11) Sequence Diagram Mengambil Absensi Piket
Sequence ini menunjukkan alur absensi dari cek jadwal hingga simpan bukti absen. Asisten membuka halaman absensi, browser meminta status ke `AbsensiController`, lalu controller memeriksa jadwal pada `JadwalPiket Model` dan data absensi sebelumnya pada `Absensi Model`.

Setelah status ditampilkan, asisten melakukan check-in atau check-out dan browser mengirim data bukti ke controller. Controller memvalidasi aturan yang berlaku (misalnya duplikasi check-in atau syarat check-out), lalu menyimpan data jika valid. Terakhir, controller mengirim hasil ke browser agar pengguna tahu absensinya berhasil atau perlu perbaikan.

### 12) Sequence Diagram Mengajukan Ganti Jadwal
Pada sequence ini, asisten membuka fitur ganti jadwal dan browser meminta data awal ke `GantiJadwalPiketController`. Controller menyiapkan informasi periode aktif, jadwal pribadi asisten, serta riwayat pengajuan yang pernah dibuat.

Saat asisten mengirim pengajuan baru, browser mengirim request ke controller. Controller memvalidasi apakah periode masih aktif, jadwalnya sesuai, dan tidak bentrok dengan pengajuan pending sebelumnya. Jika lolos, data disimpan di `GantiJadwalPiket Model` dan browser menerima respons berhasil. Jika tidak lolos, browser menerima pesan penolakan beserta alasannya.

### 13) Sequence Diagram Mengisi Kuesioner
Sequence ini dimulai ketika pengguna membuka halaman isi kuesioner. `KuesionerPage` meminta data ke controller, lalu controller mengambil detail kuesioner dari model. Sebelum form ditampilkan, sistem juga mengecek apakah pengguna sudah pernah mengirim respon.

Jika belum pernah, pengguna bisa mengisi lalu submit. Request submit diproses oleh `ResponKuesionerController`, yang menyimpan data respon utama dan rincian jawaban per pertanyaan. Setelah selesai, controller mengirim notifikasi berhasil ke halaman. Jika pengguna sudah pernah mengisi, halaman biasanya menampilkan informasi bahwa pengisian ulang tidak dilakukan.

### 14) Sequence Diagram Melihat Hasil Kuesioner
Sequence ini menjelaskan bagaimana hasil kuesioner ditampilkan ke admin/kadep. Pengguna membuka menu hasil, lalu halaman meminta daftar kuesioner ke `KuesionerController`. Setelah pengguna memilih satu kuesioner, halaman mengirim request rekap hasil.

Controller mengambil data respon dari model, menyusunnya menjadi bentuk ringkas, lalu mengirimnya kembali ke halaman. Halaman menampilkan hasil tersebut sebagai bahan evaluasi. Karena tujuan fitur ini adalah membaca hasil, alurnya relatif lurus: pilih data, ambil rekap, tampilkan.

---

## Penutup
Dari 26 diagram yang dijelaskan, pola besar sistem SILAB sebenarnya konsisten: pengguna memulai aksi dari halaman, sistem memeriksa aturan, data diproses melalui controller dan model, lalu hasil dikembalikan sebagai informasi atau notifikasi. Bedanya, **activity diagram** lebih menonjolkan cerita proses bisnis, sedangkan **sequence diagram** lebih menonjolkan urutan komunikasi antar komponen. Saat keduanya dibaca bersama, gambaran sistem menjadi lebih lengkap dan lebih mudah dipahami.