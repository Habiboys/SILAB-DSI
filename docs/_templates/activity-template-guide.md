# Panduan Template Activity Draw.io

Acuan template: `docs/_templates/activity-template.drawio`

## Aturan Wajib Style

1. Gunakan garis tegas siku:
   - `edgeStyle=orthogonalEdgeStyle`
   - `rounded=0`
2. Gunakan container vertikal per aktor (kolom), bukan horizontal.
3. Proses selalu biru:
   - `fillColor=#dae8fc`
   - `strokeColor=#6c8ebf`
4. Percabangan (decision) selalu kuning/oranye:
   - `fillColor=#fff2cc`
   - `strokeColor=#d6b656`
5. Start dan End harus beda style.

## Aturan Percabangan

- Untuk alur dengan banyak kondisi (mis. "Mengelola"), cukup **satu** decision utama:
  - contoh label: `Mengelola?`
- Dari decision utama, cabangkan ke aksi-aksi (`Ya`, `Tidak`, dst).
- Hindari membuat decision berantai kecuali benar-benar diperlukan.

## Aturan Kerapian Garis

1. Node tidak boleh berdempetan; beri jarak yang cukup antar shape.
2. Hindari garis menumpuk pada jalur yang sama.
3. Jika sumber sama, bedakan jalurnya dengan waypoint (`<Array as="points">`).
4. Jika tujuan sama, bedakan titik masuk (`entryX/entryY`) atau waypoint.
5. Jika arah garis sama (paralel/searah), wajib diberi jarak lebih lebar agar tidak terlihat dempet.
6. Untuk garis searah, gunakan offset waypoint berbeda (mis. beda `x`/`y` minimal 20–40 px).
7. Prioritaskan keterbacaan: satu garis satu jalur visual yang jelas.

## Aturan Judul Diagram

1. Wajib ada judul utama di bagian atas diagram, format: `ACT-XX - Nama Aktivitas`.
2. Tidak perlu subjudul aktor terpisah (`Aktor: ...`).
3. Nama aktor cukup ditulis pada nama container/lane.
4. Judul utama ditempatkan center agar konsisten di semua activity drawio.
5. Penamaan `diagram name` juga harus mengikuti judul aktivitas yang sama.

## Cara Pakai

1. Duplikasi file template untuk activity baru.
2. Ganti judul diagram (`diagram name`) sesuai activity.
3. Ubah teks node tanpa mengubah style inti.
4. Tambah/hapus node sesuai kebutuhan, tetap gunakan style dari template.
5. Pastikan semua edge tetap orthogonal dan `rounded=0`.
6. Rapikan jalur edge agar tidak saling menumpuk/berdempetan.
7. Untuk cabang dari sumber/tujuan yang sama, atur waypoint atau entry point yang berbeda.
8. Terapkan judul + subjudul aktor sesuai aturan judul diagram.
