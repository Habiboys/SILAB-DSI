<?php
namespace App\Http\Controllers;
use App\Models\ModulPraktikum;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Support\KelasScopeResolver;

class ModulPraktikumController extends Controller
{

    public function studentIndex()
    {
        $user = auth()->user();

        $praktikan = \App\Models\Praktikan::where('user_id', $user->id)->first();

        $praktikumList = [];

        if ($praktikan) {

            $praktikumList = $praktikan->praktikums()
                ->get()
                ->map(function ($praktikum) {

                    $kelasId = $praktikum->pivot->kelas_id;
                    $kelasIds = [$kelasId];
                    $kelas = \App\Models\Kelas::find($kelasId);
                    if ($kelas && $kelas->parent_kelas_id) {
                        $kelasIds[] = $kelas->parent_kelas_id;
                    }

                    $modul = \App\Models\ModulPraktikum::whereHas('pertemuan', function ($q) use ($praktikum, $kelasIds) {
                            $q->whereHas('kelas', fn($q2) => $q2->where('praktikum_id', $praktikum->id));
                            if (!empty($kelasIds)) {
                                $q->where(function ($q2) use ($kelasIds) {
                                    $q2->whereIn('kelas_id', $kelasIds)->orWhereNull('kelas_id');
                                });
                            }
                        })
                        ->with('pertemuan')
                        ->orderBy('created_at', 'desc')
                        ->get();
                    $praktikum->setRelation('modulPraktikum', $modul);

                    return $praktikum;
                });
        }

        return Inertia::render('Student/ModulIndex', [
            'praktikumList' => $praktikumList
        ]);
    }

    public function studentPraktikumModul($praktikumId)
    {
        $user = auth()->user();

        $praktikan = \App\Models\Praktikan::where('user_id', $user->id)->firstOrFail();

        $praktikum = $praktikan->praktikums()
            ->where('praktikum.id', $praktikumId)
            ->firstOrFail();

        $kelasId = $praktikum->pivot->kelas_id;
        $kelasIds = array_filter([$kelasId]);
        $kelas = \App\Models\Kelas::find($kelasId);
        if ($kelas && $kelas->parent_kelas_id) {
            $kelasIds[] = $kelas->parent_kelas_id;
        }

        $modulPraktikum = \App\Models\ModulPraktikum::whereHas('pertemuan', function ($q) use ($praktikumId, $kelasIds) {
                $q->whereHas('kelas', fn($q2) => $q2->where('praktikum_id', $praktikumId));
                if (!empty($kelasIds)) {
                    $q->where(function ($q2) use ($kelasIds) {
                        $q2->whereIn('kelas_id', $kelasIds)->orWhereNull('kelas_id');
                    });
                }
            })
            ->with('pertemuan')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Student/ModulPraktikumDetail', [
            'praktikum' => [
                'id' => $praktikum->id,
                'mata_kuliah' => $praktikum->mata_kuliah,
                'semester' => $praktikum->semester,
                'periode' => $praktikum->periode,
            ],
            'modulPraktikum' => $modulPraktikum,
        ]);
    }

    public function index(Request $request, Praktikum $praktikum)
    {
        $praktikum->load(['kelas' => fn($q) => $q->where('status', 'aktif')->orderBy('nama_kelas')]);

        $requestedKelasId = $request->input('context_kelas_id', $request->input('kelas_id'));
        $kelasScopeIds = KelasScopeResolver::resolve($requestedKelasId);

        $query = ModulPraktikum::whereHas('pertemuan', function ($q) use ($praktikum) {
                $q->whereHas('kelas', function ($q2) use ($praktikum) {
                    $q2->where('praktikum_id', $praktikum->id);
                });
            })
            ->with(['pertemuan.kelas.parent'])
            ->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $query->where('judul', 'like', '%' . $request->search . '%');
        }

        if (!empty($kelasScopeIds)) {
            $query->whereHas('pertemuan', function ($q) use ($kelasScopeIds) {
                $q->whereIn('kelas_id', $kelasScopeIds);
            });
        }

        if ($request->has('pertemuan_id') && $request->pertemuan_id) {
            $query->where('pertemuan_id', $request->pertemuan_id);
        }

        $modulPraktikum = $query->get();

        $pertemuanListQuery = $praktikum->pertemuan();
        if (!empty($kelasScopeIds)) {
            $pertemuanListQuery->whereIn('kelas_id', $kelasScopeIds);
        }

        $pertemuanList = $pertemuanListQuery
            ->with('kelas.parent')
            ->orderBy('tanggal', 'asc')
            ->get()
            ->map(function ($pertemuan) {
                $pertemuan->formatted_tanggal = \Carbon\Carbon::parse($pertemuan->tanggal)->format('d M Y');
                return $pertemuan;
            });

        $kelas = $praktikum->kelas;

        $requestedKelasId = $request->input('context_kelas_id', $request->input('kelas_id'));
        $classContext = null;
        if ($requestedKelasId) {
            $classContext = $kelas->firstWhere('id', $requestedKelasId);
        }

        return Inertia::render('ModulPraktikum', [
            'praktikum' => $praktikum,
            'modulPraktikum' => $modulPraktikum,
            'pertemuanList' => $pertemuanList,
            'kelas' => $kelas,
            'filters' => $request->only(['search', 'kelas_id', 'pertemuan_id', 'context_kelas_id']),
            'classContext' => $classContext,
            'flash' => [
                'message' => session('message'),
                'error' => session('error')
            ]
        ]);
    }

    private function validateEnrollmentKelas(?string $kelasId): ?string
    {
        if (!$kelasId) return null;
        $hasSubKelas = \App\Models\Kelas::where('parent_kelas_id', $kelasId)->exists();
        if ($hasSubKelas) {
            return 'Pertemuan ini masih di kelas induk yang punya sub-kelas. Pilih pertemuan dari sub-kelas.';
        }
        return null;
    }
    public function store(Request $request, Praktikum $praktikum)
    {
        $request->validate([
            'pertemuan_id' => 'required|exists:pertemuan_praktikum,id',
            'judul' => 'required|string|max:255',
            'modul' => 'required|file|mimes:pdf|max:10240',
        ]);

        try {
            $pertemuan = \App\Models\PertemuanPraktikum::with('kelas')->findOrFail($request->pertemuan_id);
            if ($pertemuan->kelas_id && ($err = $this->validateEnrollmentKelas($pertemuan->kelas_id))) {
                return back()->withErrors(['pertemuan_id' => $err])->withInput();
            }
            $mataKuliah = $praktikum->mata_kuliah;

            $cleanMataKuliah = str_replace(' ', '_', $mataKuliah);
            $cleanJudul = str_replace(' ', '_', $request->judul);

            $cleanPertemuan = $pertemuan->id;

            $fileName = "{$cleanMataKuliah}_{$cleanPertemuan}_{$cleanJudul}." . $request->file('modul')->extension();

            $filePath = $request->file('modul')->storeAs('modul_praktikum', $fileName, 'public');

            $hash = null;
            if ($request->input('is_public', false)) {
                $hash = \Str::random(32);
            }

            ModulPraktikum::create([
                'pertemuan_id' => $pertemuan->id,
                'judul' => $request->judul,
                'modul' => $filePath,
                'is_public' => $request->input('is_public', false),
                'hash' => $hash,
            ]);

            return redirect()->back()->with('success', 'Modul praktikum berhasil ditambahkan.');

        } catch (\Exception $e) {
            return back()->with('error', 'Gagal upload file: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $praktikumId, $modulId)
    {
        $request->validate([
            'pertemuan_id' => 'required|exists:pertemuan_praktikum,id',
            'judul' => 'required|string|max:255',
            'modul' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $modulPraktikum = ModulPraktikum::findOrFail($modulId);
        $praktikum = Praktikum::findOrFail($praktikumId);
        $pertemuan = \App\Models\PertemuanPraktikum::with('kelas')->findOrFail($request->pertemuan_id);

        if ($pertemuan->kelas_id && ($err = $this->validateEnrollmentKelas($pertemuan->kelas_id))) {
            return back()->withErrors(['pertemuan_id' => $err])->withInput();
        }

        $pertemuanChanged = $modulPraktikum->pertemuan_id != $request->pertemuan_id;
        $judulChanged = $modulPraktikum->judul != $request->judul;

        $modulPraktikum->pertemuan_id = $request->pertemuan_id;
        $modulPraktikum->judul = $request->judul;

        $isPublic = $request->input('is_public', false);
        $modulPraktikum->is_public = $isPublic;

        if ($isPublic && !$modulPraktikum->hash) {
            $modulPraktikum->hash = \Str::random(32);
        } elseif (!$isPublic) {
            $modulPraktikum->hash = null;
        }

        $mataKuliah = $praktikum->mata_kuliah;

        $cleanMataKuliah = str_replace(' ', '_', $mataKuliah);
        $cleanPertemuan = $pertemuan->id;
        $cleanJudul = str_replace(' ', '_', $request->judul);

        $baseFileName = $cleanMataKuliah . '_' . $cleanPertemuan . '_' . $cleanJudul;

        if ($request->hasFile('modul')) {

            if ($modulPraktikum->modul) {
                Storage::disk('public')->delete($modulPraktikum->modul);
            }

            $extension = $request->file('modul')->extension();

            $fileName = $baseFileName . '.' . $extension;

            $filePath = $request->file('modul')->storeAs('modul_praktikum', $fileName, 'public');

            $modulPraktikum->modul = $filePath;
        }

        else if ($pertemuanChanged || $judulChanged) {
            if ($modulPraktikum->modul) {

                $oldPath = $modulPraktikum->modul;
                $extension = pathinfo(Storage::path('public/' . $oldPath), PATHINFO_EXTENSION);

                $newFileName = $baseFileName . '.' . $extension;
                $newFilePath = 'modul_praktikum/' . $newFileName;

                if (Storage::disk('public')->exists($oldPath)) {

                    Storage::disk('public')->copy($oldPath, $newFilePath);
                    Storage::disk('public')->delete($oldPath);

                    $modulPraktikum->modul = $newFilePath;
                }
            }
        }

        $modulPraktikum->save();

        return redirect()->route('praktikum.modul.index', $praktikumId)
            ->with('success', 'Modul praktikum berhasil diperbarui.');
    }

    public function destroy(Praktikum $praktikum, ModulPraktikum $modul)
    {

        if ($modul->modul) {
            $filePath = str_replace('/storage/', '', $modul->modul);
            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }
        }

        $modul->delete();

        return redirect()->route('praktikum.modul.index', $praktikum);
    }

public function view(Praktikum $praktikum, ModulPraktikum $modul)
{

    if (!$modul->modul) {
        abort(404, 'File tidak ditemukan');
    }

    $filePath = str_replace('/storage/', '', $modul->modul);

    if (!Storage::disk('public')->exists($filePath)) {
        abort(404, 'File tidak ditemukan');
    }

    $originalFilename = basename($modul->modul);

    $mimeType = Storage::disk('public')->mimeType($filePath);

    if ($mimeType === 'application/pdf') {
        $fileUrl = asset('storage/' . $filePath);

        return Inertia::render('PublicModulViewer', [
            'modul' => $modul,
            'praktikum' => $praktikum,
            'fileUrl' => $fileUrl,
            'isPdf' => true
        ]);
    }

    return response()->download(
        storage_path('app/public/' . $filePath),
        $originalFilename
    );
}


    public function toggleShareLink(Request $request, Praktikum $praktikum, ModulPraktikum $modul)
    {
        $isPublic = !$modul->is_public;

        $hash = null;
        if ($isPublic) {
            $hash = \Str::random(32);
        }

        $modul->update([
            'is_public' => $isPublic,
            'hash' => $hash
        ]);

        return back()->with([
            'success' => true,
            'is_public' => $isPublic,
            'hash' => $hash,
            'message' => $isPublic ? 'Link berhasil dibuka' : 'Link berhasil ditutup'
        ]);
    }


    public function viewPublic($hash)
    {
        $modul = ModulPraktikum::where('hash', $hash)
            ->where('is_public', true)
            ->first();

        if (!$modul) {
            abort(404, 'Modul tidak ditemukan atau tidak tersedia untuk publik');
        }

        if (!$modul->modul) {
            abort(404, 'File tidak ditemukan');
        }

        $filePath = str_replace('/storage/', '', $modul->modul);

        if (!Storage::disk('public')->exists($filePath)) {
            abort(404, 'File tidak ditemukan');
        }

        $mimeType = Storage::disk('public')->mimeType($filePath);
        $isPdf = $mimeType === 'application/pdf';

        $praktikum = $modul->praktikum;

        $fileUrl = asset('storage/' . $filePath);

        return Inertia::render('PublicModulViewer', [
            'modul' => $modul,
            'praktikum' => $praktikum,
            'fileUrl' => $fileUrl,
            'isPdf' => $isPdf
        ]);
    }
}
