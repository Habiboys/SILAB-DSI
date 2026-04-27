<?php

namespace App\Http\Controllers;

use App\Exports\SuratKeluarExport;
use App\Models\KonfigurasiSurat;
use App\Models\KepengurusanLab;
use App\Models\Laboratorium;
use App\Models\SuratKeluar;
use App\Models\TahunKepengurusan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class SuratKeluarController extends Controller
{
    // ---------------------------------------------------------------
    // INDEX
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        $user       = auth()->user();
        $currentLab = $user->getCurrentLab();

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        // Lab resolution (mirrors ProkerController pattern)
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

        $suratKeluar = (object)['data' => [], 'links' => [], 'total' => 0];
        $konfigurasi = null;

        if ($kepengurusanLab) {
            $query = SuratKeluar::where('kepengurusan_lab_id', $kepengurusanLab->id)
                ->with('dibuatOleh:id,name');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nomor_surat', 'like', "%{$search}%")
                      ->orWhere('perihal', 'like', "%{$search}%")
                      ->orWhere('tujuan', 'like', "%{$search}%");
                });
            }

            $suratKeluar = $query->orderBy('nomor_urut', 'desc')
                ->paginate($perPage)
                ->withQueryString()
                ->through(fn ($s) => [
                    'id'               => $s->id,
                    'nomor_urut'       => $s->nomor_urut,
                    'nomor_surat'      => $s->nomor_surat,
                    'perihal'          => $s->perihal,
                    'tujuan'           => $s->tujuan,
                    'tanggal_surat'    => $s->tanggal_surat?->format('Y-m-d'),
                    'isi_ringkas'      => $s->isi_ringkas,
                    'file_surat'       => $s->file_surat,
                    'kode_klasifikasi' => $s->kode_klasifikasi,
                    'dibuat_oleh'      => $s->dibuatOleh?->name,
                    'created_at'       => $s->created_at?->format('Y-m-d H:i'),
                ]);

            $konfigurasi = KonfigurasiSurat::where('kepengurusan_lab_id', $kepengurusanLab->id)->first();
        }

        return Inertia::render('SuratMenyurat/SuratKeluar', [
            'suratKeluar'        => $suratKeluar,
            'kepengurusanLab'    => $kepengurusanLab,
            'laboratorium'       => $laboratorium,
            'tahunKepengurusan'  => $tahunKepengurusan,
            'selectedLabId'      => $lab_id,
            'selectedTahunId'    => $tahun_id,
            'konfigurasi'        => $konfigurasi,
            'filters'            => [
                'search'              => $search,
                'perPage'             => $perPage,
                'kepengurusan_lab_id' => $kepengurusan_lab_id,
            ],
            'canCreate'  => $user->can('surat-keluar.create'),
            'canEdit'    => $user->can('surat-keluar.edit'),
            'canDelete'  => $user->can('surat-keluar.delete'),
            'canExport'  => $user->can('surat-keluar.export'),
            'canConfig'  => $user->can('konfigurasi-surat.edit'),
        ]);
    }

    // ---------------------------------------------------------------
    // STORE
    // ---------------------------------------------------------------
    public function store(Request $request)
    {
        $user = Auth::user();
        if (! $user->can('surat-keluar.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'kepengurusan_lab_id' => ['required', 'uuid', 'exists:kepengurusan_lab,id'],
            'perihal'             => ['required', 'string', 'max:255'],
            'tujuan'              => ['required', 'string', 'max:255'],
            'tanggal_surat'       => ['required', 'date'],
            'isi_ringkas'         => ['nullable', 'string'],
            'kode_klasifikasi'    => ['nullable', 'string', 'max:50'],
            'file_surat'          => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        $kepengurusanLabId = $validated['kepengurusan_lab_id'];

        // Nomor urut: max + 1 within this kepengurusan_lab
        $nextUrut = (SuratKeluar::where('kepengurusan_lab_id', $kepengurusanLabId)->max('nomor_urut') ?? 0) + 1;

        // Generate formatted nomor surat
        $konfigurasi  = KonfigurasiSurat::firstOrCreate(
            ['kepengurusan_lab_id' => $kepengurusanLabId],
            [
                'inisial_lab'      => 'LAB',
                'format_nomor'     => '{nomor}/LAB.{inisial_lab}/{bulan_romawi}/{tahun}',
                'reset_tiap_tahun' => true,
            ]
        );
        $nomorSurat = $konfigurasi->generateNomor($nextUrut, $validated['tanggal_surat']);

        // File upload
        $filePath = null;
        if ($request->hasFile('file_surat')) {
            $filePath = $request->file('file_surat')
                ->store("surat-keluar/{$kepengurusanLabId}", 'public');
        }

        SuratKeluar::create([
            'kepengurusan_lab_id' => $kepengurusanLabId,
            'nomor_urut'          => $nextUrut,
            'nomor_surat'         => $nomorSurat,
            'perihal'             => $validated['perihal'],
            'tujuan'              => $validated['tujuan'],
            'tanggal_surat'       => $validated['tanggal_surat'],
            'isi_ringkas'         => $validated['isi_ringkas'] ?? null,
            'kode_klasifikasi'    => $validated['kode_klasifikasi'] ?? null,
            'file_surat'          => $filePath,
            'dibuat_oleh'         => $user->id,
        ]);

        return redirect()->back()->with('success', "Surat keluar #{$nextUrut} berhasil ditambahkan.");
    }

    // ---------------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------------
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        if (! $user->can('surat-keluar.edit')) {
            abort(403);
        }

        $surat = SuratKeluar::findOrFail($id);

        $validated = $request->validate([
            'perihal'          => ['required', 'string', 'max:255'],
            'tujuan'           => ['required', 'string', 'max:255'],
            'tanggal_surat'    => ['required', 'date'],
            'isi_ringkas'      => ['nullable', 'string'],
            'kode_klasifikasi' => ['nullable', 'string', 'max:50'],
            'file_surat'       => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        // File upload (replace if new file)
        if ($request->hasFile('file_surat')) {
            if ($surat->file_surat) {
                Storage::disk('public')->delete($surat->file_surat);
            }
            $validated['file_surat'] = $request->file('file_surat')
                ->store("surat-keluar/{$surat->kepengurusan_lab_id}", 'public');
        } else {
            unset($validated['file_surat']);
        }

        $surat->update($validated);

        return redirect()->back()->with('success', 'Surat keluar berhasil diperbarui.');
    }

    // ---------------------------------------------------------------
    // DESTROY
    // ---------------------------------------------------------------
    public function destroy(string $id)
    {
        $user = Auth::user();
        if (! $user->can('surat-keluar.delete')) {
            abort(403);
        }

        $surat = SuratKeluar::findOrFail($id);

        if ($surat->file_surat) {
            Storage::disk('public')->delete($surat->file_surat);
        }

        $surat->delete();

        return redirect()->back()->with('success', 'Surat keluar berhasil dihapus.');
    }

    // ---------------------------------------------------------------
    // DOWNLOAD FILE
    // ---------------------------------------------------------------
    public function download(string $id)
    {
        $surat = SuratKeluar::findOrFail($id);

        if (! $surat->file_surat || ! Storage::disk('public')->exists($surat->file_surat)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::disk('public')->download(
            $surat->file_surat,
            basename($surat->file_surat)
        );
    }

    // ---------------------------------------------------------------
    // EXPORT EXCEL
    // ---------------------------------------------------------------
    public function export(Request $request)
    {
        $user = Auth::user();
        if (! $user->can('surat-keluar.export')) {
            abort(403);
        }

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');
        $kepengurusanLab     = KepengurusanLab::with(['laboratorium'])->findOrFail($kepengurusan_lab_id);

        $suratKeluar = SuratKeluar::where('kepengurusan_lab_id', $kepengurusan_lab_id)
            ->with('dibuatOleh:id,name')
            ->orderBy('nomor_urut')
            ->get();

        $labNama  = $kepengurusanLab->laboratorium->nama ?? '';
        $filename = 'surat-keluar-' . \Str::slug($labNama) . '-' . now()->format('Ymd') . '.xlsx';

        return Excel::download(new SuratKeluarExport($suratKeluar, $labNama), $filename);
    }
}
