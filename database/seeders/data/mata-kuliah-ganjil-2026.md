Sumber: `MK yang dibuka Ganjil 2026 (1).xlsx`, sheet pertama `Ang 2026`.

Seeder: `MataKuliahGanjil2026Seeder` (94 kode unik).

Mengambil kolom B–D (kurikulum 2026) dan G–I (kurikulum 2021), semester I–VIII. Spasi pada kode dihapus dan spasi tepi nama dibersihkan. Baris jumlah SKS dan mata kuliah pilihan tanpa kode dilewati. Kode yang muncul pada kedua kurikulum memakai data kurikulum 2026 terlebih dahulu; KKN `AND60101` memakai semester 7, bukan semester 6 dari kurikulum 2021.

Nama file Ganjil 2026 adalah nama sumber; isi sheet pertama mencakup semua semester. Warna penawaran tidak digunakan untuk menyaring mata kuliah. Status `aktif` berarti aktif pada master SILAB, bukan penawaran khusus semester ganjil.

Jalankan:

```sh
php artisan db:seed --class=MataKuliahGanjil2026Seeder
```

Seeder mencocokkan berdasarkan `kode_mata_kuliah`, memperbarui nama/SKS/semester/status, mempertahankan ID yang sudah ada dan tidak menghapus mata kuliah lain. Tidak membutuhkan file Excel saat dijalankan. Seeder ini dijalankan secara eksplisit, tidak ditambahkan ke `DatabaseSeeder`.
