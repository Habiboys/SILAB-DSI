<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\KepengurusanLab;
use App\Models\KepengurusanUser;
use App\Models\Laboratorium;
use App\Models\Proker;
use App\Models\ProkerPj;
use App\Models\Struktur;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProkerController extends Controller
{
    // Note: Authorization is handled via route middleware in Laravel 11
    // See routes/web.php for policy-based authorization

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
            $lab_id = $user->access_lab_id;
        }

        $tahun_id        = $request->input('tahun_id');
        $kepengurusanlab = null;

        if ($kepengurusan_lab_id) {
            $kepengurusanlab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);

            if ($kepengurusanlab) {
                $lab_id   = $kepengurusanlab->laboratorium_id;
                $tahun_id = $kepengurusanlab->tahun_kepengurusan_id;
            }
        } else {
            if (!$tahun_id && $lab_id) {
                $kepAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('is_active', true)
                    ->first();
                $tahun_id = $kepAktif ? $kepAktif->tahun_kepengurusan_id : null;
            }

            if ($lab_id && $tahun_id) {
                $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['tahunKepengurusan', 'laboratorium'])
                    ->first();
            }
        }

        $tahunKepengurusan = collect();
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function ($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        }

        $prokerData   = null;
        $strukturList = [];
        $summary      = null;
        $perPage      = min((int) $request->input('per_page', 10), 100);

        if ($kepengurusanlab) {
            $search       = $request->input('search', '');
            $fStruktur    = $request->input('filter_struktur', '');
            $fSP          = $request->input('filter_status_pengajuan', '');
            $fStatus      = $request->input('filter_status', '');

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

            $base = Proker::where('kepengurusan_lab_id', $kepengurusanlab->id);
            $summary = [
                'total'     => (clone $base)->count(),
                'diajukan'  => (clone $base)->where('status_pengajuan', 'diajukan')->count(),
                'disetujui' => (clone $base)->where('status_pengajuan', 'disetujui')->count(),
                'selesai'   => (clone $base)->where('status', 'selesai')->count(),
                'ditolak'   => (clone $base)->where('status_pengajuan', 'ditolak')->count(),
            ];

            $strukturList = Struktur::whereNull('parent_id')->orderBy('struktur')->get();
        }

        $can = [
            'create'  => $user->can('create', Proker::class),
            'approve' => $user->hasRole(['superadmin', 'kadep']) || $user->can('proker.approve'),
        ];

        $laboratorium = Laboratorium::all();

        return Inertia::render('Proker/Index', [
            'prokerData'        => $prokerData,
            'kepengurusanlab'   => $kepengurusanlab,
            'strukturList'      => $strukturList,
            'tahunKepengurusan' => $tahunKepengurusan,
            'selectedTahun'     => $tahun_id,
            'laboratorium'      => $laboratorium,
            'summary'           => $summary,
            'can'               => $can,
            'filters'           => [
                'lab_id'                  => $lab_id,
                'tahun_id'                => $tahun_id,
                'kepengurusan_lab_id'     => $kepengurusanlab ? $kepengurusanlab->id : null,
                'search'                  => $request->input('search', ''),
                'filter_struktur'         => $request->input('filter_struktur', ''),
                'filter_status_pengajuan' => $request->input('filter_status_pengajuan', ''),
                'filter_status'           => $request->input('filter_status', ''),
                'per_page'                => $perPage,
            ],
        ]);
    }

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

        // Load PJ candidates: members of the proker's division tree
        // (the koordinator's struktur + all child/anggota struktuts of that division)
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
            'tujuan'              => 'nullable|string',
            'sasaran'             => 'nullable|string',
            'output_kegiatan'     => 'nullable|string',
            'status'              => 'required|in:belum_mulai,sedang_berjalan,selesai,ditunda',
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

        // Assign PJs
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
                'exists:users,id',
                \Illuminate\Validation\Rule::exists('kepengurusan_user', 'user_id')
                    ->where('kepengurusan_lab_id', $proker->kepengurusan_lab_id),
            ],
        ]);

        $data = $request->except(['file_proker', 'pj_user_ids', 'kepengurusan_lab_id', 'lab_id', '_method']);

        if ($request->hasFile('file_proker')) {
            if ($proker->file_proker) {
                Storage::disk('public')->delete($proker->file_proker);
            }
            $file               = $request->file('file_proker');
            $fileName           = time() . '_' . $file->getClientOriginalName();
            $data['file_proker'] = $file->storeAs('proker', $fileName, 'public');
        }

        $proker->update($data);

        // Sync PJs if provided
        if ($request->has('pj_user_ids')) {
            ProkerPj::where('proker_id', $proker->id)->delete();
            foreach (array_unique($request->pj_user_ids ?? []) as $uid) {
                ProkerPj::create(['proker_id' => $proker->id, 'user_id' => $uid]);
            }
        }

        return redirect()->back()->with('message', 'Program kerja berhasil diperbarui.');
    }

    /** PJ: add a single user as PJ. */
    public function addPj(Request $request, Proker $proker)
    {
        $request->validate([
            'user_id' => [
                'required',
                'exists:users,id',
                \Illuminate\Validation\Rule::exists('kepengurusan_user', 'user_id')
                    ->where('kepengurusan_lab_id', $proker->kepengurusan_lab_id),
            ],
        ]);

        ProkerPj::firstOrCreate([
            'proker_id' => $proker->id,
            'user_id'   => $request->user_id,
        ]);

        return back()->with('message', 'Penanggung jawab berhasil ditambahkan.');
    }

    /** PJ: remove a single PJ record by composite key (proker_id + user_id). */
    public function removePj(Proker $proker, string $userId)
    {
        ProkerPj::where('proker_id', $proker->id)
            ->where('user_id', $userId)
            ->delete();

        return back()->with('message', 'Penanggung jawab berhasil dihapus.');
    }

    /** Submit proker for approval (draft → diajukan). */
    public function ajukan(Proker $proker)
    {
        $this->authorize('update', $proker);

        abort_if($proker->status_pengajuan !== 'draft', 422, 'Hanya proker berstatus draft yang bisa diajukan.');

        $proker->update(['status_pengajuan' => 'diajukan']);

        return back()->with('message', 'Program kerja berhasil diajukan untuk persetujuan.');
    }

    /** Approve or reject a submitted proker. */
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

    /** Save evaluasi (kendala/solusi/saran/status_evaluasi) inline. */
    public function saveEvaluasi(Request $request, Proker $proker)
    {
        $this->authorize('updateProgress', $proker);

        $request->validate([
            'kendala'          => 'nullable|string',
            'solusi'           => 'nullable|string',
            'saran'            => 'nullable|string',
            'status_evaluasi'  => 'nullable|in:terlaksana,sebagian,tidak_terlaksana',
        ]);

        $proker->update($request->only(['kendala', 'solusi', 'saran', 'status_evaluasi']));

        return back()->with('message', 'Evaluasi berhasil disimpan.');
    }

    public function destroy(Proker $proker)
    {
        if ($proker->file_proker) {
            Storage::disk('public')->delete($proker->file_proker);
        }
        $proker->delete();

        return redirect()->back()->with('message', 'Program kerja berhasil dihapus.');
    }
}
