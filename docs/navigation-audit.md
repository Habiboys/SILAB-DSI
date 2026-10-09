# Audit breadcrumb dan navigasi kembali

Tanggal: 9 Oktober 2026.

## Cakupan

Audit sumber meliputi 144 file JavaScript/JSX aktif, 329 pemanggilan named route, route Laravel, layout bersama, dan pemeriksaan konteks entitas di backend. Inventaris route halaman terdapat pada `navigation-page-inventory.json`; hasil pemeriksaan route pada `navigation-route-audit.json`; daftar perubahan pada `navigation-changed-paths.json`.

Modul yang diperiksa: dashboard, laboratorium, kepengurusan, anggota, praktikum (kelas, peserta, aslab, pertemuan, absensi, modul, tugas, pengumpulan, komponen, sertifikat), praktikan, kegiatan, program kerja, LPJ, inventaris dan permohonan/peminjaman, keuangan, piket, kuesioner, surat, sertifikat, data master, administrasi, profil, dan notifikasi. Halaman autentikasi serta viewer publik diperiksa sebagai konteks terpisah; tautan kembali ke login dan tombol penutup modal dipertahankan.

## Temuan dan perubahan

| Temuan | Penyebab | Perbaikan |
| --- | --- | --- |
| Breadcrumb dapat menuju prefix URL tanpa halaman | Layout membagi pathname dan menjadikan setiap prefix tautan | Helper memeriksa katalog route GET Ziggy dan membuat URL lewat named route |
| Hierarki tugas/pertemuan tidak mengikuti relasi praktikum | URL memakai `/praktikum/tugas/{id}` atau `/praktikum/pertemuan/{id}` | Hierarki dibangun dari data tugas, pertemuan, dan praktikum |
| Breadcrumb ganda | Halaman menulis breadcrumb manual di dalam layout | Implementasi manual di aslab, modul, pertemuan, absensi, pengumpulan, dan detail praktikum dihapus |
| Filter dan pagination hilang saat kembali | Tujuan selalu route index statis | Riwayat internal per tab menyimpan URL lengkap dan konteks lab/periode; parent breadcrumb memulihkan URL daftar yang cocok |
| `history.back()` dapat keluar aplikasi | Disposisi dan konfigurasi surat tidak memiliki fallback | `BackButton` memakai riwayat internal yang tervalidasi dan fallback induk |
| Konteks lab/periode/kelas tertukar | Parameter tidak diteruskan atau berasal dari state lama | Konteks backend entitas didahulukan; GET Inertia menjaga lab/periode; fallback praktikum menjaga konteks kelas |
| Redirect setelah simpan kehilangan konteks | Redirect index tidak membawa query asal | Middleware mempertahankan konteks entitas dan filter dari daftar internal yang pathname-nya sama dengan tujuan redirect |
| Redirect kegiatan kehilangan periode | Store membaca nama input yang tidak dikirim; update/delete tidak membawa periode | Periode diambil dari relasi proker kegiatan |
| Akses kegiatan lintas lab melalui entitas/proker | Pemeriksaan middleware hanya menangani praktikum | Resolver konteks model digunakan untuk route-bound entities; proker tujuan create/update diperiksa |
| 16 referensi route lama | Lima halaman legacy tidak terhubung ke route aktif | Halaman Struktur lama, kategori inventaris lama, admin lama, serta dua halaman rubrik lama dan dua controller tidak terpakai dihapus |

Komponen utama: `resources/js/Components/BackButton.jsx`, `Breadcrumb.jsx`, `Layouts/DashboardLayout.jsx`, `Utils/navigation.js`, dan `Utils/navigationRuntime.js`. Backend: `NavigationContext`, `PreserveNavigationContext`, `CheckLabAccess`, `HandleInertiaRequests`, dan `KegiatanController`.

“Kembali” memakai asal internal yang kompatibel, melewati halaman create/edit dan turunan yang menimbulkan loop. “Batal” memakai induk proses yang ditentukan halaman. Keduanya tidak menjalankan `window.history.back()`. Storage yang tidak tersedia tetap memiliki fallback. Riwayat dipisahkan berdasarkan pengguna dan tidak memakai URL eksternal.

## Validasi

- Build Vite berhasil; peringatan dependency PDF (`eval`) dan chunk besar masih ada.
- 19 pengujian helper navigasi lulus, mencakup direct access, refresh, filter/pagination, konteks dua lab/periode, kelas, hierarchy tugas, URL eksternal, fallback, dan loop.
- 7 pengujian backend lulus (15 assertions), mencakup relasi kegiatan/proker/periode, penolakan lab lain, redirect filter, dan return URL eksternal.
- Audit route frontend aktif: 329 pemanggilan named route, tanpa nama route tidak terdaftar.
- Chromium berhasil memeriksa 38 halaman index, seluruh tautan breadcrumb-nya, dan tidak menemukan JavaScript page error.
- Pengujian Chromium helper URL/session/fallback lulus.
- Suite Chromium final: 5 lulus, 1 dilewati karena fixture kegiatan kosong. Alur tambah→Batal setelah refresh mempertahankan search/status/page; akses tab baru dan perpindahan dua laboratorium lulus.

## Batas verifikasi

Audit sumber mencakup seluruh modul, tetapi pengujian browser tidak membuktikan semua kombinasi role dan data. Pengujian detail kegiatan bergantung pada fixture kegiatan; apabila fixture kosong, skenario tersebut dilewati secara eksplisit. Operasi create/update/delete data nyata tidak dilakukan dalam suite browser; pemulihan redirect diuji melalui backend test tanpa mutasi database aplikasi. Tidak ada klaim bahwa seluruh authorization aplikasi sudah diaudit sebagai audit keamanan menyeluruh: konteks yang diverifikasi middleware berasal dari model yang sudah terikat pada route dan query lab/periode; controller yang menerima ID mentah tetap bergantung pada policy/validasi masing-masing.

Antislop diminta selama pengerjaan, tetapi skill tidak ditemukan di lokasi yang tersedia. Konvensi UI AGENTS.md diterapkan tanpa mengklaim bahwa skill antislop dijalankan.
