# Absensi piket dengan verifikasi wajah

Fitur ini hanya bekerja pada periode piket yang sakelar **Verifikasi wajah**-nya aktif. Periode lama tetap nonaktif. Pengguna mendaftarkan wajah di halaman profil, admin lab meninjau foto pendaftaran, lalu check-in dan checkout mencocokkan wajah dengan data yang disetujui. Laravel memvalidasi jadwal, durasi, lokasi, dan hak akses; sidecar Python hanya mendeteksi wajah dan mencocokkan embedding (tanpa liveness kedip/putar kepala).

## Konfigurasi

`FACE_SERVICE_TOKEN` adalah rahasia bersama internal, bukan token Firebase. Buat string acak minimal 32 byte dan simpan di `.env`; jangan memasukkannya ke Git. `FACE_SIMILARITY_THRESHOLD` dimulai pada `0.70` dan perlu dikalibrasi melalui uji coba lab.

Saat Laravel dijalankan langsung di host, gunakan `FACE_SERVICE_URL=http://localhost:5000`. Compose meneruskan port sidecar hanya ke `127.0.0.1` host dan mengatur URL Laravel di dalam container menjadi `http://silab-face:5000`, karena `localhost` di container menunjuk container Laravel sendiri.

```bash
docker compose build silab-face silab-app
docker compose up -d
docker compose exec silab-app php artisan migrate --force
```

Image sidecar mengunduh model saat build. Startup container tidak memerlukan unduhan model. Queue worker Laravel harus aktif agar permintaan pendaftaran yang tidak ditinjau dibersihkan setelah tujuh hari; akses halaman pendaftaran/tinjauan juga menjalankan pembersihan yang tertunda.

## Foto absensi lama

Foto absensi baru tersimpan pada disk `local` yang privat, tetap berada di volume proyek `./storage`. Foto lama di disk `public` dipindahkan bertahap; perintah di bawah menampilkan jumlahnya tanpa mengubah berkas, lalu menyalin, membandingkan SHA-256, dan menghapus salinan publik hanya setelah salinan privat terverifikasi.

```bash
docker compose exec silab-app php artisan piket:privatize-photos
docker compose exec silab-app php artisan piket:privatize-photos --execute
```

Cadangkan `storage` dan database sebelum migrasi di produksi. Setelah pemindahan, halaman absensi tetap memuat foto melalui route berizin; URL lama `/storage/...` tidak lagi dapat dibuka untuk foto yang sudah dipindahkan.

## Uji coba

Aktifkan satu periode/lab setelah sidecar sehat, pendaftaran disetujui, dan kamera serta lokasi diuji pada perangkat seluler. Ukur waktu respons dan kegagalan verifikasi untuk mengkalibrasi ambang kecocokan. Jika kamera atau sidecar gagal, absensi otomatis ditolak tanpa foto atau catatan baru; petugas memakai input manual yang sudah ada.

Sistem ini mencocokkan wajah lewat embedding FaceNet (cosine similarity) tanpa liveness, sehingga foto/video ulang yang persis tetap berpeluang lolos. Jika keamanan anti-spoofing diperlukan, tambahkan deteksi liveness sebagai langkah terpisah.
