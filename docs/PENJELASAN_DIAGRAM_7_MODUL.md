# PENJELASAN DIAGRAM 7 MODUL SILAB

## A. Tujuan Dokumen

Dokumen ini disusun sebagai narasi resmi untuk laporan pengembangan sistem SILAB. Fokusnya adalah menjelaskan bagaimana diagram **Use Case, Activity, Sequence, dan BPMN** digunakan untuk memodelkan proses bisnis dan proses teknis pada 7 modul utama: **kepengurusan, praktikum, piket, keuangan, inventaris, kuesioner, dan auth**.

Dokumen ini tidak hanya menyebutkan keberadaan diagram, tetapi juga menjelaskan makna, peran, dan kontribusi masing-masing jenis diagram terhadap implementasi sistem. Dengan demikian, pembaca laporan dapat memahami hubungan antara kebutuhan bisnis, rancangan proses, dan alur implementasi aplikasi.

---

## B. Metode Pemeriksaan Ulang Diagram

Pemeriksaan ulang dilakukan dengan meninjau kembali struktur folder dokumentasi diagram per modul, lalu memetakan keterkaitan antar jenis diagram. Hasil pemeriksaan menunjukkan bahwa untuk 7 modul tersebut, seluruh modul sudah memiliki **Use Case**, mayoritas memiliki **Activity** dan **Sequence**, sedangkan **BPMN laporan** difokuskan pada 4 modul operasional utama.

Catatan verifikasi: pada repositori terdapat berkas BPMN tambahan seperti [docs/bpmn/BPMN_07_KEPENGURUSAN.puml](docs/bpmn/BPMN_07_KEPENGURUSAN.puml) dan [docs/bpmn/BPMN_09_KUESIONER.puml](docs/bpmn/BPMN_09_KUESIONER.puml). Namun, sesuai arahan penyusunan laporan saat ini, pembahasan BPMN diformalisasi pada 4 modul: **inventaris, keuangan, praktikum, dan piket**.

---

## C. Penjelasan Per Modul

## 1. Modul Kepengurusan

### 1.1 Ruang Lingkup dan Peran Modul

Modul kepengurusan berperan sebagai fondasi tata kelola organisasi laboratorium, mencakup pengelolaan struktur, anggota, peran, dan konteks kepengurusan aktif. Modul ini sangat strategis karena menjadi acuan hak akses lintas modul lain (misal proker, praktikum, dan keuangan), sehingga kesalahan pada modul ini berpotensi berdampak sistemik.

Dalam konteks arsitektur, modul kepengurusan berfungsi sebagai “control context”: siapa user aktif, berada di periode kepengurusan mana, dan memiliki hak tindakan apa. Karena itu, diagram pada modul ini menekankan governance dan otorisasi, bukan semata operasi CRUD.

### 1.2 Use Case Diagram

Referensi: [docs/usecase/UC_07_KEPENGURUSAN.puml](docs/usecase/UC_07_KEPENGURUSAN.puml), [docs/kegiatan_proker/usecase/UC_KEGIATAN_PROKER.puml](docs/kegiatan_proker/usecase/UC_KEGIATAN_PROKER.puml).

Use case menggambarkan aktor utama (superadmin/admin/kadep/pengurus) dan batas tanggung jawab masing-masing ketika mengelola struktur serta anggota. Diagram ini penting untuk menegaskan batas hak akses agar perubahan data organisasi tidak bisa dilakukan oleh aktor yang tidak berwenang.

### 1.3 Activity Diagram

Referensi: [docs/kegiatan_proker/activity/ACT_12_MENGELOLA_KEPENGURUSAN.puml](docs/kegiatan_proker/activity/ACT_12_MENGELOLA_KEPENGURUSAN.puml), [docs/kegiatan_proker/activity/ACT_13_MENGELOLA_ANGGOTA.puml](docs/kegiatan_proker/activity/ACT_13_MENGELOLA_ANGGOTA.puml).

Activity diagram menunjukkan urutan langkah proses administrasi: memilih konteks kepengurusan, memvalidasi role, memproses data anggota/struktur, hingga penyimpanan. Titik keputusan (decision node) berfungsi untuk memfilter proses berdasarkan status data dan otorisasi.

### 1.4 Sequence Diagram

Referensi: [docs/kegiatan_proker/sequence/SEQ_12_MENGELOLA_KEPENGURUSAN.puml](docs/kegiatan_proker/sequence/SEQ_12_MENGELOLA_KEPENGURUSAN.puml), [docs/kegiatan_proker/sequence/SEQ_13_MENGELOLA_ANGGOTA.puml](docs/kegiatan_proker/sequence/SEQ_13_MENGELOLA_ANGGOTA.puml).

Sequence diagram memetakan aliran pesan dari antarmuka ke lapisan backend saat data kepengurusan dikelola. Diagram ini memperjelas urutan validasi otorisasi, akses data, dan respons sistem sehingga sangat berguna saat audit keamanan maupun troubleshooting akses.

### 1.5 BPMN

Untuk laporan ini, BPMN kepengurusan belum dijadikan bagian BPMN utama (meskipun berkas tersedia di repositori).

---

## 2. Modul Praktikum

### 2.1 Ruang Lingkup dan Peran Modul

Modul praktikum mencakup proses akademik operasional paling luas: pengelolaan praktikum, kelas/subkelas, pertemuan, modul materi, tugas, absensi, penilaian, hingga sertifikat. Modul ini menjadi tulang punggung aktivitas harian aslab dan praktikan.

Karena cakupan fiturnya besar, konsistensi antar proses menjadi krusial. Diagram pada modul praktikum digunakan untuk memastikan setiap fitur tetap berada dalam alur proses terpadu dan tidak saling bertabrakan pada level data maupun otorisasi.

### 2.2 BPMN Diagram

Referensi: [docs/bpmn/BPMN_03_PRAKTIKUM.puml](docs/bpmn/BPMN_03_PRAKTIKUM.puml).

BPMN praktikum memodelkan aliran bisnis dari tahap perencanaan sampai evaluasi. Swimlane antarpelaku membantu memperjelas kapan tindakan dilakukan oleh pengelola, aslab, atau praktikan.

### 2.3 Use Case Diagram

Referensi: [docs/praktikum/usecase/UC_PRAKTIKUM.puml](docs/praktikum/usecase/UC_PRAKTIKUM.puml), [docs/usecase/UC_03_PRAKTIKUM.puml](docs/usecase/UC_03_PRAKTIKUM.puml).

Use case merinci kapabilitas fungsi sesuai aktor: kelola data inti praktikum, kelola sesi pertemuan, distribusi materi/tugas, pengelolaan nilai dan absensi, serta output sertifikat. Diagram ini menjadi dasar definisi hak akses dan prioritas pengembangan fitur.

### 2.4 Activity Diagram

Referensi representatif: [docs/praktikum/activity/ACT_01_MENGELOLA_PRAKTIKUM.puml](docs/praktikum/activity/ACT_01_MENGELOLA_PRAKTIKUM.puml), [docs/praktikum/activity/ACT_03_MENGELOLA_PERTEMUAN.puml](docs/praktikum/activity/ACT_03_MENGELOLA_PERTEMUAN.puml), [docs/praktikum/activity/ACT_08_MENGELOLA_TUGAS.puml](docs/praktikum/activity/ACT_08_MENGELOLA_TUGAS.puml), [docs/praktikum/activity/ACT_12_MENGELOLA_ABSENSI.puml](docs/praktikum/activity/ACT_12_MENGELOLA_ABSENSI.puml).

Activity diagram praktikum menekankan alur operasional detail dengan percabangan validasi (deadline, konteks kelas, kelengkapan data, status aktivitas). Diagram ini membantu melihat titik-titik kritis proses yang berpengaruh langsung terhadap pengalaman pengguna.

### 2.5 Sequence Diagram

Referensi representatif: [docs/praktikum/sequence/SEQ_01_MENGELOLA_PRAKTIKUM.puml](docs/praktikum/sequence/SEQ_01_MENGELOLA_PRAKTIKUM.puml), [docs/praktikum/sequence/SEQ_03_MENGELOLA_PERTEMUAN.puml](docs/praktikum/sequence/SEQ_03_MENGELOLA_PERTEMUAN.puml), [docs/praktikum/sequence/SEQ_08_MENGELOLA_TUGAS.puml](docs/praktikum/sequence/SEQ_08_MENGELOLA_TUGAS.puml), [docs/praktikum/sequence/SEQ_12_MENGELOLA_ABSENSI.puml](docs/praktikum/sequence/SEQ_12_MENGELOLA_ABSENSI.puml).

Sequence diagram memotret interaksi teknis antarkomponen saat proses berjalan, termasuk validasi akses, pemrosesan relasi kelas/subkelas, dan penyimpanan hasil. Dokumen ini sangat penting saat refactor karena menjaga urutan perilaku sistem tetap konsisten.

---

## 3. Modul Piket

### 3.1 Ruang Lingkup dan Peran Modul

Modul piket mengelola rotasi tugas operasional laboratorium: periode piket, penjadwalan personel, absensi pelaksanaan, serta mekanisme ganti jadwal. Modul ini berfokus pada disiplin eksekusi dan kepatuhan jadwal.

Secara bisnis, modul piket menuntut kontrol proses yang jelas agar tidak terjadi konflik jadwal atau kekosongan petugas. Diagram yang tersedia menegaskan alur pengajuan dan approval sebagai titik kendali utama.

### 3.2 BPMN Diagram

Referensi: [docs/bpmn/BPMN_05_PIKET.puml](docs/bpmn/BPMN_05_PIKET.puml).

BPMN piket memperlihatkan siklus lengkap dari setup periode sampai monitoring absensi. Alur approval ganti jadwal menjadi bagian inti untuk menjamin perubahan tidak dilakukan sepihak.

### 3.3 Use Case Diagram

Referensi: [docs/piket/usecase/UC_PIKET.puml](docs/piket/usecase/UC_PIKET.puml), [docs/usecase/UC_05_PIKET.puml](docs/usecase/UC_05_PIKET.puml).

Use case memetakan fitur-fitur pengelolaan jadwal dan absensi berdasarkan peran pengguna. Diagram ini menjadi acuan kebijakan role-based access pada proses yang sifatnya operasional harian.

### 3.4 Activity Diagram

Referensi representatif: [docs/piket/activity/ACT_01_MENGELOLA_PERIODE_PIKET.puml](docs/piket/activity/ACT_01_MENGELOLA_PERIODE_PIKET.puml), [docs/piket/activity/ACT_04_MENGAJUKAN_GANTI_JADWAL.puml](docs/piket/activity/ACT_04_MENGAJUKAN_GANTI_JADWAL.puml), [docs/piket/activity/ACT_05_MENYETUJUI_GANTI_JADWAL.puml](docs/piket/activity/ACT_05_MENYETUJUI_GANTI_JADWAL.puml).

Activity diagram menegaskan urutan kerja prosedural, terutama pada skenario perubahan jadwal. Diagram ini efektif untuk menilai apakah SOP operasional sudah tercermin pada sistem.

### 3.5 Sequence Diagram

Referensi representatif: [docs/piket/sequence/SEQ_01_MENGELOLA_PERIODE_PIKET.puml](docs/piket/sequence/SEQ_01_MENGELOLA_PERIODE_PIKET.puml), [docs/piket/sequence/SEQ_04_MENGAJUKAN_GANTI_JADWAL.puml](docs/piket/sequence/SEQ_04_MENGAJUKAN_GANTI_JADWAL.puml), [docs/piket/sequence/SEQ_05_MENYETUJUI_GANTI_JADWAL.puml](docs/piket/sequence/SEQ_05_MENYETUJUI_GANTI_JADWAL.puml).

Sequence diagram memperjelas urutan pesan sistem ketika validasi bentrok jadwal, pengajuan, dan persetujuan diproses. Ini memudahkan analisis bug pada status pengajuan atau perubahan data jadwal.

---

## 4. Modul Keuangan

### 4.1 Ruang Lingkup dan Peran Modul

Modul keuangan bertugas menjaga pencatatan transaksi, pengelolaan kas, penyajian rekap, dan histori keuangan secara akuntabel. Modul ini menjadi fondasi transparansi pengelolaan dana kepengurusan.

Sifat data finansial yang sensitif menuntut validasi berlapis dan jejak perubahan yang jelas. Oleh karena itu, pemodelan proses di modul ini sangat menekankan keterlacakan.

### 4.2 BPMN Diagram

Referensi: [docs/bpmn/BPMN_02_KEUANGAN.puml](docs/bpmn/BPMN_02_KEUANGAN.puml).

BPMN keuangan menggambarkan alur bisnis dari pencatatan hingga pelaporan. Diagram ini membantu menyamakan pemahaman antara tim teknis dan pengurus terhadap proses keuangan yang benar.

### 4.3 Use Case Diagram

Referensi: [docs/keuangan/usecase/UC_KEUANGAN.puml](docs/keuangan/usecase/UC_KEUANGAN.puml), [docs/usecase/UC_02_KEUANGAN.puml](docs/usecase/UC_02_KEUANGAN.puml).

Use case merinci fungsi utama seperti input riwayat, update kas, lihat catatan, dan lihat rekap. Diagram ini menjadi basis kontrol akses dan pembatasan aksi terhadap data finansial.

### 4.4 Activity Diagram

Referensi representatif: [docs/keuangan/activity/ACT_01_MENGELOLA_RIWAYAT_KEUANGAN.puml](docs/keuangan/activity/ACT_01_MENGELOLA_RIWAYAT_KEUANGAN.puml), [docs/keuangan/activity/ACT_04_MELIHAT_REKAP_KEUANGAN.puml](docs/keuangan/activity/ACT_04_MELIHAT_REKAP_KEUANGAN.puml).

Activity diagram memvisualkan langkah validasi data transaksi hingga menjadi laporan. Percabangan logika pada diagram memperkuat konsistensi data dan mengurangi risiko input yang tidak valid.

### 4.5 Sequence Diagram

Referensi representatif: [docs/keuangan/sequence/SEQ_01_MENGELOLA_RIWAYAT_KEUANGAN.puml](docs/keuangan/sequence/SEQ_01_MENGELOLA_RIWAYAT_KEUANGAN.puml), [docs/keuangan/sequence/SEQ_04_MELIHAT_REKAP_KEUANGAN.puml](docs/keuangan/sequence/SEQ_04_MELIHAT_REKAP_KEUANGAN.puml).

Sequence diagram menunjukkan urutan interaksi teknis saat data finansial dibuat, diolah, dan ditampilkan. Diagram ini penting untuk memastikan proses agregasi dan validasi berjalan pada urutan yang benar.

---

## 5. Modul Inventaris

### 5.1 Ruang Lingkup dan Peran Modul

Modul inventaris mencakup lifecycle aset: pencatatan aset, pemantauan kondisi, peminjaman, permohonan pengadaan, hingga approval. Modul ini berhubungan langsung dengan aset fisik sehingga sinkronisasi status sistem dan kondisi lapangan menjadi prioritas.

Pemodelan diagram pada modul inventaris menekankan status transisi dan kontrol keputusan. Hal ini penting untuk mencegah kesalahan seperti aset dipinjam saat status tidak tersedia atau approval pengadaan yang tidak sah.

### 5.2 BPMN Diagram

Referensi: [docs/bpmn/BPMN_01_INVENTARIS.puml](docs/bpmn/BPMN_01_INVENTARIS.puml).

BPMN inventaris menyajikan proses end-to-end yang lintas aktor, terutama pada alur permohonan dan persetujuan. Diagram ini memudahkan evaluasi kepatuhan proses terhadap aturan operasional aset.

### 5.3 Use Case Diagram

Referensi: [docs/inventaris/usecase/UC_INVENTARIS.puml](docs/inventaris/usecase/UC_INVENTARIS.puml), [docs/usecase/UC_01_INVENTARIS.puml](docs/usecase/UC_01_INVENTARIS.puml).

Use case memetakan fitur inti inventaris seperti kelola aset, kategori, peminjaman, permohonan, serta akses publik berbasis QR. Diagram ini menetapkan batas tindakan aktor agar kontrol aset tetap terjaga.

### 5.4 Activity Diagram

Referensi representatif: [docs/inventaris/activity/ACT_01_MENGELOLA_ASET.puml](docs/inventaris/activity/ACT_01_MENGELOLA_ASET.puml), [docs/inventaris/activity/ACT_05_MENGELOLA_PEMINJAMAN.puml](docs/inventaris/activity/ACT_05_MENGELOLA_PEMINJAMAN.puml), [docs/inventaris/activity/ACT_08_APPROVAL_PERMOHONAN_KADEP.puml](docs/inventaris/activity/ACT_08_APPROVAL_PERMOHONAN_KADEP.puml).

Activity diagram menunjukkan alur operasional terperinci termasuk validasi ketersediaan, perubahan kondisi, dan approval. Diagram ini membantu menilai ketahanan proses terhadap kasus riil di lapangan.

### 5.5 Sequence Diagram

Referensi representatif: [docs/inventaris/sequence/SEQ_01_MENGELOLA_ASET.puml](docs/inventaris/sequence/SEQ_01_MENGELOLA_ASET.puml), [docs/inventaris/sequence/SEQ_05_MENGELOLA_PEMINJAMAN.puml](docs/inventaris/sequence/SEQ_05_MENGELOLA_PEMINJAMAN.puml), [docs/inventaris/sequence/SEQ_08_APPROVAL_PERMOHONAN_KADEP.puml](docs/inventaris/sequence/SEQ_08_APPROVAL_PERMOHONAN_KADEP.puml).

Sequence diagram menjelaskan urutan teknis update status aset dari request hingga commit data. Dengan urutan ini, risiko inkonsistensi status antar transaksi dapat diminimalkan.

---

## 6. Modul Kuesioner

### 6.1 Ruang Lingkup dan Peran Modul

Modul kuesioner berfungsi untuk pengelolaan instrumen evaluasi, pengisian respon, dan penyajian hasil. Modul ini mendukung pengambilan keputusan berbasis umpan balik terstruktur.

Karakter utamanya adalah menjaga integritas data jawaban dan pemisahan peran antara pembuat instrumen dan responden. Diagram yang tersedia telah mendukung kebutuhan tersebut pada level fungsional dan teknis.

### 6.2 BPMN

Dalam laporan ini, BPMN kuesioner belum dimasukkan sebagai BPMN utama meskipun berkas tersedia pada repositori.

### 6.3 Use Case Diagram

Referensi: [docs/kuesioner/usecase/UC_KUESIONER.puml](docs/kuesioner/usecase/UC_KUESIONER.puml), [docs/usecase/UC_09_KUESIONER.puml](docs/usecase/UC_09_KUESIONER.puml).

Use case menegaskan fungsi kunci: kelola kuesioner, isi kuesioner, dan lihat hasil. Diagram ini memperjelas batas tindakan aktor untuk menjaga objektivitas hasil evaluasi.

### 6.4 Activity Diagram

Referensi: [docs/kuesioner/activity/ACT_01_MENGELOLA_KUESIONER.puml](docs/kuesioner/activity/ACT_01_MENGELOLA_KUESIONER.puml), [docs/kuesioner/activity/ACT_02_MENGISI_KUESIONER.puml](docs/kuesioner/activity/ACT_02_MENGISI_KUESIONER.puml), [docs/kuesioner/activity/ACT_03_MELIHAT_HASIL_KUESIONER.puml](docs/kuesioner/activity/ACT_03_MELIHAT_HASIL_KUESIONER.puml).

Activity diagram memodelkan alur proses dari penyusunan instrumen sampai visualisasi hasil. Percabangan validasi pada aktivitas membantu mencegah respon parsial dan menjaga kualitas data evaluasi.

### 6.5 Sequence Diagram

Referensi: [docs/kuesioner/sequence/SEQ_01_MENGELOLA_KUESIONER.puml](docs/kuesioner/sequence/SEQ_01_MENGELOLA_KUESIONER.puml), [docs/kuesioner/sequence/SEQ_02_MENGISI_KUESIONER.puml](docs/kuesioner/sequence/SEQ_02_MENGISI_KUESIONER.puml), [docs/kuesioner/sequence/SEQ_03_MELIHAT_HASIL_KUESIONER.puml](docs/kuesioner/sequence/SEQ_03_MELIHAT_HASIL_KUESIONER.puml).

Sequence diagram menunjukkan alur teknis pemuatan pertanyaan, penyimpanan jawaban, dan pembentukan ringkasan hasil. Diagram ini penting untuk menjamin konsistensi relasi data kuesioner.

---

## 7. Modul Auth

### 7.1 Ruang Lingkup dan Peran Modul

Modul auth menangani siklus identitas pengguna: autentikasi, registrasi, pemulihan akses, verifikasi, dan terminasi sesi. Modul ini adalah gerbang keamanan utama sebelum user dapat mengakses seluruh fitur SILAB.

Fokus perancangannya adalah memastikan setiap transisi akun aman, terdokumentasi, dan memenuhi praktik keamanan aplikasi web.

### 7.2 BPMN

Belum digunakan sebagai BPMN utama pada laporan ini.

### 7.3 Use Case Diagram

Referensi: [docs/auth/usecase/UC_AUTH.puml](docs/auth/usecase/UC_AUTH.puml).

Use case auth merinci fungsi login, register, lupa/reset password, verifikasi email, logout, dan konfirmasi password. Diagram ini menjadi dasar formal untuk kebijakan kontrol akses aplikasi.

### 7.4 Activity Diagram

Belum tersedia khusus modul auth pada paket dokumentasi modul ini.

### 7.5 Sequence Diagram

Referensi representatif: [docs/auth/sequence/SEQ_01_LOGIN.puml](docs/auth/sequence/SEQ_01_LOGIN.puml), [docs/auth/sequence/SEQ_02_REGISTER.puml](docs/auth/sequence/SEQ_02_REGISTER.puml), [docs/auth/sequence/SEQ_03_LUPA_RESET_PASSWORD.puml](docs/auth/sequence/SEQ_03_LUPA_RESET_PASSWORD.puml), [docs/auth/sequence/SEQ_06_VERIFIKASI_EMAIL.puml](docs/auth/sequence/SEQ_06_VERIFIKASI_EMAIL.puml).

Sequence diagram auth menjelaskan alur teknis keamanan secara rinci: verifikasi kredensial/token, pembentukan sesi, dan pengelolaan state autentikasi. Dokumen ini penting untuk audit keamanan dan validasi implementasi kontrol akses.

---

## D. Tabel Rekap Ketersediaan Diagram (Hasil Periksa Ulang)

| Modul        | BPMN (untuk laporan)    | Use Case | Activity  | Sequence |
| ------------ | ----------------------- | -------- | --------- | -------- |
| Kepengurusan | Tidak dibahas (laporan) | Ada      | Ada       | Ada      |
| Praktikum    | Ada                     | Ada      | Ada       | Ada      |
| Piket        | Ada                     | Ada      | Ada       | Ada      |
| Keuangan     | Ada                     | Ada      | Ada       | Ada      |
| Inventaris   | Ada                     | Ada      | Ada       | Ada      |
| Kuesioner    | Tidak dibahas (laporan) | Ada      | Ada       | Ada      |
| Auth         | Tidak dibahas (laporan) | Ada      | Belum ada | Ada      |

---

## E. Kesimpulan

Secara keseluruhan, dokumentasi diagram SILAB sudah kuat untuk dijadikan landasan laporan karena mencakup pemodelan fungsional (Use Case), pemodelan alur proses (Activity/BPMN), dan pemodelan interaksi teknis (Sequence). Kombinasi ini membuat jejak dari kebutuhan bisnis ke implementasi sistem dapat ditelusuri secara jelas.

Rekomendasi lanjutan untuk peningkatan kualitas laporan adalah menambahkan lampiran “penjelasan per file diagram” (satu paragraf per `ACT_xx` dan `SEQ_xx`) serta menyelaraskan status BPMN agar definisi “tersedia di repositori” dan “dipakai pada laporan” tetap konsisten.

---

## F. Lampiran Detail Per File Diagram

Bagian ini berisi uraian lebih rinci per file diagram agar dapat langsung digunakan sebagai lampiran laporan analisis dan desain sistem.

## F.1 Modul Kepengurusan

### Use Case

| File Diagram                                                                                                 | Fokus Penjelasan                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| [docs/usecase/UC_07_KEPENGURUSAN.puml](docs/usecase/UC_07_KEPENGURUSAN.puml)                                 | Memetakan aktor dan kapabilitas inti pengelolaan kepengurusan, termasuk pembatasan akses berdasarkan peran.                 |
| [docs/kegiatan_proker/usecase/UC_KEGIATAN_PROKER.puml](docs/kegiatan_proker/usecase/UC_KEGIATAN_PROKER.puml) | Menunjukkan kaitan antara kepengurusan dengan proker/kegiatan sebagai domain yang bergantung pada konteks organisasi aktif. |

### Activity

| File Diagram                                                                                                                         | Fokus Penjelasan                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [docs/kegiatan_proker/activity/ACT_12_MENGELOLA_KEPENGURUSAN.puml](docs/kegiatan_proker/activity/ACT_12_MENGELOLA_KEPENGURUSAN.puml) | Alur perubahan data kepengurusan dari validasi hak akses hingga penyimpanan final.           |
| [docs/kegiatan_proker/activity/ACT_13_MENGELOLA_ANGGOTA.puml](docs/kegiatan_proker/activity/ACT_13_MENGELOLA_ANGGOTA.puml)           | Proses pengelolaan anggota, termasuk seleksi anggota aktif dan perubahan status keanggotaan. |

### Sequence

| File Diagram                                                                                                                         | Fokus Penjelasan                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [docs/kegiatan_proker/sequence/SEQ_12_MENGELOLA_KEPENGURUSAN.puml](docs/kegiatan_proker/sequence/SEQ_12_MENGELOLA_KEPENGURUSAN.puml) | Interaksi frontend-backend saat data kepengurusan diambil dan diperbarui.      |
| [docs/kegiatan_proker/sequence/SEQ_13_MENGELOLA_ANGGOTA.puml](docs/kegiatan_proker/sequence/SEQ_13_MENGELOLA_ANGGOTA.puml)           | Urutan proses teknis saat menambah, memutakhirkan, atau menonaktifkan anggota. |

### BPMN

| File Diagram                                                               | Fokus Penjelasan                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [docs/bpmn/BPMN_07_KEPENGURUSAN.puml](docs/bpmn/BPMN_07_KEPENGURUSAN.puml) | Tersedia di repositori; menggambarkan alur tata kelola organisasi, namun tidak dijadikan BPMN utama dalam narasi inti laporan. |

## F.2 Modul Praktikum

### BPMN

| File Diagram                                                         | Fokus Penjelasan                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [docs/bpmn/BPMN_03_PRAKTIKUM.puml](docs/bpmn/BPMN_03_PRAKTIKUM.puml) | Proses end-to-end praktikum: setup, operasional pertemuan, tugas, absensi, evaluasi, hingga output akademik. |

### Use Case

| File Diagram                                                                         | Fokus Penjelasan                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [docs/praktikum/usecase/UC_PRAKTIKUM.puml](docs/praktikum/usecase/UC_PRAKTIKUM.puml) | Daftar fungsi praktikum per aktor utama (pengelola, aslab, praktikan). |
| [docs/usecase/UC_03_PRAKTIKUM.puml](docs/usecase/UC_03_PRAKTIKUM.puml)               | Ringkasan use case praktikum pada level sistem terpadu lintas modul.   |

### Activity

| File Diagram                                                                                                               | Fokus Penjelasan                                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [docs/praktikum/activity/ACT_01_MENGELOLA_PRAKTIKUM.puml](docs/praktikum/activity/ACT_01_MENGELOLA_PRAKTIKUM.puml)         | Pengelolaan data induk praktikum dan konteks pelaksanaan.          |
| [docs/praktikum/activity/ACT_02_MELIHAT_PRAKTIKUM.puml](docs/praktikum/activity/ACT_02_MELIHAT_PRAKTIKUM.puml)             | Alur akses tampilan daftar/detail praktikum sesuai hak user.       |
| [docs/praktikum/activity/ACT_03_MENGELOLA_PERTEMUAN.puml](docs/praktikum/activity/ACT_03_MENGELOLA_PERTEMUAN.puml)         | Pembuatan dan pemeliharaan jadwal/sesi pertemuan praktikum.        |
| [docs/praktikum/activity/ACT_04_MENGELOLA_MODUL.puml](docs/praktikum/activity/ACT_04_MENGELOLA_MODUL.puml)                 | Pengelolaan materi/modul praktikum per pertemuan.                  |
| [docs/praktikum/activity/ACT_05_MENGAKSES_MODUL.puml](docs/praktikum/activity/ACT_05_MENGAKSES_MODUL.puml)                 | Proses pengguna mengakses modul yang dipublikasikan.               |
| [docs/praktikum/activity/ACT_06_MENGELOLA_PRAKTIKAN.puml](docs/praktikum/activity/ACT_06_MENGELOLA_PRAKTIKAN.puml)         | Pengelolaan data praktikan dan assignment ke kelas/subkelas.       |
| [docs/praktikum/activity/ACT_07_MENGELOLA_ASLAB.puml](docs/praktikum/activity/ACT_07_MENGELOLA_ASLAB.puml)                 | Penugasan dan pemutakhiran aslab pada praktikum terkait.           |
| [docs/praktikum/activity/ACT_08_MENGELOLA_TUGAS.puml](docs/praktikum/activity/ACT_08_MENGELOLA_TUGAS.puml)                 | Siklus pembuatan tugas, deadline, dan pengaturan target kelas.     |
| [docs/praktikum/activity/ACT_09_MENGELOLA_RUBRIK.puml](docs/praktikum/activity/ACT_09_MENGELOLA_RUBRIK.puml)               | Perancangan rubrik penilaian sebagai standar evaluasi tugas.       |
| [docs/praktikum/activity/ACT_10_MENGELOLA_PENILAIAN.puml](docs/praktikum/activity/ACT_10_MENGELOLA_PENILAIAN.puml)         | Alur pemberian nilai berbasis rubrik dan validasi komponen nilai.  |
| [docs/praktikum/activity/ACT_11_MENGUMPULKAN_TUGAS.puml](docs/praktikum/activity/ACT_11_MENGUMPULKAN_TUGAS.puml)           | Proses pengumpulan tugas oleh praktikan dan validasi waktu submit. |
| [docs/praktikum/activity/ACT_12_MENGELOLA_ABSENSI.puml](docs/praktikum/activity/ACT_12_MENGELOLA_ABSENSI.puml)             | Pengisian dan pembaruan absensi aslab/praktikan pada pertemuan.    |
| [docs/praktikum/activity/ACT_13_MENGELOLA_SERTIFIKAT.puml](docs/praktikum/activity/ACT_13_MENGELOLA_SERTIFIKAT.puml)       | Pengelolaan template dan generate sertifikat praktikum.            |
| [docs/praktikum/activity/ACT_14_MELIHAT_TUGAS.puml](docs/praktikum/activity/ACT_14_MELIHAT_TUGAS.puml)                     | Alur tampilan daftar tugas dan status pengerjaan pengguna.         |
| [docs/praktikum/activity/ACT_15_RIWAYAT_PENGUMPULAN.puml](docs/praktikum/activity/ACT_15_RIWAYAT_PENGUMPULAN.puml)         | Rekam jejak submit tugas beserta status evaluasinya.               |
| [docs/praktikum/activity/ACT_16_MELIHAT_SERTIFIKAT.puml](docs/praktikum/activity/ACT_16_MELIHAT_SERTIFIKAT.puml)           | Alur pengguna melihat atau mengunduh sertifikat yang tersedia.     |
| [docs/praktikum/activity/ACT_17_MELIHAT_REKAP_PRAKTIKUM.puml](docs/praktikum/activity/ACT_17_MELIHAT_REKAP_PRAKTIKUM.puml) | Rekap data praktikum untuk monitoring capaian pembelajaran.        |

### Sequence

| File Diagram                                                                                                               | Fokus Penjelasan                                          |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [docs/praktikum/sequence/SEQ_01_MENGELOLA_PRAKTIKUM.puml](docs/praktikum/sequence/SEQ_01_MENGELOLA_PRAKTIKUM.puml)         | Interaksi teknis pembuatan/pembaruan data praktikum.      |
| [docs/praktikum/sequence/SEQ_02_MELIHAT_PRAKTIKUM.puml](docs/praktikum/sequence/SEQ_02_MELIHAT_PRAKTIKUM.puml)             | Urutan request-respons saat menampilkan data praktikum.   |
| [docs/praktikum/sequence/SEQ_03_MENGELOLA_PERTEMUAN.puml](docs/praktikum/sequence/SEQ_03_MENGELOLA_PERTEMUAN.puml)         | Proses teknis CRUD pertemuan dan validasi konteks kelas.  |
| [docs/praktikum/sequence/SEQ_04_MENGELOLA_MODUL.puml](docs/praktikum/sequence/SEQ_04_MENGELOLA_MODUL.puml)                 | Alur unggah, simpan metadata, dan manajemen modul.        |
| [docs/praktikum/sequence/SEQ_05_MENGAKSES_MODUL.puml](docs/praktikum/sequence/SEQ_05_MENGAKSES_MODUL.puml)                 | Alur akses file modul oleh pengguna sesuai izin.          |
| [docs/praktikum/sequence/SEQ_06_MENGELOLA_PRAKTIKAN.puml](docs/praktikum/sequence/SEQ_06_MENGELOLA_PRAKTIKAN.puml)         | Urutan teknis pengelolaan data praktikan.                 |
| [docs/praktikum/sequence/SEQ_07_MENGELOLA_ASLAB.puml](docs/praktikum/sequence/SEQ_07_MENGELOLA_ASLAB.puml)                 | Urutan teknis penetapan aslab ke praktikum.               |
| [docs/praktikum/sequence/SEQ_08_MENGELOLA_TUGAS.puml](docs/praktikum/sequence/SEQ_08_MENGELOLA_TUGAS.puml)                 | Pembuatan tugas, validasi deadline, dan persistensi data. |
| [docs/praktikum/sequence/SEQ_09_MENGELOLA_RUBRIK.puml](docs/praktikum/sequence/SEQ_09_MENGELOLA_RUBRIK.puml)               | Pengelolaan struktur rubrik dan keterikatannya ke tugas.  |
| [docs/praktikum/sequence/SEQ_10_MENGELOLA_PENILAIAN.puml](docs/praktikum/sequence/SEQ_10_MENGELOLA_PENILAIAN.puml)         | Alur input dan penyimpanan nilai berbasis rubrik.         |
| [docs/praktikum/sequence/SEQ_11_MENGUMPULKAN_TUGAS.puml](docs/praktikum/sequence/SEQ_11_MENGUMPULKAN_TUGAS.puml)           | Upload tugas oleh praktikan serta validasi batas waktu.   |
| [docs/praktikum/sequence/SEQ_12_MENGELOLA_ABSENSI.puml](docs/praktikum/sequence/SEQ_12_MENGELOLA_ABSENSI.puml)             | Alur pencatatan absensi dan pembaruan status hadir.       |
| [docs/praktikum/sequence/SEQ_13_MENGELOLA_SERTIFIKAT.puml](docs/praktikum/sequence/SEQ_13_MENGELOLA_SERTIFIKAT.puml)       | Proses generate dan distribusi sertifikat.                |
| [docs/praktikum/sequence/SEQ_14_MELIHAT_TUGAS.puml](docs/praktikum/sequence/SEQ_14_MELIHAT_TUGAS.puml)                     | Urutan akses daftar tugas dan detail tugas.               |
| [docs/praktikum/sequence/SEQ_15_RIWAYAT_PENGUMPULAN.puml](docs/praktikum/sequence/SEQ_15_RIWAYAT_PENGUMPULAN.puml)         | Penyajian histori submit berdasarkan user/tugas.          |
| [docs/praktikum/sequence/SEQ_16_MELIHAT_SERTIFIKAT.puml](docs/praktikum/sequence/SEQ_16_MELIHAT_SERTIFIKAT.puml)           | Urutan akses sertifikat bagi pengguna akhir.              |
| [docs/praktikum/sequence/SEQ_17_MELIHAT_REKAP_PRAKTIKUM.puml](docs/praktikum/sequence/SEQ_17_MELIHAT_REKAP_PRAKTIKUM.puml) | Pembentukan data rekap dan penyajian agregat praktikum.   |

## F.3 Modul Piket

### BPMN

| File Diagram                                                 | Fokus Penjelasan                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| [docs/bpmn/BPMN_05_PIKET.puml](docs/bpmn/BPMN_05_PIKET.puml) | Siklus proses piket dari setup periode hingga evaluasi pelaksanaan. |

### Use Case

| File Diagram                                                         | Fokus Penjelasan                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [docs/piket/usecase/UC_PIKET.puml](docs/piket/usecase/UC_PIKET.puml) | Relasi aktor dengan fungsi jadwal, absensi, dan approval ganti jadwal. |
| [docs/usecase/UC_05_PIKET.puml](docs/usecase/UC_05_PIKET.puml)       | Ringkasan use case piket pada level sistem utama.                      |

### Activity

| File Diagram                                                                                                       | Fokus Penjelasan                                  |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| [docs/piket/activity/ACT_01_MENGELOLA_PERIODE_PIKET.puml](docs/piket/activity/ACT_01_MENGELOLA_PERIODE_PIKET.puml) | Inisiasi dan manajemen periode piket aktif.       |
| [docs/piket/activity/ACT_02_MENGELOLA_JADWAL_PIKET.puml](docs/piket/activity/ACT_02_MENGELOLA_JADWAL_PIKET.puml)   | Penyusunan dan pemeliharaan jadwal petugas piket. |
| [docs/piket/activity/ACT_03_MENGELOLA_ABSENSI_PIKET.puml](docs/piket/activity/ACT_03_MENGELOLA_ABSENSI_PIKET.puml) | Pengisian absensi piket berdasarkan jadwal aktif. |
| [docs/piket/activity/ACT_04_MENGAJUKAN_GANTI_JADWAL.puml](docs/piket/activity/ACT_04_MENGAJUKAN_GANTI_JADWAL.puml) | Prosedur pengajuan perubahan jadwal oleh anggota. |
| [docs/piket/activity/ACT_05_MENYETUJUI_GANTI_JADWAL.puml](docs/piket/activity/ACT_05_MENYETUJUI_GANTI_JADWAL.puml) | Keputusan approval/reject ganti jadwal.           |
| [docs/piket/activity/ACT_06_MELIHAT_REKAP_ABSENSI.puml](docs/piket/activity/ACT_06_MELIHAT_REKAP_ABSENSI.puml)     | Penyajian rekap absensi untuk monitoring.         |
| [docs/piket/activity/ACT_07_MELIHAT_JADWAL_PIKET.puml](docs/piket/activity/ACT_07_MELIHAT_JADWAL_PIKET.puml)       | Akses jadwal piket oleh anggota sesuai periode.   |

### Sequence

| File Diagram                                                                                                       | Fokus Penjelasan                                  |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| [docs/piket/sequence/SEQ_01_MENGELOLA_PERIODE_PIKET.puml](docs/piket/sequence/SEQ_01_MENGELOLA_PERIODE_PIKET.puml) | Alur teknis manajemen periode piket.              |
| [docs/piket/sequence/SEQ_02_MENGELOLA_JADWAL_PIKET.puml](docs/piket/sequence/SEQ_02_MENGELOLA_JADWAL_PIKET.puml)   | Urutan proses CRUD jadwal piket.                  |
| [docs/piket/sequence/SEQ_03_MENGELOLA_ABSENSI_PIKET.puml](docs/piket/sequence/SEQ_03_MENGELOLA_ABSENSI_PIKET.puml) | Alur pencatatan absensi terhadap jadwal.          |
| [docs/piket/sequence/SEQ_04_MENGAJUKAN_GANTI_JADWAL.puml](docs/piket/sequence/SEQ_04_MENGAJUKAN_GANTI_JADWAL.puml) | Pengajuan perubahan jadwal dan pencatatan status. |
| [docs/piket/sequence/SEQ_05_MENYETUJUI_GANTI_JADWAL.puml](docs/piket/sequence/SEQ_05_MENYETUJUI_GANTI_JADWAL.puml) | Alur keputusan approval perubahan jadwal.         |
| [docs/piket/sequence/SEQ_06_MELIHAT_REKAP_ABSENSI.puml](docs/piket/sequence/SEQ_06_MELIHAT_REKAP_ABSENSI.puml)     | Query dan penyajian data rekap absensi.           |
| [docs/piket/sequence/SEQ_07_MELIHAT_JADWAL_PIKET.puml](docs/piket/sequence/SEQ_07_MELIHAT_JADWAL_PIKET.puml)       | Pengambilan dan render data jadwal piket.         |

## F.4 Modul Keuangan

### BPMN

| File Diagram                                                       | Fokus Penjelasan                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [docs/bpmn/BPMN_02_KEUANGAN.puml](docs/bpmn/BPMN_02_KEUANGAN.puml) | Alur proses keuangan dari input transaksi hingga rekap dan histori. |

### Use Case

| File Diagram                                                                     | Fokus Penjelasan                                            |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [docs/keuangan/usecase/UC_KEUANGAN.puml](docs/keuangan/usecase/UC_KEUANGAN.puml) | Definisi fungsi finansial per aktor pengelola dan pemantau. |
| [docs/usecase/UC_02_KEUANGAN.puml](docs/usecase/UC_02_KEUANGAN.puml)             | Posisi modul keuangan dalam peta use case sistem lengkap.   |

### Activity

| File Diagram                                                                                                                   | Fokus Penjelasan                                   |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| [docs/keuangan/activity/ACT_01_MENGELOLA_RIWAYAT_KEUANGAN.puml](docs/keuangan/activity/ACT_01_MENGELOLA_RIWAYAT_KEUANGAN.puml) | Pengelolaan transaksi pemasukan/pengeluaran.       |
| [docs/keuangan/activity/ACT_02_MENGELOLA_NOMINAL_KAS.puml](docs/keuangan/activity/ACT_02_MENGELOLA_NOMINAL_KAS.puml)           | Validasi dan pembaruan nominal kas terkini.        |
| [docs/keuangan/activity/ACT_03_MELIHAT_CATATAN_KAS.puml](docs/keuangan/activity/ACT_03_MELIHAT_CATATAN_KAS.puml)               | Alur tampilan catatan kas periodik.                |
| [docs/keuangan/activity/ACT_04_MELIHAT_REKAP_KEUANGAN.puml](docs/keuangan/activity/ACT_04_MELIHAT_REKAP_KEUANGAN.puml)         | Pembentukan rekap untuk evaluasi keuangan.         |
| [docs/keuangan/activity/ACT_05_MELIHAT_RIWAYAT_KEUANGAN.puml](docs/keuangan/activity/ACT_05_MELIHAT_RIWAYAT_KEUANGAN.puml)     | Riwayat transaksi lengkap berbasis filter periode. |

### Sequence

| File Diagram                                                                                                                   | Fokus Penjelasan                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| [docs/keuangan/sequence/SEQ_01_MENGELOLA_RIWAYAT_KEUANGAN.puml](docs/keuangan/sequence/SEQ_01_MENGELOLA_RIWAYAT_KEUANGAN.puml) | Interaksi teknis input dan mutasi data transaksi.      |
| [docs/keuangan/sequence/SEQ_02_MENGELOLA_NOMINAL_KAS.puml](docs/keuangan/sequence/SEQ_02_MENGELOLA_NOMINAL_KAS.puml)           | Alur update saldo dan sinkronisasi data kas.           |
| [docs/keuangan/sequence/SEQ_03_MELIHAT_CATATAN_KAS.puml](docs/keuangan/sequence/SEQ_03_MELIHAT_CATATAN_KAS.puml)               | Query catatan kas untuk tampilan pengguna.             |
| [docs/keuangan/sequence/SEQ_04_MELIHAT_REKAP_KEUANGAN.puml](docs/keuangan/sequence/SEQ_04_MELIHAT_REKAP_KEUANGAN.puml)         | Perhitungan dan penyajian data agregat keuangan.       |
| [docs/keuangan/sequence/SEQ_05_MELIHAT_RIWAYAT_KEUANGAN.puml](docs/keuangan/sequence/SEQ_05_MELIHAT_RIWAYAT_KEUANGAN.puml)     | Penyajian histori detail transaksi berdasarkan filter. |

## F.5 Modul Inventaris

### BPMN

| File Diagram                                                           | Fokus Penjelasan                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| [docs/bpmn/BPMN_01_INVENTARIS.puml](docs/bpmn/BPMN_01_INVENTARIS.puml) | Proses aset dari pengelolaan hingga peminjaman dan pengadaan. |

### Use Case

| File Diagram                                                                             | Fokus Penjelasan                                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [docs/inventaris/usecase/UC_INVENTARIS.puml](docs/inventaris/usecase/UC_INVENTARIS.puml) | Cakupan fitur inventaris dan peran aktor terkait aset. |
| [docs/usecase/UC_01_INVENTARIS.puml](docs/usecase/UC_01_INVENTARIS.puml)                 | Konteks inventaris dalam peta use case sistem.         |

### Activity

| File Diagram                                                                                                                           | Fokus Penjelasan                                   |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [docs/inventaris/activity/ACT_01_MENGELOLA_ASET.puml](docs/inventaris/activity/ACT_01_MENGELOLA_ASET.puml)                             | Siklus data induk aset dan atributnya.             |
| [docs/inventaris/activity/ACT_02_MELIHAT_DAFTAR_ASET.puml](docs/inventaris/activity/ACT_02_MELIHAT_DAFTAR_ASET.puml)                   | Akses daftar aset dengan filter dan pencarian.     |
| [docs/inventaris/activity/ACT_03_SCAN_QR_PUBLIK.puml](docs/inventaris/activity/ACT_03_SCAN_QR_PUBLIK.puml)                             | Alur akses informasi aset melalui QR publik.       |
| [docs/inventaris/activity/ACT_04_MENGELOLA_KONDISI_ASET.puml](docs/inventaris/activity/ACT_04_MENGELOLA_KONDISI_ASET.puml)             | Pembaruan status kondisi aset secara periodik.     |
| [docs/inventaris/activity/ACT_05_MENGELOLA_PEMINJAMAN.puml](docs/inventaris/activity/ACT_05_MENGELOLA_PEMINJAMAN.puml)                 | Proses peminjaman hingga pengembalian aset.        |
| [docs/inventaris/activity/ACT_06_MENGELOLA_PERMOHONAN.puml](docs/inventaris/activity/ACT_06_MENGELOLA_PERMOHONAN.puml)                 | Pengelolaan permohonan pengadaan/permintaan aset.  |
| [docs/inventaris/activity/ACT_07_MENGAJUKAN_PERMOHONAN.puml](docs/inventaris/activity/ACT_07_MENGAJUKAN_PERMOHONAN.puml)               | Pengajuan permohonan oleh user pemohon.            |
| [docs/inventaris/activity/ACT_08_APPROVAL_PERMOHONAN_KADEP.puml](docs/inventaris/activity/ACT_08_APPROVAL_PERMOHONAN_KADEP.puml)       | Tahap approval permohonan oleh kadep.              |
| [docs/inventaris/activity/ACT_09_MENGELOLA_KATEGORI_ASET.puml](docs/inventaris/activity/ACT_09_MENGELOLA_KATEGORI_ASET.puml)           | Pengelolaan klasifikasi kategori aset.             |
| [docs/inventaris/activity/ACT_10_MELIHAT_PERMOHONAN_PENGADAAN.puml](docs/inventaris/activity/ACT_10_MELIHAT_PERMOHONAN_PENGADAAN.puml) | Pemantauan daftar dan status permohonan pengadaan. |

### Sequence

| File Diagram                                                                                                                           | Fokus Penjelasan                                      |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [docs/inventaris/sequence/SEQ_01_MENGELOLA_ASET.puml](docs/inventaris/sequence/SEQ_01_MENGELOLA_ASET.puml)                             | Interaksi teknis pengelolaan data aset.               |
| [docs/inventaris/sequence/SEQ_02_MELIHAT_DAFTAR_ASET.puml](docs/inventaris/sequence/SEQ_02_MELIHAT_DAFTAR_ASET.puml)                   | Urutan query dan penyajian daftar aset.               |
| [docs/inventaris/sequence/SEQ_03_SCAN_QR_PUBLIK.puml](docs/inventaris/sequence/SEQ_03_SCAN_QR_PUBLIK.puml)                             | Alur akses data publik aset melalui endpoint QR.      |
| [docs/inventaris/sequence/SEQ_04_MENGELOLA_KONDISI_ASET.puml](docs/inventaris/sequence/SEQ_04_MENGELOLA_KONDISI_ASET.puml)             | Pembaruan status kondisi aset pada sistem.            |
| [docs/inventaris/sequence/SEQ_05_MENGELOLA_PEMINJAMAN.puml](docs/inventaris/sequence/SEQ_05_MENGELOLA_PEMINJAMAN.puml)                 | Alur transaksi peminjaman-pengembalian aset.          |
| [docs/inventaris/sequence/SEQ_06_MENGELOLA_PERMOHONAN.puml](docs/inventaris/sequence/SEQ_06_MENGELOLA_PERMOHONAN.puml)                 | Pengolahan permohonan oleh pengelola.                 |
| [docs/inventaris/sequence/SEQ_07_MENGAJUKAN_PERMOHONAN.puml](docs/inventaris/sequence/SEQ_07_MENGAJUKAN_PERMOHONAN.puml)               | Submit permohonan oleh pemohon dan pencatatan status. |
| [docs/inventaris/sequence/SEQ_08_APPROVAL_PERMOHONAN_KADEP.puml](docs/inventaris/sequence/SEQ_08_APPROVAL_PERMOHONAN_KADEP.puml)       | Tahapan validasi dan keputusan approval oleh kadep.   |
| [docs/inventaris/sequence/SEQ_09_MENGELOLA_KATEGORI_ASET.puml](docs/inventaris/sequence/SEQ_09_MENGELOLA_KATEGORI_ASET.puml)           | Manajemen kategori aset dan relasinya ke item.        |
| [docs/inventaris/sequence/SEQ_10_MELIHAT_PERMOHONAN_PENGADAAN.puml](docs/inventaris/sequence/SEQ_10_MELIHAT_PERMOHONAN_PENGADAAN.puml) | Penyajian data monitoring permohonan pengadaan.       |

## F.6 Modul Kuesioner

### BPMN

| File Diagram                                                         | Fokus Penjelasan                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [docs/bpmn/BPMN_09_KUESIONER.puml](docs/bpmn/BPMN_09_KUESIONER.puml) | Tersedia di repositori; untuk laporan inti belum dijadikan BPMN utama. |

### Use Case

| File Diagram                                                                         | Fokus Penjelasan                                            |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| [docs/kuesioner/usecase/UC_KUESIONER.puml](docs/kuesioner/usecase/UC_KUESIONER.puml) | Fungsi kelola, isi, dan analisis hasil kuesioner per aktor. |
| [docs/usecase/UC_09_KUESIONER.puml](docs/usecase/UC_09_KUESIONER.puml)               | Ringkasan posisi modul kuesioner pada use case sistem.      |

### Activity

| File Diagram                                                                                                               | Fokus Penjelasan                                |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [docs/kuesioner/activity/ACT_01_MENGELOLA_KUESIONER.puml](docs/kuesioner/activity/ACT_01_MENGELOLA_KUESIONER.puml)         | Penyusunan dan pengelolaan instrumen kuesioner. |
| [docs/kuesioner/activity/ACT_02_MENGISI_KUESIONER.puml](docs/kuesioner/activity/ACT_02_MENGISI_KUESIONER.puml)             | Alur pengisian jawaban oleh responden.          |
| [docs/kuesioner/activity/ACT_03_MELIHAT_HASIL_KUESIONER.puml](docs/kuesioner/activity/ACT_03_MELIHAT_HASIL_KUESIONER.puml) | Akses visualisasi hasil dan ringkasan evaluasi. |

### Sequence

| File Diagram                                                                                                               | Fokus Penjelasan                                   |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [docs/kuesioner/sequence/SEQ_01_MENGELOLA_KUESIONER.puml](docs/kuesioner/sequence/SEQ_01_MENGELOLA_KUESIONER.puml)         | Interaksi teknis pengelolaan instrumen pertanyaan. |
| [docs/kuesioner/sequence/SEQ_02_MENGISI_KUESIONER.puml](docs/kuesioner/sequence/SEQ_02_MENGISI_KUESIONER.puml)             | Alur simpan jawaban dan validasi data respon.      |
| [docs/kuesioner/sequence/SEQ_03_MELIHAT_HASIL_KUESIONER.puml](docs/kuesioner/sequence/SEQ_03_MELIHAT_HASIL_KUESIONER.puml) | Alur pembentukan data ringkasan hasil kuesioner.   |

## F.7 Modul Auth

### Use Case

| File Diagram                                                     | Fokus Penjelasan                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| [docs/auth/usecase/UC_AUTH.puml](docs/auth/usecase/UC_AUTH.puml) | Kapabilitas autentikasi dan manajemen akses akun pengguna. |

### Sequence

| File Diagram                                                                                             | Fokus Penjelasan                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [docs/auth/sequence/SEQ_01_LOGIN.puml](docs/auth/sequence/SEQ_01_LOGIN.puml)                             | Validasi kredensial dan pembentukan sesi login.      |
| [docs/auth/sequence/SEQ_02_REGISTER.puml](docs/auth/sequence/SEQ_02_REGISTER.puml)                       | Registrasi akun baru dan inisialisasi data user.     |
| [docs/auth/sequence/SEQ_03_LUPA_RESET_PASSWORD.puml](docs/auth/sequence/SEQ_03_LUPA_RESET_PASSWORD.puml) | Alur permintaan reset password dan pengiriman token. |
| [docs/auth/sequence/SEQ_04_LOGOUT.puml](docs/auth/sequence/SEQ_04_LOGOUT.puml)                           | Terminasi sesi pengguna dan penghapusan state login. |
| [docs/auth/sequence/SEQ_05_GANTI_PASSWORD.puml](docs/auth/sequence/SEQ_05_GANTI_PASSWORD.puml)           | Proses perubahan password pada akun aktif.           |
| [docs/auth/sequence/SEQ_06_VERIFIKASI_EMAIL.puml](docs/auth/sequence/SEQ_06_VERIFIKASI_EMAIL.puml)       | Verifikasi email menggunakan token/link validasi.    |
| [docs/auth/sequence/SEQ_07_KONFIRMASI_PASSWORD.puml](docs/auth/sequence/SEQ_07_KONFIRMASI_PASSWORD.puml) | Re-autentikasi sebelum aksi sensitif tertentu.       |

### Activity dan BPMN

Pada paket modul ini belum tersedia activity khusus auth, dan BPMN auth tidak dimasukkan dalam BPMN utama laporan.
