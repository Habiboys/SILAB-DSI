<?php

namespace App\Http\Controllers;

use App\Models\Kuesioner;
use App\Models\PertanyaanKuesioner;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

use App\Models\Permission\Role;

class KuesionerController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:survey.view', only: ['index', 'show']),
            new Middleware('permission:survey.create', only: ['create', 'store']),
            new Middleware('permission:survey.edit', only: ['edit', 'update']),
            new Middleware('permission:survey.delete', only: ['destroy']),
            new Middleware('permission:survey.view_results', only: ['results', 'export']),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $kuesioner = Kuesioner::with('pembuat')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Kuesioner/Index', [
            'kuesioner' => $kuesioner,
            'can' => [
                'create' => auth()->user()->can('survey.create'),
                'edit' => auth()->user()->can('survey.edit'),
                'delete' => auth()->user()->can('survey.delete'),
                'view_results' => auth()->user()->can('survey.view_results'),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $roles = Role::all();
        return Inertia::render('Kuesioner/Create', [
            'roles' => $roles
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'tipe' => 'required|in:internal,eksternal',
            'link_eksternal' => 'nullable|url|required_if:tipe,eksternal',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'is_active' => 'boolean',
            'is_mandatory' => 'boolean',
            'pertanyaan' => 'nullable|array',
            'pertanyaan.*.pertanyaan' => 'required_if:tipe,internal|string',
            'pertanyaan.*.tipe_pertanyaan' => 'required_if:tipe,internal|in:text,textarea,radio,checkbox,scale',
            'targets' => 'nullable|array'
        ]);

        DB::beginTransaction();
        try {
            $kuesioner = Kuesioner::create([
                'judul' => $validated['judul'],
                'deskripsi' => $validated['deskripsi'],
                'tipe' => $validated['tipe'],
                'link_eksternal' => $validated['link_eksternal'],
                'tanggal_mulai' => $validated['tanggal_mulai'],
                'tanggal_selesai' => $validated['tanggal_selesai'],
                'is_active' => $validated['is_active'] ?? true,
                'is_mandatory' => $validated['is_mandatory'] ?? false,
                'dibuat_oleh' => auth()->id(),
            ]);

            if ($request->tipe === 'internal' && $request->has('pertanyaan')) {
                foreach ($request->pertanyaan as $index => $q) {
                    PertanyaanKuesioner::create([
                        'kuesioner_id' => $kuesioner->id,
                        'pertanyaan' => $q['pertanyaan'],
                        'tipe_pertanyaan' => $q['tipe_pertanyaan'],
                        'opsi' => isset($q['opsi']) ? $q['opsi'] : null,
                        'wajib_diisi' => $q['wajib_diisi'] ?? false,
                        'urutan' => $index + 1,
                    ]);
                }
            }
            
            if ($request->has('targets') && is_array($request->targets)) {
                foreach ($request->targets as $targetRole) {
                    \App\Models\TargetKuesioner::create([
                        'kuesioner_id' => $kuesioner->id,
                        'tipe_target' => 'role',
                        'nilai_target' => $targetRole
                    ]);
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return redirect()->route('kuesioner.index')->with('success', 'Kuesioner berhasil dibuat.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $kuesioner = Kuesioner::with(['pertanyaan', 'target'])->findOrFail($id);
        
        $hasSubmitted = false;
        if (auth()->check()) {
            $hasSubmitted = \App\Models\ResponKuesioner::where('kuesioner_id', $id)
                ->where('user_id', auth()->id())
                ->exists();
        }

        return Inertia::render('Kuesioner/Show', [
            'kuesioner' => $kuesioner,
            'can' => [
                'edit' => auth()->user()->can('survey.edit'),
                'delete' => auth()->user()->can('survey.delete'),
                'view_results' => auth()->user()->can('survey.view_results'),
                'participate' => auth()->user()->can('survey.participate'),
            ],
            'hasSubmitted' => $hasSubmitted
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $kuesioner = Kuesioner::with(['pertanyaan', 'target'])->findOrFail($id);
        
        // If external, targets might be empty or handled differently
        // Transform targets to array of role strings for the frontend
        $kuesioner->targets = $kuesioner->target->pluck('nilai_target');
        $roles = Role::all();

        return Inertia::render('Kuesioner/Edit', [
            'kuesioner' => $kuesioner,
            'roles' => $roles
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $kuesioner = Kuesioner::findOrFail($id);

        $request->validate([
            'judul' => 'required|string|max:255',
            'tipe' => 'required|in:internal,eksternal',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'pertanyaan' => 'required_if:tipe,internal|array',
            'pertanyaan.*.pertanyaan' => 'required_if:tipe,internal|string',
            'pertanyaan.*.tipe_pertanyaan' => 'required_if:tipe,internal|in:text,textarea,radio,checkbox,scale',
        ]);

        DB::beginTransaction();
        try {
            $kuesioner->update([
                'judul' => $request->judul,
                'deskripsi' => $request->deskripsi,
                'tipe' => $request->tipe,
                'link_eksternal' => $request->link_eksternal,
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'is_active' => $request->is_active ?? true,
            ]);

            // Handle Questions Update
            // Strategy: delete existing and recreate (simplest) OR update existing.
            // CAUTION: If we delete, we lose answers linked to question_ids if we force cascade.
            // Ideally we should update existing ones by ID and add new ones.
            // For now, assuming limited editing if responses exist, OR just updating properties.
            // Let's implement a smarter update:
            
            if ($request->tipe === 'internal' && $request->has('pertanyaan')) {
                 // Get existing IDs
                 $existingIds = $kuesioner->pertanyaan()->pluck('id')->toArray();
                 $incomingIds = array_column(array_filter($request->pertanyaan, fn($q) => isset($q['id'])), 'id');
                 
                 // Delete removed questions
                 $toDelete = array_diff($existingIds, $incomingIds);
                 PertanyaanKuesioner::destroy($toDelete);

                 foreach ($request->pertanyaan as $index => $q) {
                     if (isset($q['id']) && in_array($q['id'], $existingIds)) {
                         // Update
                         PertanyaanKuesioner::where('id', $q['id'])->update([
                            'pertanyaan' => $q['pertanyaan'],
                            'tipe_pertanyaan' => $q['tipe_pertanyaan'],
                            'opsi' => isset($q['opsi']) ? $q['opsi'] : null,
                            'wajib_diisi' => $q['wajib_diisi'] ?? false,
                            'urutan' => $index + 1,
                         ]);
                     } else {
                         // Create new
                         PertanyaanKuesioner::create([
                            'kuesioner_id' => $kuesioner->id,
                            'pertanyaan' => $q['pertanyaan'],
                            'tipe_pertanyaan' => $q['tipe_pertanyaan'],
                            'opsi' => isset($q['opsi']) ? $q['opsi'] : null,
                            'wajib_diisi' => $q['wajib_diisi'] ?? false,
                            'urutan' => $index + 1,
                         ]);
                     }
                 }
            }

            // Handle Targets
            if ($request->has('targets')) {
                // Delete all existing role targets
                \App\Models\TargetKuesioner::where('kuesioner_id', $kuesioner->id)
                    ->where('tipe_target', 'role')
                    ->delete();
                
                if (is_array($request->targets)) {
                    foreach ($request->targets as $targetRole) {
                        \App\Models\TargetKuesioner::create([
                            'kuesioner_id' => $kuesioner->id,
                            'tipe_target' => 'role',
                            'nilai_target' => $targetRole
                        ]);
                    }
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return redirect()->route('kuesioner.index')->with('success', 'Kuesioner berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $kuesioner = Kuesioner::findOrFail($id);
        $kuesioner->delete();

        return redirect()->route('kuesioner.index')->with('success', 'Kuesioner berhasil dihapus.');
    }

    public function results($id)
    {
        $kuesioner = Kuesioner::with(['pertanyaan.jawaban', 'respon.user'])->findOrFail($id);
        
        // Calculate stats or pass raw data
        // For simple view, passing structure.
        
        return Inertia::render('Kuesioner/Results', [
            'kuesioner' => $kuesioner,
            'statistics' => $this->calculateStats($kuesioner),
            'responden_count' => $kuesioner->respon->count(),
            'responden_data' => $this->getRespondenData($kuesioner)
        ]);
    }
    
    private function calculateStats($kuesioner) {
        $stats = [];
        $totalResponden = $kuesioner->respon->count();

        foreach ($kuesioner->pertanyaan as $pertanyaan) {
            $statItem = [
                'pertanyaan' => $pertanyaan->pertanyaan,
                'tipe' => $pertanyaan->tipe_pertanyaan,
                'total_jawaban' => 0,
                'counts' => null,
                'answers' => []
            ];

            // Get all answers for this question
            // We need to fetch answers that belong to this question specifically
            // Since we loaded pertanyaan.jawaban, we can filter them or use the relationship if set up correctly
            // The relationship 'jawaban' on PertanyaanKuesioner model should exist given the eager load 'pertanyaan.jawaban'
            
            // Adjust eager loading in results() if needed, currently it is 'pertanyaan.jawaban'
             $jawabanList = $pertanyaan->jawaban;

            $statItem['total_jawaban'] = $jawabanList->count();

            if (in_array($pertanyaan->tipe_pertanyaan, ['radio', 'checkbox', 'scale'])) {
                $counts = [];
                // Initialize counts based on options if available
                if ($pertanyaan->opsi) {
                     foreach ($pertanyaan->opsi as $opsi) {
                         $counts[$opsi] = 0;
                     }
                }
                
                foreach ($jawabanList as $jawaban) {
                     $val = $jawaban->jawaban;
                     if ($pertanyaan->tipe_pertanyaan === 'checkbox') {
                         // Checkbox answers might be JSON encoded arrays or comma separated
                         $choices = json_decode($val, true); 
                         if (!is_array($choices)) $choices = [$val]; // Fallback
                         
                         foreach ($choices as $choice) {
                             if (isset($counts[$choice])) {
                                 $counts[$choice]++;
                             } else {
                                  $counts[$choice] = 1;
                             }
                         }
                     } else {
                         if (isset($counts[$val])) {
                             $counts[$val]++;
                         } else {
                              $counts[$val] = 1;
                         }
                     }
                }
                $statItem['counts'] = $counts;
            } else {
                // For text/textarea, collect all answers
                $statItem['answers'] = $jawabanList->pluck('jawaban')->toArray();
            }
            
            $stats[] = $statItem;
        }
        return $stats;
    }

    private function getRespondenData($kuesioner) {
        $data = [];
        $kuesioner->load(['respon.user', 'respon.jawaban.pertanyaan']);

        foreach ($kuesioner->respon as $respon) {
            $answers = [];
            foreach ($respon->jawaban as $jawaban) {
                $answers[] = [
                    'pertanyaan' => $jawaban->pertanyaan->pertanyaan,
                    'jawaban' => $jawaban->jawaban,
                    'tipe' => $jawaban->pertanyaan->tipe_pertanyaan
                ];
            }

            $data[] = [
                'user' => $respon->user ? $respon->user->name : 'Anonim',
                'tanggal' => $respon->created_at->format('d M Y H:i'),
                'jawaban' => $answers
            ];
        }
        return $data;
    }
    public function export($id)
    {
        // Implementation for export (Excel)
        // Leaving placeholder or basic implementation
        return redirect()->back()->with('success', 'Export functionality coming soon');
    }


    public function participate($id)
    {
        $kuesioner = Kuesioner::with(['pertanyaan', 'target'])->findOrFail($id);
        
        // Access Control based on Targets
        if ($kuesioner->target->count() > 0) {
            $allowedRoles = $kuesioner->target->where('tipe_target', 'role')->pluck('nilai_target')->toArray();
            if (!empty($allowedRoles) && !auth()->user()->hasRole($allowedRoles) && !auth()->user()->hasRole('superadmin')) {
                 return redirect()->route('kuesioner.index')->with('error', 'Anda tidak memiliki akses ke kuesioner ini.');
            }
        }
        
        // Cek apakah user sudah pernah mengisi
        $hasSubmitted = \App\Models\ResponKuesioner::where('kuesioner_id', $id)
            ->where('user_id', auth()->id())
            ->exists();

        if ($hasSubmitted) {
            return redirect()->route('kuesioner.index')->with('error', 'Anda sudah mengisi kuesioner ini.');
        }

        return Inertia::render('Kuesioner/Partisipasi', [
            'kuesioner' => $kuesioner
        ]);
    }
}
