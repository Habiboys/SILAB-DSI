<?php

namespace App\Http\Controllers;

use App\Exports\SuratMasukExport;
use App\Models\DisposisiSurat;
use App\Models\KepengurusanLab;
use App\Models\KepengurusanUser;
use App\Models\Laboratorium;
use App\Models\SuratMasuk;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class SuratMasukController extends Controller
{
    // ---------------------------------------------------------------
    // INDEX
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        $user       = auth()->user();
        $currentLab = $user->getCurrentLab();

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        if (isset($currentLab['all_access'])) {
            $lab_id = $request->input('lab_id');
        } elseif (isset($currentLab['laboratorium'])) {
            $lab_id = $currentLab['laboratorium']->id;
        } else {
            $lab_id = $user->access_lab_id ?? null;
        }

        $tahun_id        = $request->input('tahun_id');
        $kepengurusanLab = null;

        if ($kepengurusan_lab_id) {
            $kepengurusanLab = KepengurusanLab::with(['laboratorium', 'tahunKepengurusan'])
                ->find($kepengurusan_lab_id);
            if ($kepengurusanLab) {
                $lab_id   = $kepengurusanLab->laboratorium_id;
                $tahun_id = $kepengurusanLab->tahun_kepengurusan_id;
            }
        } else {
            if (!$tahun_id && $lab_id) {
                $kepAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('is_active', true)
                    ->first();
                $tahun_id = $kepAktif?->tahun_kepengurusan_id;
            }
            if ($lab_id && $tahun_id) {
                $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['laboratorium', 'tahunKepengurusan'])
                    ->first();
            }
        }

        $tahunKepengurusan = collect();
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function ($q) use ($lab_id) {
                $q->select('tahun_kepengurusan_id')
                  ->from('kepengurusan_lab')
                  ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        }

        $laboratorium = Laboratorium::select('id', 'nama')->get();

        $search  = $request->input('search');
        $perPage = (int) $request->input('perPage', 10);

        $suratMasuk = (object)['data' => [], 'links' => [], 'total' => 0];

        if ($kepengurusanLab) {
            $query = SuratMasuk::where('kepengurusan_lab_id', $kepengurusanLab->id)
                ->with([
                    'diterimaOleh:id,name',
                    'disposisi' => fn ($q) => $q->select('id', 'surat_masuk_id', 'status'),
                ]);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nomor_surat_asal', 'like', "%{$search}%")
                      ->orWhere('perihal', 'like', "%{$search}%")
                      ->orWhere('asal_surat', 'like', "%{$search}%");
                });
            }

            $suratMasuk = $query->orderBy('nomor_agenda', 'desc')
                ->paginate($perPage)
                ->withQueryString()
                ->through(fn ($s) => [
                    'id'               => $s->id,
                    'nomor_agenda'     => $s->nomor_agenda,
                    'nomor_surat_asal' => $s->nomor_surat_asal,
                    'asal_surat'       => $s->asal_surat,
                    'perihal'          => $s->perihal,
                    'tanggal_surat'    => $s->tanggal_surat?->format('Y-m-d'),
                    'tanggal_terima'   => $s->tanggal_terima?->format('Y-m-d'),
                    'isi_ringkas'      => $s->isi_ringkas,
                    'file_surat'       => $s->file_surat,
                    'diterima_oleh'    => $s->diterimaOleh?->name,
                    'jumlah_disposisi' => $s->disposisi->count(),
                    'created_at'       => $s->created_at?->format('Y-m-d H:i'),
                ]);
        }

        // Members for disposisi dropdown (same lab)
        $anggotaLab = [];
        if ($kepengurusanLab) {
            $anggotaLab = KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLab->id)
                ->with('user:id,name')
                ->get()
                ->map(fn ($ku) => [
                    'id'   => $ku->user_id,
                    'name' => $ku->user?->name ?? '-',
                ])
                ->unique('id')
                ->values();
        }

        return Inertia::render('SuratMenyurat/SuratMasuk', [
            'suratMasuk'         => $suratMasuk,
            'kepengurusanLab'    => $kepengurusanLab,
            'laboratorium'       => $laboratorium,
            'tahunKepengurusan'  => $tahunKepengurusan,
            'selectedLabId'      => $lab_id,
            'selectedTahunId'    => $tahun_id,
            'anggotaLab'         => $anggotaLab,
            'filters'            => [
                'search'              => $search,
                'perPage'             => $perPage,
                'kepengurusan_lab_id' => $kepengurusan_lab_id,
            ],
            'canCreate'  => $user->can('surat-masuk.create'),
            'canEdit'    => $user->can('surat-masuk.edit'),
            'canDelete'  => $user->can('surat-masuk.delete'),
            'canExport'  => $user->can('surat-masuk.export'),
            'canDisposisi' => $user->can('disposisi.create'),
        ]);
    }

    // ---------------------------------------------------------------
    // STORE
    // ---------------------------------------------------------------
    public function store(Request $request)
    {
        $user = Auth::user();
        if (! $user->can('surat-masuk.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'kepengurusan_lab_id' => ['required', 'uuid', 'exists:kepengurusan_lab,id'],
            'nomor_surat_asal'    => ['required', 'string', 'max:255'],
            'asal_surat'          => ['required', 'string', 'max:255'],
            'perihal'             => ['required', 'string', 'max:255'],
            'tanggal_surat'       => ['required', 'date'],
            'tanggal_terima'      => ['required', 'date'],
            'isi_ringkas'         => ['nullable', 'string'],
            'file_surat'          => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        $kepengurusanLabId = $validated['kepengurusan_lab_id'];

        // Nomor agenda: max + 1 within this kepengurusan_lab
        $nextAgenda = (SuratMasuk::where('kepengurusan_lab_id', $kepengurusanLabId)->max('nomor_agenda') ?? 0) + 1;

        $filePath = null;
        if ($request->hasFile('file_surat')) {
            $filePath = $request->file('file_surat')
                ->store("surat-masuk/{$kepengurusanLabId}", 'public');
        }

        SuratMasuk::create([
            'kepengurusan_lab_id' => $kepengurusanLabId,
            'nomor_agenda'        => $nextAgenda,
            'nomor_surat_asal'    => $validated['nomor_surat_asal'],
            'asal_surat'          => $validated['asal_surat'],
            'perihal'             => $validated['perihal'],
            'tanggal_surat'       => $validated['tanggal_surat'],
            'tanggal_terima'      => $validated['tanggal_terima'],
            'isi_ringkas'         => $validated['isi_ringkas'] ?? null,
            'file_surat'          => $filePath,
            'diterima_oleh'       => $user->id,
        ]);

        return redirect()->back()->with('success', "Surat masuk agenda #{$nextAgenda} berhasil ditambahkan.");
    }

    // ---------------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------------
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        if (! $user->can('surat-masuk.edit')) {
            abort(403);
        }

        $surat = SuratMasuk::findOrFail($id);

        $validated = $request->validate([
            'nomor_surat_asal' => ['required', 'string', 'max:255'],
            'asal_surat'       => ['required', 'string', 'max:255'],
            'perihal'          => ['required', 'string', 'max:255'],
            'tanggal_surat'    => ['required', 'date'],
            'tanggal_terima'   => ['required', 'date'],
            'isi_ringkas'      => ['nullable', 'string'],
            'file_surat'       => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        if ($request->hasFile('file_surat')) {
            if ($surat->file_surat) {
                Storage::disk('public')->delete($surat->file_surat);
            }
            $validated['file_surat'] = $request->file('file_surat')
                ->store("surat-masuk/{$surat->kepengurusan_lab_id}", 'public');
        } else {
            unset($validated['file_surat']);
        }

        $surat->update($validated);

        return redirect()->back()->with('success', 'Surat masuk berhasil diperbarui.');
    }

    // ---------------------------------------------------------------
    // DESTROY
    // ---------------------------------------------------------------
    public function destroy(string $id)
    {
        $user = Auth::user();
        if (! $user->can('surat-masuk.delete')) {
            abort(403);
        }

        $surat = SuratMasuk::findOrFail($id);

        if ($surat->file_surat) {
            Storage::disk('public')->delete($surat->file_surat);
        }

        $surat->delete();

        return redirect()->back()->with('success', 'Surat masuk berhasil dihapus.');
    }

    // ---------------------------------------------------------------
    // DOWNLOAD FILE
    // ---------------------------------------------------------------
    public function download(string $id)
    {
        $surat = SuratMasuk::findOrFail($id);

        if (! $surat->file_surat || ! Storage::disk('public')->exists($surat->file_surat)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::disk('public')->download(
            $surat->file_surat,
            basename($surat->file_surat)
        );
    }

    // ---------------------------------------------------------------
    // DISPOSISI LIST (for a single surat masuk)
    // ---------------------------------------------------------------
    public function showDisposisi(string $id)
    {
        $user  = Auth::user();
        $surat = SuratMasuk::with([
            'kepengurusanLab.laboratorium',
            'kepengurusanLab.tahunKepengurusan',
            'diterimaOleh:id,name',
            'disposisi.dariUser:id,name',
            'disposisi.kepadaUser:id,name',
        ])->findOrFail($id);

        // Only members of the same lab can see disposisi
        $anggotaLab = KepengurusanUser::where('kepengurusan_lab_id', $surat->kepengurusan_lab_id)
            ->with('user:id,name')
            ->get()
            ->map(fn ($ku) => ['id' => $ku->user_id, 'name' => $ku->user?->name ?? '-'])
            ->unique('id')
            ->values();

        // Mark belum_dibaca disposisi as sudah_dibaca when the recipient views
        DisposisiSurat::where('surat_masuk_id', $id)
            ->where('kepada_user_id', $user->id)
            ->where('status', 'belum_dibaca')
            ->update([
                'status'    => 'sudah_dibaca',
                'dibaca_at' => now(),
            ]);

        return Inertia::render('SuratMenyurat/Disposisi', [
            'surat'       => [
                'id'               => $surat->id,
                'nomor_agenda'     => $surat->nomor_agenda,
                'nomor_surat_asal' => $surat->nomor_surat_asal,
                'asal_surat'       => $surat->asal_surat,
                'perihal'          => $surat->perihal,
                'tanggal_surat'    => $surat->tanggal_surat?->format('Y-m-d'),
                'tanggal_terima'   => $surat->tanggal_terima?->format('Y-m-d'),
                'isi_ringkas'      => $surat->isi_ringkas,
                'file_surat'       => $surat->file_surat,
                'diterima_oleh'    => $surat->diterimaOleh?->name,
                'lab'              => $surat->kepengurusanLab?->laboratorium?->nama,
            ],
            'disposisi'   => $surat->disposisi->map(fn ($d) => [
                'id'               => $d->id,
                'dari_user'        => $d->dariUser?->name,
                'kepada_user'      => $d->kepadaUser?->name,
                'kepada_user_id'   => $d->kepada_user_id,
                'catatan'          => $d->catatan,
                'status'           => $d->status,
                'dibaca_at'        => $d->dibaca_at?->format('Y-m-d H:i'),
                'diselesaikan_at'  => $d->diselesaikan_at?->format('Y-m-d H:i'),
                'created_at'       => $d->created_at?->format('Y-m-d H:i'),
            ]),
            'anggotaLab'  => $anggotaLab,
            'currentUser' => ['id' => $user->id, 'name' => $user->name],
            'canCreate'   => $user->can('disposisi.create'),
            'canUpdate'   => $user->can('disposisi.update-status'),
        ]);
    }

    // ---------------------------------------------------------------
    // EXPORT EXCEL
    // ---------------------------------------------------------------
    public function export(Request $request)
    {
        $user = Auth::user();
        if (! $user->can('surat-masuk.export')) {
            abort(403);
        }

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');
        $kepengurusanLab     = KepengurusanLab::with(['laboratorium'])->findOrFail($kepengurusan_lab_id);

        $suratMasuk = SuratMasuk::where('kepengurusan_lab_id', $kepengurusan_lab_id)
            ->with('diterimaOleh:id,name')
            ->orderBy('nomor_agenda')
            ->get();

        $labNama  = $kepengurusanLab->laboratorium->nama ?? '';
        $filename = 'surat-masuk-' . \Str::slug($labNama) . '-' . now()->format('Ymd') . '.xlsx';

        return Excel::download(new SuratMasukExport($suratMasuk, $labNama), $filename);
    }
}
