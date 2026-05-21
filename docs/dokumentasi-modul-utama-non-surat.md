# 5.1.1 Pengodean Program

Pada subbab ini dijelaskan implementasi pengodean pada tujuh modul utama SILAB, yaitu Inventaris, Praktikum, Kegiatan/Proker, Keuangan, Piket, Kuesioner, dan Auth. Penjelasan difokuskan pada representasi kode yang paling penting agar pembaca dapat memahami bagaimana alur bisnis diterjemahkan menjadi alur teknis di sisi backend dan frontend. Pendekatan implementasi pada sistem ini mengikuti pola arsitektur Laravel + Inertia.js + React, sehingga alur data bergerak dari request pengguna, diproses di controller, dikaitkan ke model basis data, lalu dikirim kembali ke antarmuka pengguna dalam bentuk props dan state yang dapat diolah secara reaktif.

Secara umum, setiap modul memiliki struktur pengodean yang konsisten. Pada sisi backend, controller bertanggung jawab menangani validasi parameter, seleksi data berbasis konteks laboratorium/kepengurusan, pengelolaan aturan bisnis, dan pembentukan response halaman. Pada sisi model, Eloquent digunakan untuk mendefinisikan entitas inti serta relasi antartabel agar pengambilan data dapat dilakukan secara efisien dan terstruktur. Pada sisi frontend, halaman React memanfaatkan state lokal, `useForm`, dan navigasi Inertia (`router.get`, `router.post`, `router.put`, `router.delete`) untuk membangun interaksi pengguna yang responsif tanpa reload penuh.

---

## 5.1.1.1 Modul Inventaris

Modul Inventaris berfungsi sebagai pusat pengelolaan aset laboratorium, mulai dari pencatatan aset, pencarian dan filter, pemantauan status peminjaman, hingga keterkaitan aset dengan proses pengadaan. Dari sudut pandang pengodean, modul ini penting karena memperlihatkan integrasi data master (`DetailAset`, `KategoriAset`) dengan data operasional (`PeminjamanAset`, `WishlistAset`), sehingga halaman inventaris tidak hanya menampilkan daftar barang, tetapi juga konteks riwayat dan status terkini aset.

Pada sisi backend, endpoint daftar inventaris diproses melalui `InventarisController@index`. Controller ini membaca parameter `lab_id`, `search`, `kategori_id`, dan `perPage`, kemudian menyusun query dinamis menggunakan Eloquent. Proses query dilakukan bertahap: pertama memuat relasi penting (`kategoriAset`, `peminjamanAktif`, `wishlistAset.permohonanAset`), kemudian menerapkan filter laboratorium dan kategori, lalu menjalankan pencarian berbasis beberapa kolom (`kode_barang`, `nama`, dan `nama kategori`). Pendekatan ini menunjukkan implementasi server-side filtering yang kuat dan mudah diperluas.

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

Setelah query utama terbentuk, controller menyiapkan data pendukung seperti daftar kategori dan daftar `approvedWishlist`, lalu merender halaman `Inventaris/Index`. Dengan cara ini, frontend menerima semua data yang dibutuhkan dalam satu alur request, sehingga tidak memerlukan banyak pemanggilan endpoint terpisah untuk membangun tampilan halaman.

Pada sisi model, `DetailAset` menjadi entitas inti. Model ini memuat definisi atribut penting aset (kategori, lab, nama, kode, kondisi, status, sumber perolehan, dan relasi ke wishlist), termasuk konversi tipe data (`casts`) untuk tanggal dan nilai perolehan. Relasi-relasi pada model memungkinkan proses eager loading yang konsisten dari controller.

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

Pada sisi frontend, halaman `Inventaris/Index.jsx` mengatur hak akses, state pencarian, state filter kategori, pagination, seleksi data, dan aksi massal. Penggunaan `debounce` pada pencarian menjadi bagian penting untuk menjaga performa, karena request tidak dikirim di setiap ketikan secara mentah, melainkan ditunda beberapa milidetik agar lebih efisien.

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

Secara keseluruhan, implementasi modul Inventaris menunjukkan kombinasi yang baik antara query server-side yang kaya konteks, model relasional yang jelas, dan UI operasional yang langsung dapat digunakan untuk aktivitas harian laboratorium.

Selain pengelolaan daftar aset, modul ini juga memiliki fitur pencatatan detail tiap unit aset beserta pembuatan QR Code otomatis yang diimplementasikan di `DetailInventarisController`. Ketika sebuah aset baru disimpan, controller tidak hanya menyimpan data ke tabel `aset`, tetapi juga secara otomatis membuat kode QR menggunakan library `SimpleSoftwareIO/QrCode` yang mengarah ke URL publik aset. Path QR kemudian disimpan kembali ke record. Setelah QR berhasil dibuat, sistem langsung mencatat riwayat kondisi awal di tabel `riwayat_kondisi_aset` sebagai entri pertama dengan `kondisi_sebelum` bernilai `null`. Ini memastikan setiap aset langsung memiliki jejak audit lengkap sejak hari pertama keberadaannya.

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


Pada proses pembaruan aset, controller menyimpan nilai kondisi lama sebelum melakukan `update`. Setelah update selesai, controller membandingkan apakah kondisi berubah. Jika berubah, entri baru di tabel `riwayat_kondisi_aset` dibuat dengan mencantumkan kondisi sebelum dan sesudah perubahan, beserta catatan dari pengguna. Pola tracking perubahan otomatis ini sangat berguna untuk audit karena pengelola dapat melacak riwayat kondisi setiap aset tanpa perlu mencatat secara manual.

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


Modul Inventaris juga mengelola transaksi peminjaman aset melalui `PeminjamanAsetController`. Proses ini menggunakan `DB::transaction` untuk memastikan bahwa pencatatan peminjaman dan perubahan status aset terjadi secara atomik. Sebelum transaksi dimulai, controller melakukan validasi berlapis: (1) semua aset harus ada di database, (2) tidak ada aset yang berstatus `dipinjam` oleh pihak lain, dan (3) tidak ada aset berstatus `hilang`. Jika salah satu kondisi gagal, sistem langsung mengembalikan error spesifik. Jika semua lolos, pembuatan record peminjaman, pencatatan item per-aset, dan perubahan status aset dijalankan dalam satu blok atomik.

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


Pola `DB::transaction` ini menjamin bahwa tidak ada kondisi di mana transaksi peminjaman tersimpan tanpa perubahan status aset — ini adalah jaminan konsistensi data yang fundamental dalam sistem manajemen aset.

---

## 5.1.1.2 Modul Praktikum

Modul Praktikum merepresentasikan alur akademik yang kompleks: data praktikum, pembagian kelas dan sub-kelas, keterkaitan asisten, pertemuan, modul pembelajaran, dan tugas praktikum. Modul ini menjadi contoh penting karena memadukan manajemen data akademik dengan kontrol role/permission yang ketat.

Pada backend, `PraktikumController@index` menangani sinkronisasi konteks `lab_id`, `tahun_id`, dan `kepengurusan_lab_id`. Logika ini krusial agar data praktikum yang ditampilkan selalu mengikuti periode kepengurusan yang benar. Setelah konteks valid ditemukan, controller mengambil data praktikum dengan eager loading (`jadwalPraktikum`, `parentKelas.subKelas`, `mataKuliah`) dan menghitung jumlah praktikan per praktikum.

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

Di model `Praktikum`, relasi `hasMany`, `hasManyThrough`, dan `belongsToMany` memperlihatkan bahwa satu entitas praktikum menjadi root untuk banyak data turunan. Implementasi ini penting untuk konsistensi data lintas fitur (kelas, tugas, aslab, pertemuan).

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

Pada frontend, halaman `Praktikum.jsx` menggabungkan kontrol permission dan manajemen state untuk banyak skenario: create praktikum, edit, delete, tambah sub-kelas, dan aksi lanjutan lain. Ini menunjukkan implementasi antarmuka administratif yang cukup padat namun tetap modular.

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

Dengan struktur tersebut, modul Praktikum berhasil mengakomodasi kebutuhan akademik yang berlapis tanpa mengorbankan keterbacaan alur data.

Selain mengelola data induk praktikum, modul ini juga memiliki sub-controller yang menangani pertemuan praktikum. `PertemuanPraktikumController` bertugas mengambil daftar pertemuan berdasarkan kelas yang relevan menggunakan `KelasScopeResolver` — sebuah helper yang menentukan kelas mana saja yang boleh diakses pengguna yang sedang login. Logika ini penting untuk memastikan asisten hanya melihat pertemuan pada kelas yang menjadi tanggung jawabnya. Pada proses penyimpanan pertemuan, controller memeriksa apakah kelas yang dipilih masih memiliki sub-kelas. Jika ya, pembuatan pertemuan ditolak karena harus dilakukan di level sub-kelas yang lebih spesifik.

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


Modul Praktikum juga mengelola tugas melalui `TugasPraktikumController`. Hal menarik di sini adalah adanya pemeriksaan otorisasi ganda: pengguna harus memiliki role yang tepat (admin, kadep) **atau** harus merupakan aslab yang ditugaskan untuk praktikum tersebut via method `canManagePraktikum` di model `User`. Jika tidak memenuhi syarat, request langsung ditolak dengan HTTP 403. Ketika menyimpan tugas baru, controller juga mengirim notifikasi ke praktikan yang terdaftar di kelas terkait melalui `WhatsAppService`. Deadline dikonversi dari format datetime-local HTML ke format database menggunakan Carbon dengan timezone yang dikonfigurasi, memastikan tidak ada selisih waktu antara input pengguna dan data tersimpan.

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


Aspek penting dari cuplikan di atas adalah konversi format deadline. Karena input dari frontend menggunakan format `Y-m-d\TH:i`, controller mengonversinya ke format database `Y-m-d H:i:s` menggunakan Carbon. Ini memastikan tidak ada selisih waktu yang dapat menyebabkan praktikan dianggap terlambat mengumpulkan tugas padahal sebenarnya tepat waktu.

---

## 5.1.1.3 Modul Kegiatan/Proker

Modul Kegiatan/Proker berperan dalam pengelolaan program kerja organisasi, mulai dari perencanaan, pengajuan, persetujuan, evaluasi, hingga dokumentasi kegiatan. Secara pengodean, modul ini menonjol karena memadukan data kuantitatif (parameter, bobot, capaian) dan data naratif (kendala, solusi, saran) dalam satu siklus kerja.

Pada backend, `ProkerController@index` menyusun query yang mendukung pencarian, filter struktur, filter status pengajuan, dan filter status progres. Selain itu, controller menyiapkan ringkasan data (summary) untuk menampilkan indikator cepat pada halaman utama.

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

Model `Proker` menegaskan posisi proker sebagai pusat relasi ke parameter, dokumentasi, PJ, dan kegiatan. Aksesornya (`total_bobot`, `persentase_capaian`) memudahkan pembentukan indikator progres tanpa harus menulis ulang rumus di banyak tempat.

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

Pada frontend, halaman `Proker/Show.jsx` menangani aksi bisnis penting seperti pengajuan proker dan persetujuan proker. Mekanisme ini memperlihatkan implementasi workflow approval secara eksplisit pada level UI.

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

Implementasi ini menunjukkan bahwa modul Kegiatan/Proker bukan sekadar pencatatan kegiatan, tetapi platform manajemen siklus program kerja secara menyeluruh.

Untuk memahami siklus lengkap proker, penting melihat bagaimana `ProkerController` menangani pembuatan dan perubahan status. Pada method `store`, validasi memastikan proker terhubung ke lab, kepengurusan, dan struktur yang valid. Status pengajuan awal selalu diset ke `draft` secara otomatis oleh sistem — bukan pengguna. Ini mencegah proker langsung masuk alur persetujuan sebelum siap. Penanggung jawab (PJ) proker juga dapat ditugaskan langsung saat pembuatan, dengan validasi bahwa PJ harus terdaftar sebagai anggota aktif kepengurusan lab yang sama.

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


Alur persetujuan proker diimplementasikan melalui dua method terpisah yang mencerminkan dua peran berbeda. Method `ajukan` digunakan oleh pengaju proker (misalnya Kalab atau anggota divisi) untuk mengubah status dari `draft` ke `diajukan`. Validasi menggunakan `abort_if` memastikan hanya proker berstatus draft yang bisa diajukan. Method `approve` kemudian digunakan oleh pemberi persetujuan (Kadep) untuk menerima atau menolak. Jika disetujui, kedua field `status_pengajuan` dan `status` operasional diperbarui sekaligus. Jika ditolak, catatan penolakan ditambahkan ke field `keterangan` proker dengan format terstruktur.

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


Pada method `show`, controller menyiapkan halaman detail proker dengan eager loading relasi yang dalam: struktur, kepengurusan, parameter, PJ, dan daftar kegiatan. Aksesor model seperti `persentase_capaian` dan `total_bobot` di-append ke output proker agar frontend mendapatkan indikator progres yang sudah dikalkulasi. Controller juga membangun array `\$can` berisi hak akses spesifik pengguna terhadap proker tersebut dan mengirimkannya ke frontend. Pola ini membuat otorisasi transparan di sisi React — frontend tidak perlu menebak permission, cukup membaca dari objek `can`.

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


Pengiriman array `\$can` ke Inertia props adalah pola yang sangat berguna: frontend dapat menampilkan atau menyembunyikan tombol aksi (Edit, Ajukan, Approve, Delete) berdasarkan nilai boolean dalam objek tersebut, tanpa logika duplikasi di sisi React.

---

## 5.1.1.4 Modul Keuangan

Modul Keuangan mengelola transaksi pemasukan dan pengeluaran, lalu membentuk saldo sebagai indikator kondisi kas. Dari sisi pengodean, modul ini penting karena menggabungkan data historis transaksi dengan kalkulasi agregat pada periode kepengurusan tertentu.

Di backend, `RiwayatKeuanganController@index` membangun dua query terpisah (`PemasukanKeuangan` dan `PengeluaranKeuangan`) lalu memilih alur berdasarkan filter `jenis`. Setelah itu sistem menghitung total pemasukan, total pengeluaran, dan saldo.

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

Pada frontend, `RiwayatKeuangan.jsx` menampilkan filter pencarian, kontrol jumlah data per halaman, dan kontrol permission untuk create/update/delete transaksi. Penggunaan debounce pada pencarian membantu menjaga efisiensi request.

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

Modul Keuangan ini memperlihatkan alur pencatatan dan monitoring kas yang relatif lengkap untuk kebutuhan operasional dan pelaporan.

Pada proses penyimpanan transaksi baru, `RiwayatKeuanganController@store` memiliki logika yang jauh lebih kompleks dari sekadar insert data. Method ini menangani tiga kondisi berbeda: transaksi biasa, transaksi yang merupakan pembayaran uang kas (dengan validasi nominal dan jenis pembayaran), dan bukti transaksi dalam format Base64 dari kamera/clipboard. Untuk transaksi uang kas, sistem mencari nominal kas aktif, memvalidasi kecukupan nominal bayar, dan meminta pengguna menentukan jenis pembayaran jika nominal melebihi standar kas. Sistem menggunakan dua tabel terpisah (`pemasukan_keuangan` dan `pengeluaran_keuangan`) untuk jenis transaksi berbeda, membuat query agregat lebih efisien.

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


Dua keputusan desain yang menarik pada kode di atas: pertama, penggunaan dua tabel terpisah untuk pemasukan dan pengeluaran — ini lebih efisien daripada satu tabel dengan kolom `jenis` karena query `SUM` tidak perlu filter tambahan. Kedua, bukti transaksi diproses dari format Base64 (bukan file upload biasa) karena frontend dapat mengirimkan gambar yang ditangkap langsung dari kamera perangkat atau clipboard. Sistem mengonversi Base64 ke file fisik di storage dan menyimpan path-nya ke database.

---

## 5.1.1.5 Modul Piket

Modul Piket dipakai untuk mengatur jadwal tugas asisten per hari kerja. Nilai penting modul ini ada pada kemampuannya menjaga konsistensi jadwal berdasarkan kepengurusan aktif dan mencegah duplikasi assignment.

Pada backend, controller mengambil data jadwal lalu mengelompokkan hasilnya per hari. Pengelompokan ini membuat data lebih mudah dirender dalam format mingguan di frontend.

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

Pada frontend, halaman `JadwalPiket.jsx` memfasilitasi create/edit/delete jadwal per hari, dengan state modal dan form yang terpisah. Struktur ini membuat alur interaksi pengguna tetap jelas walaupun skenario aksi cukup banyak.

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

Secara teknis, modul Piket menjadi fondasi penting untuk menjaga kontinuitas operasional laboratorium pada level harian.

Pada proses penyimpanan jadwal piket, `JadwalPiketController@store` menerapkan validasi berlapis yang memastikan konsistensi data. Pertama, sistem memverifikasi bahwa pengguna yang akan dijadwalkan adalah asisten aktif dalam kepengurusan laboratorium yang bersangkutan. Verifikasi dilakukan dengan menelusuri relasi `kepengurusanUser` ke `struktur.defaultRole` dan memastikan nama role mengandung kata `asisten`. Ini memastikan bahwa hanya asisten yang dapat dijadwalkan piket, bukan role lain seperti kadep atau kalab. Jika pengguna bukan asisten, mereka dicatat di array `\$skipped` dan diabaikan tanpa menghentikan proses keseluruhan untuk user lainnya.

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


Desain loop per `user_id` di atas memberikan fleksibilitas untuk mendaftarkan beberapa asisten sekaligus dalam satu request. Setiap user diproses independen: yang memenuhi syarat langsung dijadwalkan, yang sudah ada atau tidak memenuhi syarat dicatat di `\$skipped`. Di akhir, sistem melaporkan berapa yang berhasil dan apa alasan yang dilewati, memberikan feedback informatif ke pengguna. Pencegahan duplikasi dilakukan dengan query `where kepengurusan_user_id + hari + kepengurusan_lab_id` sebelum insert, memastikan satu asisten hanya memiliki satu jadwal per hari per kepengurusan.

Proses update jadwal piket juga memiliki logika serupa — controller memverifikasi ulang bahwa pengguna baru yang akan menggantikan jadwal adalah asisten yang terdaftar, dan memastikan tidak ada jadwal duplikat. Method `update` mengembalikan JSON response (bukan redirect), berbeda dengan `store` yang menggunakan redirect. Ini karena aksi update dilakukan via request asinkron di frontend, sementara create dilakukan via form submission yang mengikuti pola redirect-back Laravel.

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


Perbedaan response format antara `store` (redirect) dan `update` (JSON) mencerminkan UX yang berbeda: form tambah jadwal menggunakan full-page interaction, sementara edit jadwal dilakukan inline langsung di tabel tanpa reload halaman.

---

## 5.1.1.6 Modul Kuesioner

Modul Kuesioner mendukung dua mode: internal (pertanyaan dikelola di sistem) dan eksternal (menggunakan tautan luar). Implementasinya menonjol pada validasi bertingkat, transaksi penyimpanan, dan pemisahan target responden.

Di backend, `KuesionerController@store` memvalidasi atribut utama kuesioner dan target role, kemudian menyimpan data dalam transaksi database agar konsistensi data tetap terjaga saat terjadi error di tengah proses.

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

Di frontend, halaman index menyediakan mekanisme pencarian dan filter status/tipe. Pemrosesan filter tetap dilakukan server-side agar data konsisten dengan hak akses dan kebutuhan pagination.

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

Dengan arsitektur ini, modul Kuesioner dapat melayani kebutuhan evaluasi internal organisasi secara fleksibel.

Untuk memahami kedalaman implementasi, penting melihat method `store` secara lengkap. Setelah data utama kuesioner tersimpan, controller melanjutkan ke dua proses: (1) menyimpan pertanyaan beserta opsi jawaban jika tipe kuesioner adalah `internal`, dan (2) menyimpan target role penerima kuesioner. Semua proses ini dibungkus dalam satu `DB::beginTransaction` sehingga jika salah satu gagal, seluruh data dikembalikan ke kondisi awal. Pembuatan satu kuesioner dapat menyentuh hingga empat tabel sekaligus: `kuesioner`, `pertanyaan_kuesioner`, `opsi_pertanyaan`, dan `target_kuesioner`.

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


Proses pengisian kuesioner oleh responden dikelola oleh `ResponKuesionerController`. Controller ini pertama memeriksa apakah pengguna sudah pernah mengisi kuesioner yang sama untuk mencegah duplikasi respon. Jika belum, jawaban disimpan dalam transaksi: setiap jawaban diproses dengan mempertimbangkan tipe data — jawaban bertipe array (misalnya checkbox multi-pilih) dikonversi ke JSON sebelum disimpan, sementara jawaban teks biasa langsung disimpan sebagai string.

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


Penggunaan `json_encode` untuk jawaban bertipe array adalah solusi yang cerdas karena kolom `jawaban` bertipe string. Jawaban multi-pilih dapat disimpan dan diurai kembali saat ditampilkan di halaman hasil. Pola ini menghindari kebutuhan membuat tabel terpisah hanya untuk menampung jawaban checkbox, sehingga struktur database tetap sederhana.

---

## 5.1.1.7 Modul Auth

Modul Auth merupakan gerbang utama keamanan aplikasi. Pada implementasinya, modul ini tidak hanya memverifikasi kredensial login, tetapi juga menentukan arah pengguna berdasarkan role setelah autentikasi berhasil.

Pada backend, `AuthenticatedSessionController@store` memanggil proses autentikasi, regenerasi session, lalu melakukan role-based redirect. Pengguna praktikan diarahkan ke halaman tugasnya, sedangkan role lain diarahkan ke dashboard umum.

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

Pada frontend, `Auth/Login.jsx` menangani state form login dan submit menggunakan `useForm`, sehingga validasi error dari backend dapat dipetakan langsung ke field input.

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

Implementasi ini memperlihatkan pengelolaan autentikasi yang ringkas namun aman, serta konsisten dengan kebutuhan akses berbasis peran dalam sistem.

Untuk memahami keamanan proses login lebih dalam, penting melihat `LoginRequest` — Form Request khusus yang menangani autentikasi dan rate limiting. Alih-alih menaruh logika autentikasi langsung di controller, Laravel memisahkannya ke kelas ini. Method `authenticate` memanggil `Auth::attempt` dan jika gagal langsung melempar `ValidationException`. Sebelum mencoba login, sistem memeriksa rate limit: jika pengguna sudah gagal lebih dari 5 kali, request ditolak dan sistem menginformasikan berapa detik/menit lagi pengguna bisa mencoba. Kunci throttle dibuat dari kombinasi email dan IP sehingga percobaan dari IP berbeda tidak saling memengaruhi hitungan.

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


Proses registrasi pengguna baru dikelola `RegisteredUserController`. Setelah data tervalidasi, controller membuat user baru dengan password yang di-hash menggunakan `Hash::make`, lalu memicu event `Registered`. Event ini dapat dipakai untuk mengirim email verifikasi jika fitur diaktifkan. Setelah itu, user langsung di-login secara otomatis.

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


Modul Auth juga mendukung alur reset password melalui `NewPasswordController`. Controller ini menerima token reset, email, dan password baru, kemudian menyerahkan proses ke `Password::reset`. Jika token valid, password di-hash ulang, `remember_token` diregenerasi untuk mencegah sesi lama masih bisa digunakan, dan event `PasswordReset` dipicu. Regenerasi `remember_token` adalah langkah keamanan penting: semua sesi aktif sebelumnya (termasuk yang mungkin sudah dibajak) akan otomatis tidak valid karena token di cookie tidak lagi cocok dengan yang tersimpan di database.

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


Secara keseluruhan, modul Auth mengimplementasikan lapisan keamanan berlapis: rate limiting untuk mencegah brute force, hashing password dengan `bcrypt`, token reset sekali pakai, dan invalidasi sesi lama saat password berubah. Lapisan-lapisan ini bekerja bersama untuk memastikan akses ke sistem selalu terlindungi.

---

## 5.1.1.8 Kesimpulan Pengodean Program

Berdasarkan implementasi tujuh modul utama, dapat disimpulkan bahwa pengodean SILAB dibangun dengan pola modular yang konsisten. Controller berfungsi sebagai pusat orkestrasi alur bisnis, model menangani relasi dan struktur data, sedangkan frontend berperan sebagai lapisan interaksi pengguna yang responsif. Konsistensi pola ini memberikan tiga manfaat utama: kemudahan pengembangan fitur lanjutan, kemudahan penelusuran alur data saat debugging, dan kemudahan penyusunan dokumentasi teknis untuk kebutuhan laporan akademik.

Dari sudut kualitas implementasi, modul Inventaris dan Praktikum menunjukkan kompleksitas data operasional, modul Kegiatan/Proker menunjukkan implementasi workflow organisasi, modul Keuangan dan Piket menunjukkan kedekatan dengan proses harian laboratorium, modul Kuesioner menunjukkan fleksibilitas evaluasi berbasis peran, dan modul Auth menunjukkan fondasi keamanan serta kontrol akses pengguna. Secara keseluruhan, pengodean sistem telah mengakomodasi kebutuhan fungsional utama SILAB secara terstruktur dan dapat dipelihara.