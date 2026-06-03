# 5.1.1 Pengodean Program

Subbab ini menjelaskan implementasi pengodean tujuh modul utama SILAB, yaitu Inventaris, Praktikum, Kepengurusan, Keuangan, Piket, Kuesioner, dan Auth. Fokusnya adalah pada bagian kode yang paling penting di setiap modul, supaya alur dari kebutuhan bisnis ke implementasi teknis bisa terlihat dengan jelas.

Sistem ini dibangun dengan Laravel sebagai backend dan React sebagai frontend. Setiap request dari pengguna diterima oleh route, diteruskan ke controller yang sesuai, lalu controller meminta data ke model melalui Eloquent. Setelah data siap, controller mengirimkannya ke halaman sebagai data tampilan. Ketika pengguna melakukan aksi seperti mengisi form atau mengklik tombol, data dikirim kembali ke route yang sesuai dan proses berulang dari awal.

---

## 5.1.1.1 Modul Inventaris

Modul Inventaris dipakai untuk mengelola aset laboratorium, mulai dari pencatatan aset baru, pemantauan kondisi, peminjaman, sampai proses pengadaan lewat permohonan. Data yang dikelola cukup banyak karena tidak hanya data dasar aset saja, tapi juga data operasional seperti status peminjaman aktif dan keterkaitan dengan permohonan pengadaan yang sedang berjalan.

Halaman inventaris mendukung pencarian dan filter sehingga pengelola bisa menyaring aset berdasarkan nama, kode barang, kategori, atau laboratorium tertentu. Hasilnya ditampilkan dalam bentuk tabel berpaginasi sehingga tetap nyaman dipakai meski jumlah aset banyak. Semua data yang dibutuhkan halaman, mulai dari daftar aset, daftar kategori, hingga informasi wishlist, dikirim sekaligus dalam satu response agar halaman langsung siap dipakai saat dibuka.

Route inventaris dipisah berdasarkan fiturnya, meliputi route untuk melihat daftar aset, mengelola detail aset, mencatat peminjaman, dan memproses permohonan pengadaan. Setiap route mengarahkan request ke controller yang berbeda sesuai tanggung jawabnya. Implementasi route tersebut dapat dilihat pada Gambar 5.x.

```824:841:routes/web.php
Route::get("inventaris", [InventarisController::class, "index"])
    ->name("inventaris.index");
Route::post("inventaris/permohonan/{permohonan}/submit", [
    PermohonanAsetController::class,
    "submit",
])->name("inventaris.permohonan.submit");
Route::post("inventaris/permohonan/{permohonan}/review-kalab", [
    PermohonanAsetController::class,
    "reviewKalab",
])->name("inventaris.permohonan.review-kalab");
```

Dari tiga endpoint di atas, endpoint pertama diterima oleh `InventarisController`. Method yang digunakan adalah `index()`, yang mengambil data dari model `DetailAset` lalu mengirimnya ke halaman `Inventaris/Index`. Dua endpoint berikutnya diterima oleh `PermohonanAsetController` yang membaca data permohonan dari database dan memperbarui statusnya sesuai aksi yang dilakukan. Endpoint `submit` dipanggil saat pengaju mengirimkan permohonan, sedangkan `review-kalab` dipanggil saat Kalab memberikan keputusan sebelum diteruskan ke Kadep.

Implementasi controller yang menangani pengambilan data aset beserta filter-filternya dapat dilihat pada Gambar 5.x.

```17:72:app/Http/Controllers/InventarisController.php
public function index(Request $request)
{
    $lab_id     = $request->input('lab_id');
    $search     = $request->input('search', '');
    $kategori_id = $request->input('kategori_id');
    $perPage    = $request->input('perPage', 10);

    $kepengurusanlab = null;
    if ($lab_id) {
        $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)->first();
    }

    $query = \App\Models\DetailAset::with(['kategoriAset', 'peminjamanAktif', 'wishlistAset.permohonanAset']);

    if ($lab_id) {
        $query->where('laboratorium_id', $lab_id);
    }

    if ($kategori_id) {
        $query->where('kategori_aset_id', $kategori_id);
    }

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('kode_barang', 'like', "%{$search}%")
              ->orWhere('nama', 'like', "%{$search}%")
              ->orWhereHas('kategoriAset', function ($subQ) use ($search) {
                  $subQ->where('nama', 'like', "%{$search}%");
              });
        });
    }

    $inventaris = $query->latest()->paginate($perPage)->withQueryString();
```

Model `DetailAset` mendefinisikan struktur data aset termasuk kondisi, status ketersediaan, sumber perolehan, dan relasi ke model `KategoriAset` maupun `WishlistAset`. Controller memanggil model ini setiap kali perlu mengambil, menyimpan, atau memperbarui data aset dari database. Definisi model tersebut dapat dilihat pada Gambar 5.x.

```9:51:app/Models/DetailAset.php
class DetailAset extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'aset';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'kategori_aset_id',
        'laboratorium_id',
        'nama',
        'kode_barang',
        'keadaan',
        'status',
        'keterangan',
        'foto',
        'qr_code_path',
        'tanggal_perolehan',
        'harga_perolehan',
        'asal_barang',
        'wishlist_aset_id',
    ];

    protected $casts = [
        'tanggal_perolehan' => 'date',
        'harga_perolehan'   => 'decimal:2',
    ];

    public function kategoriAset()
    {
        return $this->belongsTo(KategoriAset::class, 'kategori_aset_id');
    }
```

Di sisi tampilan, halaman `Inventaris/Index.jsx` menerima data aset, kategori, dan informasi wishlist sebagai props dari controller. Pengelola bisa melakukan pencarian langsung saat mengetik dan memilih beberapa aset sekaligus untuk diproses bersama. Ketika filter berubah, halaman mengirim request baru ke route `inventaris.index` dengan parameter filter yang diperbarui, lalu controller mengambil data ulang dari model dan mengembalikannya ke halaman. Implementasi komponen halaman inventaris dapat dilihat pada Gambar 5.x.

```23:66:resources/js/Pages/Inventaris/Index.jsx
const canManageItems = can("inventaris.manage-items");
const canManageKategori = can("inventaris.manage-kategori");
const canCreate = canManageItems;
const canUpdate = canManageItems;
const canDelete = canManageItems;

const [searchTerm, setSearchTerm] = useState(filters.search || "");
const [selectedCategory, setSelectedCategory] = useState(
    filters.kategori_id || "",
);
const [perPage, setPerPage] = useState(filters.perPage || 10);

const [selectedIds, setSelectedIds] = useState([]);
const allSelected =
    inventaris.data.length > 0 &&
    selectedIds.length === inventaris.data.length;

const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(inventaris.data.map((i) => i.id));
};
const toggleSelect = (id) => {
    setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
};
```

Selain menampilkan daftar, modul ini juga menangani pencatatan detail setiap unit aset. Ketika pengelola mengisi form dan menekan simpan, data dikirim ke route `detail-inventaris.store` lalu diterima oleh `DetailInventarisController`. Method yang digunakan adalah `store()`, kemudian controller menyimpan data ke model `DetailAset`. Setelah tersimpan, controller langsung membuat QR Code dan mencatat kondisi awal ke model `RiwayatKondisiAset` sebagai entri pertama riwayat. Dengan demikian setiap aset sudah punya jejak audit sejak hari pertama dicatat. Implementasi proses penyimpanan aset baru ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/DetailInventarisController.php (baris 67-105)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kategori_aset_id'   => 'required|exists:kategori_aset,id',
            'laboratorium_id'    => 'required|exists:laboratorium,id',
            'nama'               => 'nullable|string|max:255',
            'kode_barang'        => 'required|string|max:255|unique:aset,kode_barang',
            'keadaan'            => 'required|in:baik,rusak,hilang',
            'status'             => 'required|in:tersedia,dipinjam',
            'keterangan'         => 'nullable|string',
            'tanggal_perolehan'  => 'nullable|date',
            'harga_perolehan'    => 'nullable|numeric|min:0',
            'asal_barang'        => 'nullable|in:pengadaan,hibah,pembelian_mandiri,lainnya',
            'wishlist_aset_id'   => 'nullable|exists:wishlist_aset,id',
            'foto'               => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('foto')) {
            $validated['foto'] = $request->file('foto')->store('detail-aset', 'public');
        }

        $detailAset = DetailAset::create($validated);

        try {
            $qrPath = $this->generateQrCode($detailAset);
            $detailAset->update(['qr_code_path' => $qrPath]);
        } catch (\Exception $e) {
            Log::error('QR Code generation failed: ' . $e->getMessage());
        }

        RiwayatKondisiAset::create([
            'aset_id'         => $detailAset->id,
            'kondisi_sebelum' => null,
            'kondisi_sesudah' => $validated['keadaan'],
            'catatan'         => 'Data aset pertama kali dicatat.',
            'dicatat_oleh'    => Auth::id(),
        ]);

        return redirect()->back()->with('message', 'Detail inventaris berhasil ditambahkan');
```


Ketika pengelola menyimpan perubahan data aset, request dikirim ke route `detail-inventaris.update` dan diterima oleh `DetailInventarisController`. Method yang digunakan adalah `update()`. Controller membaca data lama dari model `DetailAset`, membandingkan kondisi sebelum dan sesudah, lalu jika ada perubahan kondisi controller menyimpan entri baru ke model `RiwayatKondisiAset` secara otomatis. Pengelola tidak perlu mencatat perubahan kondisi di tempat lain. Implementasi logika deteksi perubahan kondisi ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/DetailInventarisController.php (baris 109-157)
    public function update(Request $request, $id)
    {
        $detailAset = DetailAset::findOrFail($id);

        $validated = $request->validate([
            'nama'              => 'nullable|string|max:255',
            'kode_barang'       => 'required|string|max:255|unique:aset,kode_barang,' . $id,
            'keadaan'           => 'required|in:baik,rusak,hilang',
            'status'            => 'required|in:tersedia,dipinjam',
            'keterangan'        => 'nullable|string',
            'tanggal_perolehan' => 'nullable|date',
            'harga_perolehan'   => 'nullable|numeric|min:0',
            'asal_barang'       => 'nullable|in:pengadaan,hibah,pembelian_mandiri,lainnya',
            'wishlist_aset_id'  => 'nullable|exists:wishlist_aset,id',
            'foto'              => 'nullable|image|max:2048',
        ]);

        $kondisiLama = $detailAset->keadaan;

        if ($request->hasFile('foto')) {
            if ($detailAset->foto) {
                Storage::disk('public')->delete($detailAset->foto);
            }
            $validated['foto'] = $request->file('foto')->store('detail-aset', 'public');
        } else {
            unset($validated['foto']);
        }

        $detailAset->update($validated);

        if ($kondisiLama !== $validated['keadaan']) {
            RiwayatKondisiAset::create([
                'aset_id'         => $detailAset->id,
                'kondisi_sebelum' => $kondisiLama,
                'kondisi_sesudah' => $validated['keadaan'],
                'catatan'         => $request->input('catatan_perubahan_kondisi'),
                'dicatat_oleh'    => Auth::id(),
            ]);
        }

        try {
            $qrPath = $this->generateQrCode($detailAset);
            $detailAset->update(['qr_code_path' => $qrPath]);
        } catch (\Exception $e) {
            Log::error('QR Code regeneration failed: ' . $e->getMessage());
        }

        return redirect()->back()->with('message', 'Detail inventaris berhasil diperbarui');
    }
```


Modul ini juga mengelola proses peminjaman aset. Ketika pengelola mengisi form peminjaman dan mengirimkannya, request masuk ke route `peminjaman-aset.store` lalu diterima oleh `PeminjamanAsetController`. Method yang digunakan adalah `store()`. Controller terlebih dahulu membaca data setiap aset yang dipilih dari model `DetailAset` untuk memastikan kondisi dan statusnya layak dipinjam. Aset yang sedang dipinjam atau berstatus hilang langsung ditolak dan controller mengembalikan pesan error ke halaman. Jika semua aset lolos, controller menyimpan data peminjaman ke model `PeminjamanAset`, mencatat item per aset ke `PeminjamanAsetItem`, dan sekaligus memperbarui status di model `DetailAset` menjadi dipinjam. Semua operasi ini dilakukan bersamaan sehingga data selalu konsisten. Implementasi alur pencatatan peminjaman ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/PeminjamanAsetController.php (baris 74-144)
    public function store(Request $request)
    {

        if ($request->filled('aset_id') && !$request->has('aset_ids')) {
            $request->merge(['aset_ids' => [$request->input('aset_id')]]);
        }

        $validated = $request->validate([
            'aset_ids'                => 'required|array|min:1',
            'aset_ids.*'              => 'required|exists:aset,id',
            'nama_peminjam'           => 'required|string|max:255',
            'institusi'               => 'nullable|string|max:255',
            'keperluan'               => 'required|string',
            'tanggal_pinjam'          => 'required|date',
            'tanggal_kembali_rencana' => 'required|date|after_or_equal:tanggal_pinjam',
            'catatan'                 => 'nullable|string',
            'surat_peminjaman'        => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
        ]);

        $asetIds = array_values(array_unique($validated['aset_ids']));
        $asets   = DetailAset::whereIn('id', $asetIds)->get();

        if ($asets->count() !== count($asetIds)) {
            return redirect()->back()->withErrors(['aset_ids' => 'Sebagian aset tidak ditemukan.']);
        }

        foreach ($asets as $aset) {
            if ($aset->status === 'dipinjam') {
                return redirect()->back()->withErrors([
                    'aset_ids' => "Aset {$aset->kode_barang} sedang dipinjam oleh pihak lain.",
                ]);
            }
            if ($aset->keadaan === 'hilang') {
                return redirect()->back()->withErrors([
                    'aset_ids' => "Aset {$aset->kode_barang} berstatus hilang dan tidak dapat dipinjam.",
                ]);
            }
        }

        $suratPath = null;
        if ($request->hasFile('surat_peminjaman')) {
            $suratPath = $request->file('surat_peminjaman')->store('surat-peminjaman', 'public');
        }

        DB::transaction(function () use ($validated, $asets, $asetIds, $suratPath) {

            $peminjaman = PeminjamanAset::create([
                'aset_id'                 => $asetIds[0],
                'peminjam_id'             => Auth::id(),
                'nama_peminjam'           => $validated['nama_peminjam'],
                'institusi'               => $validated['institusi'] ?? null,
                'keperluan'               => $validated['keperluan'],
                'tanggal_pinjam'          => $validated['tanggal_pinjam'],
                'tanggal_kembali_rencana' => $validated['tanggal_kembali_rencana'],
                'status'                  => 'dipinjam',
                'surat_peminjaman_path'   => $suratPath,
                'catatan'                 => $validated['catatan'] ?? null,
                'diproses_oleh'           => Auth::id(),
            ]);

            foreach ($asetIds as $asetId) {
                PeminjamanAsetItem::create([
                    'peminjaman_aset_id' => $peminjaman->id,
                    'aset_id'            => $asetId,
                ]);
            }

            DetailAset::whereIn('id', $asetIds)->update(['status' => 'dipinjam']);
        });

        return redirect()->back()->with('message', 'Peminjaman berhasil dicatat. Status aset diperbarui.');
```


Kode di atas menunjukkan alur lengkap dari controller menerima request, membaca data model `DetailAset` untuk validasi kondisi, menyimpan surat peminjaman ke storage, lalu menulis ke tiga model sekaligus yaitu `PeminjamanAset`, `PeminjamanAsetItem`, dan `DetailAset` dalam satu transaksi atomik sebelum controller mengembalikan redirect ke halaman.

---

## 5.1.1.2 Modul Praktikum

Modul Praktikum menangani alur akademik secara menyeluruh, mulai dari pendataan praktikum, pembagian kelas, penugasan asisten, jadwal pertemuan, modul belajar, sampai pengumpulan tugas dan penilaian. Karena cakupannya luas, modul ini juga punya banyak aturan hak akses sehingga tidak semua peran bisa mengakses data yang sama.

Di backend, proses ini ditangani oleh `PraktikumController`. Method yang digunakan adalah `index()`, yang bertugas menyesuaikan konteks terlebih dahulu sebelum mengambil data. Controller membaca parameter `lab_id`, `tahun_id`, dan `kepengurusan_lab_id` dari request. Kalau yang dikirim adalah `kepengurusan_lab_id`, controller akan otomatis mengambil `lab_id` dan `tahun_id` dari data kepengurusan tersebut. Langkah ini penting supaya data yang ditampilkan selalu sesuai periode yang dipilih pengguna, tidak tercampur data dari periode lain.

Route pada modul ini dibagi menjadi dua kelompok besar. Kelompok pertama adalah route baca yang dipakai untuk melihat daftar dan detail praktikum, sedangkan kelompok kedua adalah route kelola yang mencakup CRUD praktikum, kelas, asisten, tugas, absensi, dan sertifikat. Pemisahan ini mempermudah pemetaan alur, terutama karena sub-proses di modul praktikum cukup banyak. Implementasi route tersebut dapat dilihat pada Gambar 5.x.

```362:373:routes/web.php
Route::get("/praktikum", [PraktikumController::class, "index"])
    ->name("praktikum.index")
    ->can("viewAny", \App\Models\Praktikum::class);
Route::get("/praktikum/{praktikum}", [PraktikumController::class, "show"])
    ->name("praktikum.show")
    ->can("view", "praktikum");
Route::get("praktikum/{praktikum}/modul", [
    ModulPraktikumController::class,
    "index",
])->name("praktikum.modul.index");
```

Request ke route `praktikum.index` diterima oleh `PraktikumController` dengan method `index()`, sedangkan request ke `praktikum.show` diterima oleh controller yang sama dengan method `show()`. Keduanya memiliki middleware otorisasi yang memeriksa hak akses sebelum controller dijalankan. Jika pengguna tidak punya izin, request ditolak sebelum sempat menyentuh model atau database. Implementasi controller yang menangani sinkronisasi konteks dan pengambilan data praktikum dapat dilihat pada Gambar 5.x.

```21:109:app/Http/Controllers/PraktikumController.php
public function index(Request $request)
{

    $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

    $lab_id = $request->input('lab_id');
    $tahun_id = $request->input('tahun_id');

    $kepengurusanlab = null;

    if ($kepengurusan_lab_id) {
        $kepengurusanlab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
            ->find($kepengurusan_lab_id);

        if ($kepengurusanlab) {
            $lab_id = $kepengurusanlab->laboratorium_id;
            $tahun_id = $kepengurusanlab->tahun_kepengurusan_id;
        }
    }

    $tahunKepengurusan = collect();
    if ($lab_id) {
        $tahunKepengurusan = TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
            $query->select('tahun_kepengurusan_id')
                ->from('kepengurusan_lab')
                ->where('laboratorium_id', $lab_id);
        })->orderBy('tahun', 'desc')->get();
    }

    $praktikumData = [];

    if ($kepengurusanlab) {
        $praktikumData = Praktikum::where('kepengurusan_lab_id', $kepengurusanlab->id)
            ->with([
                'jadwalPraktikum',
                'parentKelas.subKelas',
                'mataKuliah',
            ])
            ->withCount([
                'praktikans as praktikans_count' => function ($query) {
                    $query->distinct('praktikan_id');
                },
            ])
            ->get();
    }

    return Inertia::render('Praktikum', [
        'praktikumData' => $praktikumData,
```

Dari kode di atas terlihat bahwa controller membaca parameter `kepengurusan_lab_id` dari request, lalu menggunakannya untuk mencari konteks di model `KepengurusanLab`. Setelah konteks ditemukan, controller mengambil data dari model `Praktikum` dengan filter `kepengurusan_lab_id` yang sesuai, lalu mengirim semua data ke halaman `Praktikum`. Ketika pengguna mengganti periode, halaman mengirim request baru dengan `kepengurusan_lab_id` yang berbeda dan proses ini berulang.

Model `Praktikum` menjadi pusat relasi ke semua entitas turunan seperti kelas, asisten, tugas, pertemuan, dan absensi. Controller memanggil relasi-relasi ini saat mengambil data agar semua informasi yang dibutuhkan halaman tersedia dalam satu query. Definisi relasi-relasi tersebut dapat dilihat pada Gambar 5.x.

```60:105:app/Models/Praktikum.php
public function kelas()
{
    return $this->hasMany(Kelas::class);
}

public function parentKelas()
{
    return $this->hasMany(Kelas::class)->whereNull('parent_kelas_id');
}

public function tugasPraktikum()
{
    return $this->hasManyThrough(
        TugasPraktikum::class,
        Kelas::class,
        'praktikum_id',
        'kelas_id',
        'id',
        'id'
    );
}

public function aslab()
{
    return $this->belongsToMany(User::class, 'aslab_praktikum', 'praktikum_id', 'user_id')
                ->withPivot('catatan')
                ->withTimestamps();
}

public function pertemuan()
{
    return $this->hasManyThrough(
        PertemuanPraktikum::class,
        Kelas::class,
```

Di halaman `Praktikum.jsx`, data dari controller ditampilkan ke pengguna. Tombol-tombol aksi seperti tambah, edit, dan hapus muncul atau disembunyikan berdasarkan nilai `can()` yang juga dikirim controller ke halaman. Ketika pengguna mengisi form dan menyimpan, data dikirim ke route yang sesuai tanpa reload halaman penuh. Implementasi pengelolaan hak akses dan state di halaman praktikum dapat dilihat pada Gambar 5.x.

```33:117:resources/js/Pages/Praktikum.jsx
const canCreate = can("praktikum.create") || isAdmin;
const canUpdate = can("praktikum.update") || isAdmin || isKadep;
const canDelete = can("praktikum.delete") || isAdmin;
const canView = can("praktikum.view") || isAdmin || isKadep || isAslab;
const canManageStudents = can("praktikan.create") || isAdmin || isKadep;

const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

const createForm = useForm({
    lab_id: selectedLab?.id || "",
    kepengurusan_lab_id: kepengurusanlab?.id || "",
    mata_kuliah_id: "",
    jadwal: [],
    tahun_id: selectedTahun,
});

const subKelasForm = useForm({
    nama_kelas: "",
    hari: "",
    jam_mulai: "",
    jam_selesai: "",
    ruangan: "",
});
```

Selain mengelola data praktikum itu sendiri, modul ini juga mengelola pertemuan. Request ke halaman pertemuan masuk ke route `praktikum.pertemuan.index`, lalu diterima oleh `PertemuanPraktikumController`. Method yang digunakan adalah `index()`. Di sini controller membaca parameter `kelas_id` dari request untuk menentukan kelas mana yang sedang dilihat, lalu mengambil data pertemuan dari model `PertemuanPraktikum` dengan filter kelas yang sesuai. Jika asisten yang login tidak ditugaskan di kelas tersebut, controller membatasi data yang ditampilkan hanya ke kelas miliknya. Pertemuan juga hanya bisa dibuat di sub-kelas, bukan kelas induk, untuk menjaga struktur jadwal tetap rapi. Hasil akhirnya dikirim ke halaman `Pertemuan/Index`. Implementasi controller pertemuan dengan logika pembatasan akses per kelas ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/PertemuanPraktikumController.php (baris 17-83)
    public function index(Request $request, Praktikum $praktikum)
    {
        $praktikum->load(['pertemuan.modul', 'pertemuan.absensiPraktikan', 'pertemuan.absensiAslab', 'pertemuan.kelas']);
        $praktikum->load('kelas');

        $requestedKelasId = $request->input('context_kelas_id', $request->input('kelas_id'));
        $kelasScopeIds = KelasScopeResolver::resolve($requestedKelasId);

        $pertemuanQuery = PertemuanPraktikum::query()
            ->with(['modul', 'absensiPraktikan', 'absensiAslab', 'kelas'])
            ->whereHas('kelas', function ($q) use ($praktikum) {
                $q->where('praktikum_id', $praktikum->id);
            });

        if (!empty($kelasScopeIds)) {
            $pertemuanQuery->whereIn('kelas_id', $kelasScopeIds);
        }

        $pertemuan = $pertemuanQuery->get();

        $classContext = null;
        if ($requestedKelasId) {
            $classContext = $praktikum->kelas->firstWhere('id', $requestedKelasId);
        }

        return Inertia::render('Pertemuan/Index', [
            'praktikum' => $praktikum,
            'pertemuan' => $pertemuan,
            'kelas' => $praktikum->kelas,
            'filters' => $request->only(['kelas_id', 'context_kelas_id']),
            'classContext' => $classContext,
        ]);
    }


    private function validateEnrollmentKelas(string $kelasId): ?string
    {
        $hasSubKelas = \App\Models\Kelas::where('parent_kelas_id', $kelasId)->exists();
        if ($hasSubKelas) {
            return 'Kelas ini memiliki sub-kelas. Buat pertemuan untuk sub-kelas yang sesuai.';
        }
        return null;
    }


    public function store(Request $request, Praktikum $praktikum)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'tanggal' => 'required|date',
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        if ($error = $this->validateEnrollmentKelas($request->kelas_id)) {
            return back()->withErrors(['kelas_id' => $error])->withInput();
        }

        PertemuanPraktikum::create([
            'judul' => $request->judul,
            'deskripsi' => $request->deskripsi,
            'tanggal' => $request->tanggal,
            'kelas_id' => $request->kelas_id,
        ]);

        return redirect()->back()->with('message', 'Pertemuan berhasil ditambahkan.');
    }
```


Kode di atas menunjukkan alur dari controller menerima request, membaca kelas yang berlaku dari `KelasScopeResolver`, menarik data pertemuan dari model `PertemuanPraktikum` dengan filter kelas tersebut, lalu mengirim hasilnya ke halaman.

Modul ini juga mengelola tugas praktikum. Request untuk melihat daftar tugas masuk ke `TugasPraktikumController`. Method yang digunakan adalah `index()`, yang pertama-tama memverifikasi apakah asisten yang login memiliki akses ke praktikum tersebut. Jika tidak, controller langsung menolak request dengan kode 403 sebelum sempat mengambil data dari model. Jika lolos, controller mengambil data dari model `TugasPraktikum` dengan filter kelas dan pertemuan yang relevan, lalu mengirimnya ke halaman `TugasPraktikum/Index`. Ketika asisten menyimpan tugas baru melalui form, request diterima oleh `TugasPraktikumController` dengan method `store()`, lalu controller memvalidasi data termasuk mengonversi deadline ke timezone yang benar, menyimpannya ke model `TugasPraktikum`, dan mengirim notifikasi ke praktikan yang terdaftar. Implementasi controller pengelolaan tugas beserta validasi otorisasi dan konversi deadline-nya dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/TugasPraktikumController.php (baris 22-153)
    public function index(Request $request, $praktikumId)
    {
        $praktikum = Praktikum::with([
            'kepengurusanLab.laboratorium',
            'kelas' => function($query) {
                $query->where('status', 'aktif')->orderBy('nama_kelas');
            }
        ])->findOrFail($praktikumId);

        $user = auth()->user();
        if (!$user->canManagePraktikum($praktikumId)) {
            abort(403, 'Anda tidak di-assign sebagai aslab untuk praktikum ini. Hanya aslab yang ditugaskan yang dapat mengelola tugas.');
        }

        $requestedKelasId = $request->input('context_kelas_id', $request->input('kelas_id'));
        $kelasScopeIds = KelasScopeResolver::resolve($requestedKelasId);

        $kelasIds = \App\Models\Kelas::where('praktikum_id', $praktikumId)->pluck('id');
        $pertemuanListQuery = \App\Models\PertemuanPraktikum::whereIn('kelas_id', $kelasIds);
        if (!empty($kelasScopeIds)) {
            $pertemuanListQuery->whereIn('kelas_id', $kelasScopeIds);
        }

        $pertemuanList = $pertemuanListQuery
            ->with('kelas')
            ->orderBy('tanggal', 'desc')
            ->get();

        $query = TugasPraktikum::with(['komponenRubriks', 'kelas', 'pertemuan'])
            ->whereHas('kelas', fn($q) => $q->where('praktikum_id', $praktikumId));

        if ($request->has('kelas_id') && $request->kelas_id === 'umum') {
            $query->whereNull('kelas_id');
        } elseif (!empty($kelasScopeIds)) {
            $query->whereIn('kelas_id', $kelasScopeIds);
        }

        if ($request->filled('pertemuan_id')) {
            $query->where('pertemuan_id', $request->pertemuan_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('judul_tugas', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        $tugas = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $classContext = null;
        if ($requestedKelasId) {
            $classContext = $praktikum->kelas->firstWhere('id', $requestedKelasId);
        }

        return Inertia::render('TugasPraktikum/Index', [
            'praktikum' => $praktikum,
            'tugas' => $tugas,
            'pertemuanList' => $pertemuanList,
            'kelas' => $praktikum->kelas,
            'lab' => $praktikum->kepengurusanLab->laboratorium,
            'filters' => $request->only(['search', 'pertemuan_id', 'kelas_id', 'context_kelas_id']),
            'classContext' => $classContext,
        ]);
    }


    private function validateEnrollmentKelas(string $kelasId): ?string
    {
        return null;
    }


    public function store(Request $request, $praktikumId)
    {

        $praktikum = Praktikum::findOrFail($praktikumId);
        $user = auth()->user();
        if (!$user->hasAnyRole(['admin', 'superadmin', 'kadep'])) {

            if (!$user->canAccessPraktikum($praktikumId)) {
                 abort(403, 'Anda tidak memiliki akses ke praktikum dari lab lain');
            }
        }

        $request->validate([
            'judul_tugas' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'file_tugas' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'deadline' => 'required|date',
            'kelas_id' => 'nullable|exists:kelas,id',
            'pertemuan_id' => 'nullable|exists:pertemuan_praktikum,id',
        ]);

        if ($request->kelas_id && ($err = $this->validateEnrollmentKelas($request->kelas_id))) {
            return back()->withErrors(['kelas_id' => $err])->withInput();
        }

        $appTz = config('app.timezone', 'Asia/Jakarta');
        $deadlineCarbon = null;
        try {
            $deadlineCarbon = Carbon::createFromFormat('Y-m-d\TH:i', (string) $request->deadline, $appTz);
        } catch (\Throwable $e) {
            $deadlineCarbon = Carbon::parse($request->deadline, $appTz);
        }
        $deadline = $deadlineCarbon->format('Y-m-d H:i:s');

        $data = [
            'kelas_id' => $request->kelas_id,
            'pertemuan_id' => $request->pertemuan_id,
            'judul_tugas' => $request->judul_tugas,
            'deskripsi' => $request->deskripsi,
            'deadline' => $deadline,
            'status' => 'aktif'
        ];

        if ($request->hasFile('file_tugas')) {
            $file = $request->file('file_tugas');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('tugas_praktikum', $filename, 'public');
            $data['file_tugas'] = $path;
        }

        $tugas = TugasPraktikum::create($data);

        $this->notifyPraktikan($tugas, $praktikum, $request->kelas_id);

        return redirect()->back()->with('success', 'Tugas praktikum berhasil ditambahkan');
    }
```


Setelah controller berhasil menyimpan data ke model `TugasPraktikum`, ia memanggil `notifyPraktikan` untuk mengirimkan notifikasi ke praktikan yang terdaftar di kelas tersebut. Jika notifikasi gagal, proses simpan tidak ikut dibatalkan dan kegagalan hanya dicatat di log. Dengan demikian data tugas di model selalu aman meskipun ada masalah di sisi pengiriman notifikasi.

---

## 5.1.1.3 Modul Kepengurusan

Modul Kepengurusan mencakup empat hal utama, yaitu pengelolaan periode kepengurusan, pengelolaan keanggotaan lab, pengelolaan program kerja (proker), dan pengelolaan kegiatan. Keempat hal ini saling berkaitan karena periode kepengurusan menjadi konteks yang mengikat semua data turunan, sedangkan data anggota menentukan siapa yang berhak menjalankan proses bisnis di periode itu.

Karena itu, modul ini sebenarnya lebih dari sekadar manajemen proker. Periode dan anggota yang dikelola di sini menjadi dasar bagi modul lain seperti Keuangan, Piket, dan Praktikum untuk menentukan "sedang dalam konteks apa" data yang ditampilkan.

Route pada modul ini dibagi menjadi dua kelompok. Kelompok pertama adalah route administrasi yang mengelola data periode dan keanggotaan. Kelompok kedua adalah route operasional proker dan kegiatan yang menangani alur dari pembuatan sampai persetujuan. Implementasi kedua kelompok route tersebut dapat dilihat pada Gambar 5.x.

```143:150:routes/web.php
Route::resource("anggota", AnggotaController::class);
Route::resource("tahun-kepengurusan", TahunKepengurusanController::class);
Route::resource("kepengurusan-lab", KepengurusanLabController::class);
```

```236:271:routes/web.php
Route::get("/proker", [ProkerController::class, "index"])->name("proker.index");
Route::get("/proker/{proker}", [ProkerController::class, "show"])->name("proker.show");
Route::post("/proker/{proker}/ajukan", [ProkerController::class, "ajukan"])->name("proker.ajukan");
Route::post("/proker/{proker}/approve", [ProkerController::class, "approve"])->name("proker.approve");
```

Route pertama mengarahkan request administrasi ke controller `AnggotaController`, `TahunKepengurusanController`, dan `KepengurusanLabController`. Route kedua mengarahkan request operasional proker ke `ProkerController`, termasuk aksi `ajukan` yang mengubah status proker di model `Proker` dari draft menjadi diajukan, dan `approve` yang memperbarui status menjadi disetujui atau ditolak.

**Pengelolaan Periode Kepengurusan**

Periode kepengurusan dikelola lewat dua entitas yaitu `TahunKepengurusan` sebagai data tahun/periode secara umum dan `KepengurusanLab` yang menghubungkan periode itu ke laboratorium tertentu. Kombinasi keduanya menjadi konteks yang dipakai hampir semua modul untuk memfilter data.

Halaman pengelolaan periode menampilkan semua periode kepengurusan yang pernah ada untuk sebuah lab, termasuk informasi tahun dan statusnya. Pengelola juga bisa membuat periode baru dari halaman yang sama.

Model `Proker` menyediakan relasi ke semua data turunannya seperti parameter penilaian, dokumentasi, penanggung jawab, dan kegiatan. Controller memanggil relasi-relasi ini saat membuka halaman detail proker agar semua informasi tersedia tanpa query tambahan. Definisi relasi-relasi tersebut dapat dilihat pada Gambar 5.x.

```53:95:app/Models/Proker.php
public function parameter()
{
    return $this->hasMany(ProkerParameter::class, 'proker_id')->orderBy('urutan');
}

public function dokumentasi()
{
    return $this->hasMany(ProkerDokumentasi::class, 'proker_id')->latest();
}

public function pjs()
{
    return $this->hasMany(ProkerPj::class, 'proker_id')->with('user');
}

public function kegiatan()
{
    return $this->hasMany(Kegiatan::class, 'proker_id');
}
```

Halaman `Proker/Show.jsx` menerima data proker lengkap beserta daftar kegiatan dan penanggung jawab dari controller. Dari halaman ini pengelola bisa memicu aksi pengajuan atau persetujuan. Ketika pengelola mengklik ajukan atau approve, halaman mengirim POST request ke route `proker.ajukan` atau `proker.approve`, lalu controller memperbarui field status di model `Proker` dan mengembalikan redirect ke halaman yang sama. Implementasi alur pengajuan dan persetujuan di sisi frontend dapat dilihat pada Gambar 5.x.

```137:173:resources/js/Pages/Proker/Show.jsx
const handleAjukan = () => setAjukanModal(true);

const confirmAjukan = () => {
    router.post(
        route("proker.ajukan", proker.id),
        {},
        {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Program kerja berhasil diajukan");
                setAjukanModal(false);
            },
            onError: () => toast.error("Gagal mengajukan program kerja"),
        },
    );
};

const handleApprove = () => {
    setApproving(true);
    router.post(
        route("proker.approve", proker.id),
        { action: approveAction, catatan: approveCatatan },
```

Ketika pengelola mengisi form dan menyimpan proker baru, request dikirim ke route `proker.store` dan diterima oleh `ProkerController`. Method yang digunakan adalah `store()`. Controller memvalidasi data dan memastikan PJ yang dipilih memang terdaftar di periode kepengurusan yang sama dengan proker. Setelah lolos validasi, controller menyimpan data ke model `Proker` dengan status awal `draft`, menyimpan file dokumen ke storage jika ada, dan mencatat setiap PJ ke model `ProkerPj`. Hasilnya pengelola dikembalikan ke halaman sebelumnya dengan pesan sukses. Implementasi proses penyimpanan proker baru beserta validasi PJ-nya dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/ProkerController.php (baris 218-268)
            'tanggal_mulai'       => 'nullable|date',
            'tanggal_selesai'     => 'nullable|date|after_or_equal:tanggal_mulai',
            'keterangan'          => 'nullable|string',
            'file_proker'         => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'pj_user_ids'         => 'nullable|array',
            'pj_user_ids.*'       => [
                'exists:users,id',
                \Illuminate\Validation\Rule::exists('kepengurusan_user', 'user_id')
                    ->where('kepengurusan_lab_id', $request->kepengurusan_lab_id),
            ],
        ]);

        $data = $request->except(['file_proker', 'pj_user_ids', 'lab_id']);
        $data['status_pengajuan'] = 'draft';

        if ($request->hasFile('file_proker')) {
            $file               = $request->file('file_proker');
            $fileName           = time() . '_' . $file->getClientOriginalName();
            $data['file_proker'] = $file->storeAs('proker', $fileName, 'public');
        }

        $proker = Proker::create($data);

        if ($request->filled('pj_user_ids')) {
            foreach (array_unique($request->pj_user_ids) as $uid) {
                ProkerPj::create(['proker_id' => $proker->id, 'user_id' => $uid]);
            }
        }

        return redirect()->back()->with('message', 'Program kerja berhasil ditambahkan.');
    }

    public function update(Request $request, Proker $proker)
    {
        $request->validate([
            'struktur_id'     => 'required|exists:struktur,id',
            'nama_proker'     => 'required|string|max:255',
            'deskripsi'       => 'required|string',
            'tujuan'          => 'nullable|string',
            'sasaran'         => 'nullable|string',
            'output_kegiatan' => 'nullable|string',
            'status'          => 'required|in:belum_mulai,sedang_berjalan,selesai,ditunda',
            'tanggal_mulai'   => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'keterangan'      => 'nullable|string',
            'kendala'         => 'nullable|string',
            'solusi'          => 'nullable|string',
            'saran'           => 'nullable|string',
            'file_proker'     => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'pj_user_ids'     => 'nullable|array',
            'pj_user_ids.*'   => [
```


Alur persetujuan berjalan lewat dua request terpisah. Request pertama dikirim ke route `proker.ajukan` oleh pengelola, lalu diterima oleh `ProkerController` dengan method `ajukan()` untuk memverifikasi status proker di model `Proker` dan mengubahnya menjadi `diajukan`. Request kedua dikirim ke route `proker.approve` oleh Kadep, lalu diterima oleh controller yang sama dengan method `approve()` untuk membaca parameter `action` dari request dan menentukan apakah status diubah menjadi `disetujui` atau `ditolak`. Jika ditolak, catatan alasan dari Kadep juga disimpan ke kolom keterangan di model `Proker`. Implementasi method `ajukan` dan `approve` pada controller dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/ProkerController.php (baris 328-375)

    public function ajukan(Proker $proker)
    {
        $this->authorize('update', $proker);

        abort_if($proker->status_pengajuan !== 'draft', 422, 'Hanya proker berstatus draft yang bisa diajukan.');

        $proker->update(['status_pengajuan' => 'diajukan']);

        return back()->with('message', 'Program kerja berhasil diajukan untuk persetujuan.');
    }


    public function approve(Request $request, Proker $proker)
    {
        $request->validate([
            'action'  => 'required|in:approve,reject',
            'catatan' => 'nullable|string|max:500',
        ]);

        abort_if($proker->status_pengajuan !== 'diajukan', 422, 'Hanya proker yang sedang diajukan yang bisa disetujui/ditolak.');

        if ($request->action === 'approve') {
            $proker->update([
                'status_pengajuan' => 'disetujui',
                'status'           => 'belum_mulai',
            ]);
            return back()->with('message', 'Program kerja berhasil disetujui.');
        }

        $proker->update([
            'status_pengajuan' => 'ditolak',
            'keterangan'       => $request->catatan
                ? ($proker->keterangan ? $proker->keterangan . "\n[Ditolak]: " . $request->catatan : '[Ditolak]: ' . $request->catatan)
                : $proker->keterangan,
        ]);

        return back()->with('message', 'Program kerja ditolak.');
    }


    public function saveEvaluasi(Request $request, Proker $proker)
    {
        $this->authorize('updateProgress', $proker);

        $request->validate([
            'kendala'          => 'nullable|string',
            'solusi'           => 'nullable|string',
```


Ketika halaman detail proker dibuka, request masuk ke route `proker.show` dan diterima oleh `ProkerController`. Method yang digunakan adalah `show()`. Controller memuat data proker dari model `Proker` beserta semua relasinya, mengambil daftar kandidat PJ dari model `KepengurusanUser` yang dibatasi hanya anggota divisi terkait, lalu menyusun array `can` yang berisi boolean hak akses pengguna untuk setiap aksi. Semua data ini dikirim ke halaman `Proker/Show`. Halaman kemudian menampilkan atau menyembunyikan tombol aksi berdasarkan nilai `can` yang diterima dari controller. Implementasi method `show` beserta penyusunan daftar PJ dan array hak akses ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/ProkerController.php (baris 146-213)

    public function show(Proker $proker)
    {
        $user = auth()->user();

        $proker->load([
            'struktur',
            'kepengurusanLab.tahunKepengurusan',
            'kepengurusanLab.laboratorium',
            'parameter',
            'pjs.user',
            'kegiatan' => fn ($q) => $q->orderBy('tanggal_mulai', 'desc'),
        ]);

        $proker->append([
            'status_badge',
            'status_text',
            'status_pengajuan_badge',
            'status_pengajuan_text',
            'nama_display',
            'total_bobot',
            'persentase_capaian',
        ]);

        $anggota = collect();
        if ($proker->kepengurusan_lab_id) {
            $divStrukturIds = [$proker->struktur_id];
            if ($proker->struktur_id) {
                $childIds = Struktur::where('parent_id', $proker->struktur_id)
                    ->pluck('id')
                    ->toArray();
                $divStrukturIds = array_merge($divStrukturIds, $childIds);
            }

            $anggota = KepengurusanUser::where('kepengurusan_lab_id', $proker->kepengurusan_lab_id)
                ->whereIn('struktur_id', $divStrukturIds)
                ->where('is_active', true)
                ->with('user:id,name')
                ->get()
                ->map(fn ($ku) => ['id' => $ku->user->id, 'name' => $ku->user->name ?? '-'])
                ->unique('id')
                ->values();
        }

        $can = [
            'manage'         => $user->can('update', $proker),
            'updateProgress' => $user->can('updateProgress', $proker),
            'approve'        => $user->can('approve', $proker),
            'delete'         => $user->can('delete', $proker),
            'ajukan'         => $user->can('update', $proker) && $proker->status_pengajuan === 'draft',
        ];

        return Inertia::render('Proker/Show', [
            'proker'             => $proker,
            'anggota'            => $anggota,
            'can'                => $can,
            'kepengurusan_lab_id' => $proker->kepengurusan_lab_id,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'lab_id'              => 'required|exists:laboratorium,id',
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'struktur_id'         => 'required|exists:struktur,id',
            'nama_proker'         => 'required|string|max:255',
            'deskripsi'           => 'required|string',
```


Kode di atas menunjukkan bagaimana satu request ke halaman detail proker menghasilkan response yang sudah lengkap. Data proker dengan semua relasinya diambil dari model, indikator progres dihitung, daftar kandidat PJ disusun dari model `KepengurusanUser`, hak akses dikompilasi ke array `can`, lalu semuanya dikirim ke halaman untuk ditampilkan.

**Pengelolaan Kegiatan**

Kegiatan adalah turunan langsung dari proker. Satu proker bisa punya banyak kegiatan, dan setiap kegiatan bisa memiliki dokumentasi, peserta, dan sertifikat. `KegiatanController` menangani CRUD kegiatan dengan alur yang sama, yaitu request masuk ke route, controller membaca konteks dari parameter request, mengambil data dari model `Kegiatan` dengan filter `proker_id` yang sesuai, lalu mengirim hasilnya ke halaman untuk ditampilkan.

Dengan struktur empat sub-bagian ini, modul Kepengurusan berfungsi sebagai fondasi organisasi yang mengikat semua modul lain. Periode kepengurusan menentukan ruang data yang sah, dan data anggota menentukan siapa yang berwenang menjalankan proses bisnis di periode itu.

Fitur kritis dari manajemen periode adalah `toggleActive`. Ketika pengelola mengklik tombol aktifkan di halaman, request dikirim ke route khusus toggle dan diterima oleh `KepengurusanLabController`. Method yang digunakan adalah `toggleActive()`. Controller kemudian memperbarui beberapa record di model `KepengurusanLab` dan `KepengurusanUser` sekaligus dalam satu transaksi. Implementasi fungsi ini dapat dilihat pada Gambar 5.x.

```90:117:app/Http/Controllers/KepengurusanLabController.php
public function toggleActive(KepengurusanLab $kepengurusanLab)
{
    $labId = $kepengurusanLab->laboratorium_id;

    DB::transaction(function () use ($kepengurusanLab, $labId) {
        if ($kepengurusanLab->is_active) {
            $kepengurusanLab->update(['is_active' => false]);

            KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLab->id)
                ->update(['is_active' => false]);
        } else {
            KepengurusanLab::where('laboratorium_id', $labId)
                ->where('id', '!=', $kepengurusanLab->id)
                ->update(['is_active' => false]);

            KepengurusanUser::whereHas('kepengurusanLab', function ($q) use ($labId, $kepengurusanLab) {
                $q->where('laboratorium_id', $labId)
                  ->where('id', '!=', $kepengurusanLab->id);
            })->update(['is_active' => false]);

            $kepengurusanLab->update(['is_active' => true]);

            KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLab->id)
                ->update(['is_active' => true]);
        }
    });
}
```

Dari kode di atas terlihat bahwa controller pertama memeriksa status periode saat ini di model `KepengurusanLab`. Jika periode sedang aktif, controller menonaktifkannya beserta semua anggotanya di model `KepengurusanUser`. Jika sebaliknya, controller menonaktifkan semua periode lain milik lab yang sama, lalu mengaktifkan periode yang dipilih beserta anggota-anggotanya. Semua perubahan ini dilakukan dalam satu transaksi sehingga tidak ada jeda di mana dua periode aktif bersamaan.

**Pengelolaan Keanggotaan**

Satu akun pengguna bisa terdaftar sebagai anggota di beberapa periode berbeda. Ketika halaman anggota dibuka, request masuk ke route `anggota.index` lalu diterima oleh `AnggotaController`. Method yang digunakan adalah `index()`. Controller membaca parameter `kepengurusan_lab_id`, `tahun_id`, dan `lab_id` dari request, kemudian menggunakannya untuk memfilter data dari model `User` melalui relasi ke model `KepengurusanUser`. Hasilnya dikirim ke halaman sehingga daftar yang tampil selalu sesuai periode yang dipilih pengguna. Implementasi logika filter bertingkat pada controller anggota ini dapat dilihat pada Gambar 5.x.

```99:119:app/Http/Controllers/AnggotaController.php
$usersQuery = User::whereHas('profile')
    ->whereHas('kepengurusan');

if ($kepengurusanLabId) {
    $usersQuery->whereHas('kepengurusan', function($query) use ($kepengurusanLabId) {
        $query->where('kepengurusan_lab_id', $kepengurusanLabId);
    });
} elseif ($tahun_id && $lab_id) {
    $usersQuery->whereHas('kepengurusan', function($query) use ($tahun_id, $lab_id) {
        $query->whereHas('kepengurusanLab', function($q) use ($tahun_id, $lab_id) {
            $q->where('tahun_kepengurusan_id', $tahun_id)
              ->where('laboratorium_id', $lab_id);
        });
    });
} elseif ($lab_id) {
    $usersQuery->whereHas('kepengurusan', function($query) use ($lab_id) {
        $query->whereHas('kepengurusanLab', function($q) use ($lab_id) {
            $q->where('laboratorium_id', $lab_id);
        });
    });
}
```

Kode di atas menunjukkan bahwa controller memprioritaskan `kepengurusan_lab_id` jika tersedia karena ini konteks paling spesifik. Jika tidak ada, filter turun ke kombinasi `tahun_id` dan `lab_id`, atau hanya `lab_id` saja. Dengan begitu halaman selalu bisa menampilkan data meskipun parameter yang dikirim dari halaman belum lengkap.

**Pengelolaan Proker**

Setelah periode dan anggota siap, proses berikutnya adalah pengelolaan program kerja. Ketika halaman daftar proker dibuka, request diterima oleh `ProkerController`. Method yang digunakan adalah `index()`. Controller terlebih dahulu membaca konteks kepengurusan lab yang aktif, lalu membangun query ke model `Proker` dengan filter pencarian, struktur divisi, status pengajuan, dan status progres yang dikirim dari halaman. Hasilnya diformat dengan indikator status dan capaian, lalu dikirim ke halaman `Proker/Index`. Implementasi query pengambilan daftar proker beserta filter-filternya dapat dilihat pada Gambar 5.x.

```82:145:app/Http/Controllers/ProkerController.php
$query = Proker::where('kepengurusan_lab_id', $kepengurusanlab->id)
    ->with(['struktur', 'kepengurusanLab', 'parameter', 'pjs.user'])
    ->withCount('kegiatan');

if ($search) {
    $query->where('nama_proker', 'like', "%{$search}%");
}
if ($fStruktur) {
    $query->where('struktur_id', $fStruktur);
}
if ($fSP) {
    $query->where('status_pengajuan', $fSP);
}
if ($fStatus) {
    $query->where('status', $fStatus);
}

$prokerData = $query->orderBy('created_at', 'desc')
    ->paginate($perPage)
    ->through(function ($p) {
        $p->append(['status_badge', 'status_text', 'status_pengajuan_badge', 'status_pengajuan_text', 'nama_display', 'total_bobot', 'persentase_capaian']);
        return $p;
    });
```

Data yang diterima halaman dari controller sudah dilengkapi dengan indikator status, persentase capaian, dan informasi lain yang dibutuhkan untuk tampilan, sehingga halaman React tidak perlu melakukan perhitungan tambahan dan cukup menampilkan apa yang sudah disiapkan controller dari model.

---

## 5.1.1.4 Modul Keuangan

Modul Keuangan mengelola pencatatan pemasukan dan pengeluaran kas laboratorium, termasuk uang kas rutin anggota. Data ini diikat ke periode kepengurusan aktif, sehingga catatan keuangan tiap periode bisa dilihat secara terpisah.

Halaman riwayat keuangan menampilkan catatan transaksi per periode, lengkap dengan ringkasan total pemasukan, total pengeluaran, dan saldo saat ini. Pengelola bisa memfilter untuk melihat hanya transaksi masuk atau keluar saja.

Route modul Keuangan dibagi menjadi tiga endpoint utama, yaitu riwayat transaksi harian, catatan kas, dan rekap periodik. Pemisahan ini memungkinkan masing-masing halaman punya query yang fokus tanpa harus saling berbagi beban. Implementasi route modul keuangan dapat dilihat pada Gambar 5.x.

```309:329:routes/web.php
Route::get("/riwayat-keuangan", [RiwayatKeuanganController::class, "index"])
    ->name("riwayat-keuangan.index");
Route::get("/catatan-kas", [RiwayatKeuanganController::class, "catatanKas"])
    ->name("catatan-kas");
Route::get("/rekap-keuangan", [RekapKeuanganController::class, "index"])
    ->name("rekap-keuangan.index");
```

Request ke `riwayat-keuangan` diterima oleh `RiwayatKeuanganController`. Method yang digunakan adalah `index()`, yang mengambil data transaksi dari model `PemasukanKeuangan` dan `PengeluaranKeuangan`. Request ke `rekap-keuangan` diterima oleh `RekapKeuanganController`. Method yang digunakan adalah `index()`, yang merangkum data yang sama dalam format ringkasan periodik. Pemisahan route ini membuat tiap controller hanya bertanggung jawab atas satu tampilan dengan query yang fokus.

Implementasi pengambilan data riwayat keuangan beserta perhitungan saldo dapat dilihat pada Gambar 5.x.

```90:137:app/Http/Controllers/RiwayatKeuanganController.php
$pemasukanQuery = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
    ->with(['user', 'kepengurusanLab.tahunKepengurusan', 'nominalKas']);

$pengeluaranQuery = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
    ->with(['user', 'kepengurusanLab.tahunKepengurusan']);

if ($jenis === 'masuk') {
    if ($search) $pemasukanQuery->where('deskripsi', 'like', "%{$search}%");
    $riwayatKeuangan = $pemasukanQuery->orderBy('tanggal', 'desc')
        ->paginate($perPage)
        ->withQueryString();
} elseif ($jenis === 'keluar') {
    if ($search) $pengeluaranQuery->where('deskripsi', 'like', "%{$search}%");
    $riwayatKeuangan = $pengeluaranQuery->orderBy('tanggal', 'desc')
        ->paginate($perPage)
        ->withQueryString();
}

$totalPemasukan = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
    ->sum('nominal');
$totalPengeluaran = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
    ->sum('nominal');
$saldo = $totalPemasukan - $totalPengeluaran;
```

Kode di atas menunjukkan bahwa controller mengambil data dari model `PemasukanKeuangan` dan `PengeluaranKeuangan` secara terpisah, menghitung saldo dari selisih keduanya, lalu mengirim semua data termasuk nilai saldo ke halaman `RiwayatKeuangan`. Halaman kemudian menampilkan data ini beserta ringkasan saldo tanpa perlu menghitung sendiri.

Di halaman `RiwayatKeuangan.jsx`, pengelola bisa mencari transaksi berdasarkan deskripsi. Saat pengguna mengetik di kolom pencarian, halaman tidak langsung mengirim request ke route `riwayat-keuangan.index`. Sistem menunggu 300ms setelah pengguna berhenti mengetik sebelum request dikirim, agar server tidak dibebani request beruntun. Request yang dikirim menyertakan nilai `search` sebagai parameter, lalu controller menggunakannya untuk memfilter data dari model sebelum mengirimnya kembali ke halaman. Implementasi komponen pencarian dengan debounce di halaman riwayat keuangan dapat dilihat pada Gambar 5.x.

```31:64:resources/js/Pages/RiwayatKeuangan.jsx
const [search, setSearch] = useState(filters?.search || "");
const [perPage, setPerPage] = useState(filters?.perPage || 10);

const canCreate = can("keuangan.create-transaksi");
const canUpdate = can("keuangan.update-transaksi");
const canDelete = can("keuangan.delete-transaksi");

const handleSearch = useCallback(
    debounce((query) => {
        router.get(
            route(route().current()),
            { ...filters, search: query, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, 300),
    [filters],
);
```

Ketika pengelola mengisi form dan menyimpan transaksi baru, data dikirim ke route `riwayat-keuangan.store` dan diterima oleh `RiwayatKeuanganController`. Method yang digunakan adalah `store()`. Controller memvalidasi input, lalu memeriksa apakah transaksi ini berjenis uang kas atau transaksi biasa. Untuk uang kas, controller terlebih dahulu membaca nominal standar dari model `NominalKas` dan memastikan jumlah yang dibayar tidak kurang dari ketentuan. Setelah semua validasi lolos, controller menyimpan data ke model `PemasukanKeuangan` atau `PengeluaranKeuangan` sesuai jenis transaksi. Implementasi lengkap proses penyimpanan transaksi ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/RiwayatKeuanganController.php (baris 183-290)
    {

        \Illuminate\Support\Facades\Log::info('Store request data:', $request->all());

        $validatedData = $request->validate([
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:500',
            'jenis' => 'required|in:masuk,keluar',
            'deskripsi' => 'required|string',
            'bukti' => 'nullable|string',
            'lab_id' => 'required|exists:laboratorium,id',
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'user_id' => 'nullable|string|exists:users,id',
            'nominal_kas_id' => 'nullable|uuid|exists:nominal_kas,id',
            'is_uang_kas' => 'nullable|boolean',
            'jenis_pembayaran_kas' => 'nullable|in:normal,lebih',
            'catatan_pembayaran' => 'nullable|string|max:500',
        ]);

        \Illuminate\Support\Facades\Log::info('Validated data:', $validatedData);

        $validatedData['is_uang_kas'] = $request->has('is_uang_kas') ? (bool)$request->is_uang_kas : false;

        if (!isset($validatedData['user_id'])) {
            $validatedData['user_id'] = Auth::id();
        }

        $validatedData['nominal_kas_id'] = $validatedData['nominal_kas_id'] ?? null;

        if ($validatedData['is_uang_kas'] === true) {

            if (!empty($validatedData['nominal_kas_id'])) {
                $nominalKas = NominalKas::where('id', $validatedData['nominal_kas_id'])
                    ->where('kepengurusan_lab_id', $validatedData['kepengurusan_lab_id'])
                    ->first();
            } else {
                $nominalKas = NominalKas::getActiveNominalKas($validatedData['kepengurusan_lab_id']);
            }

            if (!$nominalKas) {
                return back()->withErrors([
                    'nominal_kas_id' => 'Nominal kas tidak ditemukan untuk kepengurusan ini. Silakan pilih nominal kas yang valid.'
                ])->withInput();
            }

            $validatedData['nominal_kas_id'] = $nominalKas->id;

            \Illuminate\Support\Facades\Log::info('Nominal Kas Info:', [
                'nominal' => $nominalKas->nominal,
                'periode' => $nominalKas->periode,
                'payment_nominal' => $validatedData['nominal']
            ]);

            if ($validatedData['nominal'] < $nominalKas->nominal) {
                return back()->withErrors([
                    'nominal' => 'Nominal pembayaran uang kas minimal ' . number_format((float)$nominalKas->nominal, 0, ',', '.') . ' untuk periode ' . $nominalKas->periode
                ])->withInput();
            }

            if (!isset($validatedData['jenis_pembayaran_kas']) || empty($validatedData['jenis_pembayaran_kas'])) {
                if ($validatedData['nominal'] > $nominalKas->nominal) {

                    return back()->withErrors([
                        'jenis_pembayaran_kas' => 'Nominal pembayaran melebihi nominal kas. Silakan pilih jenis pembayaran: Normal (untuk periode selanjutnya) atau Lebih (bonus/tambahan)'
                    ])->withInput();
                } else {
                    $validatedData['jenis_pembayaran_kas'] = 'normal';
                }
            }

        } else {
            $validatedData['nominal_kas_id'] = null;
        }

        $validatedData['bukti'] = null;

        if ($request->filled('bukti') && preg_match('/^data:image\/(\w+);base64,/', $request->bukti)) {

            $buktiData = substr($request->bukti, strpos($request->bukti, ',') + 1);
            $buktiData = base64_decode($buktiData);

            $mimeType = explode(':', substr($request->bukti, 0, strpos($request->bukti, ';')))[1];
            $extension = explode('/', $mimeType)[1];

            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            if (!in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['bukti' => 'File harus berupa gambar (jpg, jpeg, png, gif)']);
            }

            $safeName = preg_replace('/[^a-z0-9]+/', '-', strtolower($validatedData['deskripsi']));
            $safeName = substr($safeName, 0, 30);
            $fileName = "bukti-" . time() . "-" . $safeName . "." . $extension;

            $directory = 'bukti';
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }

            $path = $directory . '/' . $fileName;

            Storage::disk('public')->put($path, $buktiData);

            $validatedData['bukti'] = $path;
        }

        if ($validatedData['jenis'] === 'masuk') {
            PemasukanKeuangan::create($validatedData);
        } else {
```


Kode di atas memperlihatkan bahwa controller membaca model `NominalKas` untuk mendapatkan nilai standar, lalu membandingkannya dengan nilai yang dikirim pengguna dari halaman. Jika bayaran lebih dari nominal standar dan jenis pembayaran belum ditentukan, controller mengembalikan error ke halaman meminta pengelola memilih opsi lebih lanjut. Setelah semua lolos, bukti pembayaran yang dikirim dalam format base64 dari halaman didekode dan disimpan ke storage, lalu path-nya disertakan saat menyimpan data ke model transaksi.

---

## 5.1.1.5 Modul Piket

Modul Piket mengelola jadwal tugas piket asisten per hari, termasuk pencatatan absensi dan pengajuan ganti jadwal. Dua hal yang paling diperhatikan dalam implementasinya adalah memastikan yang dijadwalkan memang asisten bukan role lain, serta mencegah satu asisten dijadwal dua kali di hari yang sama.

Jadwal piket ditampilkan dalam format mingguan, dikelompokkan per hari dari Senin sampai Jumat. Pengelolaan jadwal dilakukan oleh admin atau koordinator, sedangkan asisten bisa mengajukan penggantian jadwal jika ada keperluan.

Route modul Piket dibagi berdasarkan fungsinya, meliputi periode piket untuk mengatur rentang waktu, jadwal piket untuk pembagian tugas harian, absensi piket untuk pencatatan kehadiran, dan ganti jadwal piket untuk pengajuan perubahan. Implementasi route modul piket dapat dilihat pada Gambar 5.x.

```737:766:routes/web.php
Route::resource("periode-piket", PeriodePiketController::class)
    ->middleware("active.kepengurusan:piket");
Route::resource("jadwal-piket", JadwalPiketController::class)
    ->middleware("active.kepengurusan:piket");
Route::resource("absensi-piket", AbsensiController::class)
    ->middleware("active.kepengurusan:piket");
Route::resource("ganti-jadwal-piket", GantiJadwalPiketController::class);
```

Tiga route pertama dilindungi middleware `active.kepengurusan` yang memeriksa apakah ada periode aktif sebelum request diteruskan ke controller. Jika tidak ada periode aktif, request ditolak sebelum menyentuh model. Route ganti jadwal tidak dibatasi karena pengajuan bisa terjadi kapan saja.

Implementasi pengambilan dan pengolahan data jadwal menjadi format per hari dapat dilihat pada Gambar 5.x.

```98:157:app/Http/Controllers/JadwalPiketController.php
$jadwalPiket = JadwalPiket::with(['kepengurusanUser.user.profile'])
    ->where('kepengurusan_lab_id', $kepengurusanLab->id)
    ->get();

$groupedJadwal = $jadwalPiket->groupBy('hari');
$days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];

foreach ($days as $day) {
    if (!isset($groupedJadwal[$day])) {
        $groupedJadwal[$day] = collect([]);
    }
}

$formattedJadwal = [];
foreach ($groupedJadwal as $day => $jadwals) {
    $formattedJadwal[$day] = $jadwals->map(function($jadwal) {
        return [
            'id' => $jadwal->user->id,
            'name' => $jadwal->user->name,
            'jadwalId' => $jadwal->id,
            'profile' => $jadwal->user->profile
        ];
    });
}
```

Kode di atas memperlihatkan bahwa proses ini ditangani oleh `JadwalPiketController`. Method yang digunakan adalah `index()`, yang mengambil data dari model `JadwalPiket`, mengelompokkannya per hari, lalu memastikan semua hari Senin sampai Jumat selalu ada di hasil meskipun belum ada asisten yang dijadwal. Struktur data yang sudah diformat ini kemudian dikirim ke halaman `JadwalPiket`, sehingga tampilan mingguan bisa langsung ditampilkan tanpa memproses data mentah lagi.

Halaman `JadwalPiket.jsx` menerima data jadwal mingguan dan daftar asisten dari controller. Saat pengelola mengklik kolom hari tertentu, halaman mengisi otomatis field `hari` di form melalui state lokal. Ketika form dikirim, data diteruskan ke route `jadwal-piket.store`. Implementasi komponen halaman jadwal piket termasuk pengelolaan form per hari dapat dilihat pada Gambar 5.x.

```40:103:resources/js/Pages/JadwalPiket.jsx
const canManage = can("piket.manage-jadwal");

const createForm = useForm({
    user_ids: [],
    hari: "",
    kepengurusan_lab_id: kepengurusanLab?.id || "",
});

const openCreateModal = (day) => {
    createForm.reset();
    createForm.setData({
        user_ids: [],
        hari: day,
        kepengurusan_lab_id: kepengurusanLab?.id || "",
    });
    setSelectedDay(day);
    setIsCreateModalOpen(true);
};
```

Ketika form dikirim, request masuk ke `JadwalPiketController`. Method yang digunakan adalah `store()`. Controller memproses setiap `user_id` dari array yang dikirim halaman satu per satu: pertama membaca model `KepengurusanUser` untuk memverifikasi bahwa pengguna tersebut adalah asisten aktif, lalu membaca model `JadwalPiket` untuk memastikan belum ada jadwal di hari yang sama. Asisten yang tidak lolos dilewati dan dicatat, sedangkan yang lolos langsung disimpan ke model `JadwalPiket`. Di akhir, controller mengembalikan redirect ke halaman dengan pesan yang merangkum berapa yang berhasil dan yang dilewati. Implementasi proses penyimpanan jadwal dengan validasi per asisten ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/JadwalPiketController.php (baris 160-232)

    public function store(Request $request)
    {
        try {
            $request->validate([
                'user_ids'            => 'required|array|min:1',
                'user_ids.*'          => 'required|exists:users,id',
                'hari'                => 'required|in:senin,selasa,rabu,kamis,jumat',
                'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            ]);

            $kepengurusanLab = \App\Models\KepengurusanLab::findOrFail($request->kepengurusan_lab_id);

            $added   = 0;
            $skipped = [];

            foreach ($request->user_ids as $userId) {

                $kepengurusanUser = KepengurusanUser::where('user_id', $userId)
                    ->where('kepengurusan_lab_id', $kepengurusanLab->id)
                    ->whereHas('struktur', function ($q) {
                        $q->whereHas('defaultRole', function ($r) {
                            $r->where('name', 'like', '%asisten%');
                        });
                    })
                    ->first();

                if (!$kepengurusanUser) {
                    $skipped[] = 'User ' . $userId . ' bukan asisten di kepengurusan ini';
                    continue;
                }

                $existing = JadwalPiket::where('kepengurusan_user_id', $kepengurusanUser->id)
                    ->where('hari', $request->hari)
                    ->where('kepengurusan_lab_id', $request->kepengurusan_lab_id)
                    ->first();

                if ($existing) {
                    $skipped[] = $kepengurusanUser->user->name . ' sudah dijadwalkan pada hari ini';
                    continue;
                }

                JadwalPiket::create([
                    'kepengurusan_user_id' => $kepengurusanUser->id,
                    'hari'                 => $request->hari,
                    'kepengurusan_lab_id'  => $request->kepengurusan_lab_id,
                ]);
                $added++;
            }

            if ($added === 0) {
                return back()->with('error', 'Tidak ada jadwal yang ditambahkan. ' . implode(', ', $skipped));
            }

            $msg = $added . ' jadwal piket berhasil ditambahkan.';
            if (count($skipped)) {
                $msg .= ' Dilewati: ' . implode(', ', $skipped);
            }

            return redirect()->route('piket.jadwal.index', [
                'kepengurusan_lab_id' => $request->input('kepengurusan_lab_id'),
            ])->with('success', $msg);
        } catch (\Exception $e) {
            Log::error('Error creating jadwal piket: ' . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan jadwal piket: ' . $e->getMessage());
        }
    }


    public function update(Request $request, $id)
    {
        try {
```


Untuk proses update jadwal yang sudah ada, alurnya berbeda. Request dikirim langsung oleh JavaScript dari halaman ke route `jadwal-piket.update`, lalu diterima oleh `JadwalPiketController`. Method yang digunakan adalah `update()`, dan response yang dikembalikan adalah JSON, bukan redirect. Ini karena edit jadwal dilakukan secara inline di halaman tanpa reload penuh, sehingga JavaScript perlu membaca hasilnya langsung dari response untuk memperbarui tampilan. Controller tetap memeriksa kevalidan asisten dari model `KepengurusanUser` dan duplikasi jadwal dari model `JadwalPiket` sebelum menyimpan perubahan. Implementasi proses update jadwal ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/JadwalPiketController.php (baris 234-285)
                'id' => $id,
                'request_data' => $request->all()
            ]);

            $jadwalPiket = JadwalPiket::findOrFail($id);

            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'hari' => 'required|in:senin,selasa,rabu,kamis,jumat',
            ]);

            $kepengurusanUser = KepengurusanUser::where('user_id', $validated['user_id'])
                ->where('kepengurusan_lab_id', $jadwalPiket->kepengurusan_lab_id)
                ->whereHas('struktur', function ($q) {
                    $q->whereHas('defaultRole', function ($r) {
                        $r->where('name', 'like', '%asisten%');
                    });
                })
                ->first();

            if (!$kepengurusanUser) {
                return response()->json(['message' => 'User tidak terdaftar dalam kepengurusan lab yang dipilih.'], 422);
            }

            $existing = JadwalPiket::where('kepengurusan_user_id', $kepengurusanUser->id)
                ->where('hari', $validated['hari'])
                ->where('kepengurusan_lab_id', $jadwalPiket->kepengurusan_lab_id)
                ->where('id', '!=', $jadwalPiket->id)
                ->first();

            if ($existing) {
                return response()->json(['message' => 'User sudah memiliki jadwal pada hari yang sama.'], 422);
            }

            $jadwalPiket->update([
                'kepengurusan_user_id' => $kepengurusanUser->id,
                'hari'                 => $validated['hari'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Jadwal piket berhasil diperbarui.',
                'lab_id' => $request->input('lab_id'),
                'tahun_id' => $request->input('tahun_id'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating jadwal piket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jadwal piket: ' . $e->getMessage()
            ], 500);
        }
```


Kode di atas menunjukkan bahwa controller membaca record jadwal lama dari model `JadwalPiket`, lalu memeriksa keberadaan jadwal lain di hari yang sama dengan mengecualikan ID jadwal yang sedang diubah. Setelah lolos, controller memperbarui record di model dan mengembalikan JSON sukses yang dibaca langsung oleh halaman React untuk memperbarui tampilan tanpa reload.

---

## 5.1.1.6 Modul Kuesioner

Modul Kuesioner dipakai untuk membuat dan mendistribusikan kuesioner kepada anggota lab berdasarkan role mereka. Kuesioner bisa bertipe `internal` (dengan pertanyaan yang dibuat langsung di sistem) atau `eksternal` (hanya link ke Google Form atau platform lain).

Di backend, proses ini ditangani oleh `KuesionerController`. Method yang digunakan adalah `store()`, untuk menangani pembuatan kuesioner beserta pertanyaan, opsi jawaban, dan target role-nya dalam satu proses. Semua ini dibungkus dalam satu transaksi database sehingga kalau salah satu langkah gagal, tidak ada data yang tersimpan setengah.

Route modul ini dipisah berdasarkan aktor yang menggunakannya. Pengelola memakai route `resource` untuk CRUD, sedangkan responden memakai route `submit` untuk mengisi jawaban. Implementasi route modul kuesioner dapat dilihat pada Gambar 5.x.

```788:818:routes/web.php
Route::resource("kuesioner", KuesionerController::class)
    ->middleware("active.kepengurusan:kuesioner");
Route::post("/kuesioner/{kuesioner}/toggle-status", [
    KuesionerController::class,
    "toggleStatus",
])->name("kuesioner.toggleStatus");
Route::post("/kuesioner/{kuesioner}/submit", [
    ResponKuesionerController::class,
    "submit",
])->name("kuesioner.submit");
```

Request CRUD dari pengelola diterima oleh `KuesionerController`, sedangkan request pengisian jawaban dari responden diterima oleh `ResponKuesionerController` dengan method `submit()`. Aksi `toggle-status` mengirim POST request ke route khusus, lalu controller hanya memperbarui satu field status di model `Kuesioner` tanpa perlu membuka form edit.

Ketika pengelola mengisi form kuesioner baru dan menyimpannya, data dikirim ke route `kuesioner.store` lalu diterima oleh `KuesionerController`. Method yang digunakan adalah `store()`. Bagian awal implementasi proses penyimpanan kuesioner dapat dilihat pada Gambar 5.x.

```94:160:app/Http/Controllers/KuesionerController.php
public function store(Request $request)
{
    $validated = $request->validate([
        "judul" => "required|string|max:255",
        "deskripsi" => "nullable|string",
        "tipe" => "required|in:internal,eksternal",
        "link_eksternal" => "nullable|url|required_if:tipe,eksternal",
        "tanggal_mulai" => "required|date",
        "tanggal_selesai" => "required|date|after_or_equal:tanggal_mulai",
        "targets" => "required|array|min:1",
    ]);

    DB::beginTransaction();
    try {
        $kuesioner = Kuesioner::create([
            "judul" => $validated["judul"],
            "deskripsi" => $validated["deskripsi"],
            "tipe" => $validated["tipe"],
            "link_eksternal" => $validated["link_eksternal"],
            "tanggal_mulai" => $validated["tanggal_mulai"],
            "tanggal_selesai" => $validated["tanggal_selesai"],
            "dibuat_oleh" => auth()->id(),
        ]);
```

Setelah validasi lolos, controller menyimpan data utama ke model `Kuesioner`, lalu jika kuesioner bertipe internal controller menyimpan setiap pertanyaan ke model `PertanyaanKuesioner` beserta opsi-opsinya ke model `OpsiPertanyaan`. Target role yang bisa mengisi kuesioner juga disimpan ke model `TargetKuesioner`. Semua ini dilakukan dalam satu transaksi.

Di halaman `Kuesioner/Index.jsx`, data kuesioner diterima dari controller sebagai props. Ketika pengelola mengubah filter pencarian, halaman mengirim request baru ke route `kuesioner.index` dengan parameter filter yang diperbarui, lalu controller mengambil ulang data dari model sesuai filter tersebut dan mengembalikannya ke halaman. Implementasi komponen filter halaman kuesioner dapat dilihat pada Gambar 5.x.

```48:83:resources/js/Pages/Kuesioner/Index.jsx
const applyFilters = (overrides = {}) => {
    router.get(
        route("kuesioner.index"),
        {
            search,
            tipe: filterTipe,
            status: filterStatus,
            per_page: perPage,
            ...overrides,
        },
        { preserveScroll: true, preserveState: true, replace: true },
    );
};

const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
        applyFilters({ search: val });
    }, 450);
};
```

Implementasi lengkap proses penyimpanan dari controller menerima request, memvalidasi data, menyimpan ke beberapa model sekaligus dalam satu transaksi, hingga mengembalikan redirect ke halaman, dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/KuesionerController.php (baris 94-165)
    public function store(Request $request)
    {
        $validated = $request->validate([
            "judul" => "required|string|max:255",
            "deskripsi" => "nullable|string",
            "tipe" => "required|in:internal,eksternal",
            "link_eksternal" => "nullable|url|required_if:tipe,eksternal",
            "tanggal_mulai" => "required|date",
            "tanggal_selesai" => "required|date|after_or_equal:tanggal_mulai",
            "is_active" => "boolean",
            "is_mandatory" => "boolean",
            "pertanyaan" => "nullable|array",
            "pertanyaan.*.pertanyaan" => "required_if:tipe,internal|string",
            "pertanyaan.*.tipe_pertanyaan" =>
                "required_if:tipe,internal|in:text,textarea,radio,checkbox,scale",
            "targets" => "required|array|min:1",
        ]);

        DB::beginTransaction();
        try {
            $kuesioner = Kuesioner::create([
                "judul" => $validated["judul"],
                "deskripsi" => $validated["deskripsi"],
                "tipe" => $validated["tipe"],
                "link_eksternal" => $validated["link_eksternal"],
                "tanggal_mulai" => $validated["tanggal_mulai"],
                "tanggal_selesai" => $validated["tanggal_selesai"],
                "is_active" => $validated["is_active"] ?? true,
                "is_mandatory" => $validated["is_mandatory"] ?? false,
                "dibuat_oleh" => auth()->id(),
            ]);

            if ($request->tipe === "internal" && $request->has("pertanyaan")) {
                foreach ($request->pertanyaan as $index => $q) {
                    $pertanyaan = PertanyaanKuesioner::create([
                        "kuesioner_id" => $kuesioner->id,
                        "pertanyaan" => $q["pertanyaan"],
                        "tipe_pertanyaan" => $q["tipe_pertanyaan"],
                        "wajib_diisi" => $q["wajib_diisi"] ?? false,
                        "urutan" => $index + 1,
                    ]);

                    if (!empty($q["opsi"]) && is_array($q["opsi"])) {
                        foreach ($q["opsi"] as $opsiIndex => $opsiTeks) {
                            \App\Models\OpsiPertanyaan::create([
                                "pertanyaan_id" => $pertanyaan->id,
                                "teks" => $opsiTeks,
                                "urutan" => $opsiIndex + 1,
                            ]);
                        }
                    }
                }
            }

            if ($request->has("targets") && is_array($request->targets)) {
                foreach ($request->targets as $roleName) {
                    $role = Role::where("name", $roleName)->first();
                    if ($role) {
                        \App\Models\TargetKuesioner::create([
                            "kuesioner_id" => $kuesioner->id,
                            "role_id" => $role->id,
                        ]);
                    }
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return redirect()
```


Kode di atas memperlihatkan bahwa dalam satu request, controller menyimpan data ke empat model berbeda yaitu `Kuesioner`, `PertanyaanKuesioner`, `OpsiPertanyaan`, dan `TargetKuesioner` secara berurutan dalam satu transaksi. Jika ada yang gagal, semua perubahan dibatalkan dan tidak ada data setengah jadi di database.

Saat responden mengirim jawaban, request masuk ke route `kuesioner.submit` dan diterima oleh `ResponKuesionerController`. Method yang digunakan adalah `submit()`. Controller pertama membaca model `ResponKuesioner` untuk memeriksa apakah pengguna sudah pernah mengisi. Jika sudah, controller mengembalikan error ke halaman. Jika belum, controller menyimpan data induk ke model `ResponKuesioner` lalu menyimpan setiap jawaban ke model `JawabanKuesioner` dalam satu transaksi, sebelum mengembalikan redirect ke dashboard. Implementasi controller penerimaan jawaban kuesioner ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/ResponKuesionerController.php (baris 14-55)
    public function store(Request $request, Kuesioner $kuesioner)
    {

        $existing = ResponKuesioner::where('kuesioner_id', $kuesioner->id)
            ->where('user_id', auth()->id())
            ->first();

        if ($existing) {
             return redirect()->back()->with('error', 'Anda sudah mengisi kuesioner ini.');
        }

        $request->validate([
            'jawaban' => 'required|array',
            'jawaban.*.pertanyaan_id' => 'required|exists:pertanyaan_kuesioner,id',
            'jawaban.*.jawaban' => 'required',
        ]);

        DB::transaction(function () use ($request, $kuesioner) {
            $respon = ResponKuesioner::create([
                'kuesioner_id' => $kuesioner->id,
                'user_id' => auth()->id(),
                'tanggal_submit' => now(),
            ]);

            foreach ($request->jawaban as $answer) {

                $value = is_array($answer['jawaban']) ? json_encode($answer['jawaban']) : $answer['jawaban'];

                JawabanKuesioner::create([
                    'respon_id' => $respon->id,
                    'pertanyaan_id' => $answer['pertanyaan_id'],
                    'jawaban' => $value,
                ]);
            }
        });

        return redirect()->route('dashboard')->with('success', 'Terima kasih telah mengisi kuesioner.');
    }
}
```


Kode di atas memperlihatkan bahwa controller menyesuaikan format penyimpanan jawaban berdasarkan tipenya: jawaban pilihan ganda yang berupa array di-encode ke JSON sebelum disimpan ke model `JawabanKuesioner`, sementara teks biasa disimpan langsung. Formatnya konsisten sehingga saat rekap jawaban dibuka, controller bisa membaca data dari model dengan benar dan menampilkannya ke halaman.

---

## 5.1.1.7 Modul Auth

Modul Auth menangani proses autentikasi pengguna meliputi login, registrasi, reset password, verifikasi email, dan logout. Meskipun sebagian besar kodenya merupakan bawaan Laravel Breeze, ada beberapa penyesuaian yang dilakukan terutama pada logika redirect setelah login dan mekanisme rate limiting.

Route Auth dipisah berdasarkan status autentikasi pengguna. Endpoint untuk login, registrasi, dan reset password ada di grup `guest` yang artinya hanya bisa diakses kalau pengguna belum login. Endpoint untuk logout dan verifikasi email ada di grup `auth` yang hanya bisa diakses kalau pengguna sudah login. Pemisahan ini mencegah pengguna yang sudah login membuka halaman login lagi, atau sebaliknya. Implementasi route auth dapat dilihat pada Gambar 5.x.

```14:35:routes/auth.php
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});
```

Request ke halaman login diterima oleh `AuthenticatedSessionController`. Method yang digunakan adalah `create()`, untuk menampilkan form login. Ketika form disubmit, POST request dikirim ke route yang sama lalu diproses oleh controller yang sama dengan method `store()` untuk autentikasi. Pengguna yang sudah login dan mencoba membuka route `guest` akan langsung dialihkan oleh middleware sebelum request sampai ke controller. Implementasi controller yang menangani proses login dan logout beserta redirect berbasis role dapat dilihat pada Gambar 5.x.

```26:52:app/Http/Controllers/Auth/AuthenticatedSessionController.php
public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();

    $request->session()->regenerate();

    $user = auth()->user();

    $staffRoles = ['admin', 'superadmin', 'kadep', 'kalab', 'asisten', 'dosen'];
    if ($user->hasRole('praktikan') && !$user->hasAnyRole($staffRoles)) {
        return redirect()->intended(route('praktikan.daftar-tugas', absolute: false));
    }

    return redirect()->intended(route('dashboard', absolute: false));
}

public function destroy(Request $request): RedirectResponse
{
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/');
}
```

Dari kode di atas terlihat bahwa setelah `LoginRequest@authenticate` berhasil memverifikasi kredensial ke model `User`, controller membaca role pengguna dan memutuskan ke mana redirect dikirim. Praktikan diarahkan ke halaman daftar tugas, sedangkan role lain diarahkan ke dashboard. Ketika logout, controller menghapus sesi dan mengembalikan redirect ke halaman utama.

Di sisi halaman, `Login.jsx` menggunakan form helper untuk mengirim data ke route `login`. Setiap kali form disubmit baik berhasil maupun gagal, field password dikosongkan otomatis via callback `onFinish` agar pengguna tidak perlu menghapus manual. Implementasi komponen form login dapat dilihat pada Gambar 5.x.

```7:19:resources/js/Pages/Auth/Login.jsx
const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false,
});

const submit = (e) => {
    e.preventDefault();

    post(route("login"), {
        onFinish: () => reset("password"),
    });
};
```

Sebelum controller memproses login, `LoginRequest` yang dikirim halaman terlebih dahulu melewati mekanisme rate limiting. Jika percobaan dari kombinasi email dan IP yang sama sudah melebihi batas, request ditolak langsung dan error dikirimkan kembali ke halaman tanpa menyentuh model `User` sama sekali. Jika masih di bawah batas, request dilanjutkan dan Laravel mencoba mencocokkan kredensial ke database. Jika gagal, hitungan percobaan bertambah. Jika berhasil, hitungan direset. Implementasi mekanisme rate limiting ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Requests/Auth/LoginRequest.php (baris 40-85)
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
```


Dari kode di atas terlihat bahwa `throttleKey` dibentuk dari email dan IP pengguna sehingga percobaan dari perangkat berbeda tidak saling memengaruhi. Mekanisme ini berjalan di layer request sebelum request mencapai controller, sehingga controller hanya menangani request yang memang layak diproses.

Proses registrasi lebih sederhana. Ketika pengguna mengisi form dan menyimpan, POST request dikirim ke route `register` dan diterima oleh `RegisteredUserController`. Method yang digunakan adalah `store()`. Controller memvalidasi input, menyimpan data pengguna baru ke model `User` dengan password yang sudah di-hash, lalu langsung memanggil `Auth::login` untuk masuk otomatis sebelum mengembalikan redirect ke dashboard. Implementasi controller registrasi ini dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/Auth/RegisteredUserController.php (baris 24-44)

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
```


Untuk proses lupa password, pengguna meminta tautan reset via email melalui route `password.email` yang diterima `PasswordResetLinkController`. Setelah mengklik tautan di email, pengguna diarahkan ke halaman reset password dan mengisi password baru. Ketika form dikirim, POST request masuk ke route `password.store` lalu diterima oleh `NewPasswordController`. Method yang digunakan adalah `store()`. Implementasi proses penyimpanan password baru dapat dilihat pada Gambar 5.x.

```php
// app/Http/Controllers/Auth/NewPasswordController.php (baris 28-53)

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('status', __($status));
        }

        throw ValidationException::withMessages([
```


Kode di atas memperlihatkan bahwa controller memvalidasi token reset bersama email dan password baru, kemudian memanggil `Password::reset` yang secara internal membaca token yang tersimpan di database untuk mencocokkannya. Jika cocok, password di model `User` diperbarui dan `remember_token` direset sehingga semua sesi lama di perangkat lain otomatis tidak berlaku. Jika token tidak cocok atau sudah kadaluarsa, controller mengembalikan error ke halaman.

Secara keseluruhan, modul Auth menyediakan fondasi keamanan yang melindungi seluruh sistem. Percobaan login berlebihan dicegah, password disimpan dalam bentuk terenkripsi, tautan reset hanya bisa dipakai satu kali, dan mengganti password otomatis membersihkan semua sesi lama.

---

## 5.1.1.8 Kesimpulan Pengodean Program

Dari ketujuh modul yang sudah dijelaskan, ada pola aliran data yang dipakai secara konsisten. Setiap request dari pengguna selalu masuk ke route terlebih dahulu, lalu diteruskan ke controller yang sesuai. Controller membaca atau menulis data ke database melalui model Eloquent, lalu mengirimkan hasilnya ke halaman sebagai data tampilan. Ketika pengguna melakukan aksi di halaman seperti mengisi form atau mengklik tombol, data dikirim kembali ke route yang sesuai dan proses berulang dari awal.

Pola ini membuat alur data di setiap modul mudah ditelusuri. Jika ada data yang tidak sesuai di halaman, penelusurannya dimulai dari request yang dikirim, lalu ke controller untuk melihat bagaimana data dibentuk, lalu ke model untuk melihat bagaimana data diambil dari database. Sebaliknya jika ada data yang tidak tersimpan dengan benar, penelusurannya dimulai dari controller yang menerima request sampai ke model yang menulis ke database.

Setiap modul juga punya karakteristiknya masing-masing. Modul Inventaris dan Praktikum kompleks karena data operasionalnya banyak dan saling terkait. Modul Kepengurusan penting karena menjadi sumber konteks bagi modul lain. Modul Keuangan dan Piket dekat dengan kebutuhan harian laboratorium. Modul Kuesioner fleksibel karena mendukung dua tipe sekaligus. Modul Auth menjadi fondasi keamanan yang mengikat semuanya.