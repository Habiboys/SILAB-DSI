# Standarisasi tombol Kembali

Tanggal: 9 Oktober 2026.

Seluruh sumber frontend diperiksa untuk `BackButton`, label Kembali/Back/Go Back, ikon ArrowLeft/ChevronLeft, dan navigasi history. Tombol Kembali aplikasi sekarang hanya dirender melalui `DashboardLayout` di kiri atas konten, setelah breadcrumb dan sebelum judul. Halaman bertingkat memperoleh tombol dari hierarki breadcrumb; halaman dengan fallback khusus meneruskannya melalui `backFallback`.

`BackButton` memakai Button bersama, variant ghost, ukuran sm, tinggi minimum 44 px, radius rounded-lg, padding horizontal px-3, teks text-sm font-medium, ikon ArrowLeft 16 px, dan gap-2. Warna serta state interaksi mengikuti DaisyUI. Label selalu Kembali. Halaman lupa password memakai komponen yang sama di atas form, dengan tujuan login yang sesuai konteks autentikasi.

Implementasi Kembali yang berada pada actions header, panel samping LPJ, header khusus praktikan, dan tombol ganda kegiatan dihapus. Halaman Praktikan/PraktikumTugas kini menggunakan DashboardLayout. Import ikon dan komponen yang tidak dipakai setelah pemindahan dibersihkan. Tombol Batal navigasi menggunakan CancelButton yang meneruskan mode cancel ke helper bersama; Batal penutup modal tetap memakai handler modal. Previous carousel About dan kalender kegiatan dipertahankan.

Halaman yang dirapikan: Kegiatan (create, edit, show, sertifikat), sertifikat kepengurusan dan praktikum, komponen rubrik, Kuesioner (form, show, partisipasi), LPJ preview, Praktikan (detail tugas, tugas praktikum, riwayat, detail riwayat), detail Proker, detail permohonan inventaris, modul praktikan, disposisi dan konfigurasi surat, serta lupa password. Halaman bertingkat lainnya memakai penempatan otomatis layout yang sama.

Navigasi asal internal, fallback, filter/pagination, konteks lab/periode/kelas, dan pencegahan loop tetap memakai helper hasil audit sebelumnya. Tidak ada dependency baru.

## Validasi

- Build Vite berhasil. Peringatan PDF eval dan chunk besar dependency masih ada.
- 145 file JS/JSX berhasil diparse; git diff --check lolos.
- 19 tes helper navigasi dan 7 tes backend (15 assertions) lulus.
- Empat tes Chromium lulus: desktop 1440 px, tablet 768 px, mobile 390 px, dan lupa password.
- Tes responsif memeriksa halaman kegiatan create, kuesioner create, serta konfigurasi surat setelah refresh: satu tombol, label Kembali, satu ikon, kiri atas main, sebelum judul, tinggi minimum 44 px, tidak melampaui viewport, dan link berfungsi.

Verifikasi visual browser menggunakan halaman tanpa kebutuhan fixture entitas; detail dengan ID nyata di seluruh modul belum diuji ulang satu per satu. Tema gelap dan seluruh kombinasi role belum diuji secara visual. Tidak tersedia script lint di package.json; pemeriksaan parser dan import dilakukan sebagai pengganti lint, bukan diklaim sebagai lint. Antislop selama pengerjaan mengikuti pilihan pengguna, tetapi file skill tidak tersedia; konvensi UI proyek diterapkan.
