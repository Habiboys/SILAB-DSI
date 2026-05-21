<?php

namespace App\Http\Controllers;

use App\Models\PeriodePiket;
use App\Models\JadwalPiket;
use App\Models\Absensi;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use App\Models\KepengurusanLab;
use App\Models\PengaturanPiket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class PeriodePiketController extends Controller
{
    public function index(Request $request)
    {

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        $search = $request->input('search');
        $perPage = (int) $request->input('perPage', 10);

        $laboratorium = Laboratorium::select('id', 'nama')->get();

        $kepengurusanlab = null;
        $tahunKepengurusan = collect();

        if ($kepengurusan_lab_id) {
            $kepengurusanlab = KepengurusanLab::with([
                'tahunKepengurusan:id,tahun,isactive',
                'laboratorium:id,nama'
            ])->find($kepengurusan_lab_id);

            if ($kepengurusanlab) {
                $lab_id = $kepengurusanlab->laboratorium_id;
                $tahun_id = $kepengurusanlab->tahun_kepengurusan_id;
            }
        }

        elseif ($lab_id) {

            if (!$tahun_id) {
                $kepAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('is_active', true)
                    ->first();
                $tahun_id = $kepAktif ? $kepAktif->tahun_kepengurusan_id : null;
            }

            if ($tahun_id) {
                $kepengurusanlab = KepengurusanLab::getByLabAndYear(
                    $lab_id,
                    $tahun_id,
                    [
                        'tahunKepengurusan:id,tahun,isactive',
                        'laboratorium:id,nama'
                    ]
                );
            }
        }

        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function ($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        }

        $periodePiketQuery = collect([]);
        $formattedPeriodes = (object)[
            'data' => [],
            'links' => [],
            'from' => 0,
            'total' => 0,
        ];

        if ($kepengurusanlab) {
            $query = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->select('id', 'nama', 'tanggal_mulai', 'tanggal_selesai', 'isactive', 'lama_piket', 'kepengurusan_lab_id', 'created_at', 'updated_at');

            if ($search) {
                $query->where('nama', 'like', "%{$search}%");
            }

            $paginator = $query->orderBy('tanggal_mulai', 'desc')
                ->paginate($perPage)
                ->withQueryString()
                ->through(function ($periode) {
                    return [
                        'id'                  => $periode->id,
                        'nama'                => $periode->nama,
                        'tanggal_mulai'       => $periode->tanggal_mulai ? $periode->tanggal_mulai->format('Y-m-d') : null,
                        'tanggal_selesai'     => $periode->tanggal_selesai ? $periode->tanggal_selesai->format('Y-m-d') : null,
                        'isactive'            => $periode->isactive,
                        'lama_piket'          => $periode->lama_piket ?? 120,
                        'kepengurusan_lab_id' => $periode->kepengurusan_lab_id,
                        'created_at'          => $periode->created_at,
                        'updated_at'          => $periode->updated_at,
                    ];
                });

            $formattedPeriodes = $paginator;
            Log::info('Found ' . $paginator->total() . ' periods for kepengurusan_lab_id ' . $kepengurusanlab->id);
        }

        return Inertia::render('PeriodePiket', [
            'periodes'          => $formattedPeriodes,
            'kepengurusanlab'   => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium'      => $laboratorium,
            'pengaturanPiket'   => $kepengurusanlab ? PengaturanPiket::where('kepengurusan_lab_id', $kepengurusanlab->id)->first() : null,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
                'kepengurusan_lab_id' => $kepengurusanlab ? $kepengurusanlab->id : null,
                'search' => $search,
                'perPage' => $perPage,
            ]
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nama'                => 'required|string|max:255',
                'tanggal_mulai'       => 'required|date',
                'tanggal_selesai'     => 'required|date|after_or_equal:tanggal_mulai',
                'isactive'            => 'boolean',
                'lama_piket'          => 'required|integer|min:30|max:480',
                'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            ]);

            if (!isset($validated['isactive'])) {
                $validated['isactive'] = false;
            }

            $this->validateWeekdayPeriod($validated['tanggal_mulai'], $validated['tanggal_selesai']);

            $this->checkOverlappingPeriods(
                null,
                $validated['tanggal_mulai'],
                $validated['tanggal_selesai'],
                $validated['kepengurusan_lab_id']
            );

            if ($validated['isactive']) {

                PeriodePiket::where('kepengurusan_lab_id', $validated['kepengurusan_lab_id'])
                    ->where('isactive', true)
                    ->update(['isactive' => false]);
            }

            $periodePiket = PeriodePiket::create($validated);

            return redirect()->route('piket.periode-piket.index', [
                'kepengurusan_lab_id' => $validated['kepengurusan_lab_id'],
            ])->with('success', 'Periode piket berhasil ditambahkan.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error creating periode piket: ' . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan periode piket: ' . $e->getMessage())->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $periode = PeriodePiket::findOrFail($id);

            Log::info('Updating periode piket', [
                'periode_id' => $id,
                'request_data' => $request->all(),
                'current_periode' => $periode->toArray()
            ]);

            if ($request->has('isactive') && count($request->all()) <= 3) {

                $isActive = (bool) $request->input('isactive');

                if ($isActive) {

                    PeriodePiket::where('kepengurusan_lab_id', $periode->kepengurusan_lab_id)
                        ->where('isactive', true)
                        ->update(['isactive' => false]);
                }

                $periode->update(['isactive' => $isActive]);

                return redirect()->route('piket.periode-piket.index', [
                    'kepengurusan_lab_id' => $periode->kepengurusan_lab_id,
                ])->with('success', $isActive ? 'Periode piket berhasil diaktifkan.' : 'Periode piket berhasil dinonaktifkan.');
            }

            $validated = $request->validate([
                'nama'           => 'required|string|max:255',
                'tanggal_mulai'  => 'required|date',
                'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
                'isactive'       => 'boolean',
                'lama_piket'     => 'required|integer|min:30|max:480',
            ]);

            if (!isset($validated['isactive'])) {
                $validated['isactive'] = $periode->isactive;
            }

            if (
                $validated['tanggal_mulai'] !== $periode->tanggal_mulai->format('Y-m-d') ||
                $validated['tanggal_selesai'] !== $periode->tanggal_selesai->format('Y-m-d')
            ) {
                $this->validateWeekdayPeriod($validated['tanggal_mulai'], $validated['tanggal_selesai']);
            }

            $this->checkOverlappingPeriods(
                $periode->id,
                $validated['tanggal_mulai'],
                $validated['tanggal_selesai'],
                $periode->kepengurusan_lab_id
            );

            if ($validated['isactive'] && !$periode->isactive) {

                PeriodePiket::where('kepengurusan_lab_id', $periode->kepengurusan_lab_id)
                    ->where('isactive', true)
                    ->update(['isactive' => false]);
            }

            $periode->update($validated);

            Log::info('Periode piket updated successfully', [
                'periode_id' => $id,
                'updated_data' => $validated
            ]);

            return redirect()->route('piket.periode-piket.index', [
                'kepengurusan_lab_id' => $periode->kepengurusan_lab_id,
            ])->with('success', 'Periode piket berhasil diperbarui.');
        } catch (ValidationException $e) {
            Log::error('Validation error updating periode piket', [
                'periode_id' => $id,
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error updating periode piket: ' . $e->getMessage(), [
                'periode_id' => $id,
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Gagal memperbarui periode piket: ' . $e->getMessage())->withInput();
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $periode = PeriodePiket::findOrFail($id);

            $hasAbsensi = $periode->hasAbsensi();

            if ($hasAbsensi) {

                return back()->with('error', 'Tidak dapat menghapus periode yang memiliki absensi terkait.');
            }

            if ($periode->isactive) {

                $newestPeriode = PeriodePiket::where('id', '!=', $id)
                    ->where('kepengurusan_lab_id', $periode->kepengurusan_lab_id)
                    ->orderBy('tanggal_mulai', 'desc')
                    ->first();

                if ($newestPeriode) {
                    $newestPeriode->update(['isactive' => true]);
                }
            }

            $periode->delete();

            return redirect()->route('piket.periode-piket.index', [
                'kepengurusan_lab_id' => $periode->kepengurusan_lab_id,
            ])->with('success', 'Periode piket berhasil dihapus.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting periode: ' . $e->getMessage());

            return back()->with('error', 'Gagal menghapus periode piket: ' . $e->getMessage());
        }
    }


    public function autoGenerate(Request $request)
    {
        try {
            $validated = $request->validate([
                'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
                'tanggal_mulai'       => 'required|date',
                'tanggal_akhir'       => 'required|date|after_or_equal:tanggal_mulai',
                'lama_piket'          => 'required|integer|min:30|max:480',
            ]);

            $start = \Carbon\Carbon::parse($validated['tanggal_mulai']);
            $end   = \Carbon\Carbon::parse($validated['tanggal_akhir']);

            if ($start->dayOfWeek !== 1) {
                return back()->withErrors(['tanggal_mulai' => 'Tanggal mulai harus hari Senin.'])->withInput();
            }

            $created = 0;
            $skipped = 0;
            $current = $start->copy();

            while ($current->lte($end)) {
                $weekStart = $current->copy();
                $weekEnd   = $current->copy()->addDays(4);

                $exists = PeriodePiket::where('kepengurusan_lab_id', $validated['kepengurusan_lab_id'])
                    ->where(function ($q) use ($weekStart, $weekEnd) {
                        $q->where('tanggal_mulai', '<=', $weekEnd->format('Y-m-d'))
                          ->where('tanggal_selesai', '>=', $weekStart->format('Y-m-d'));
                    })->exists();

                if (!$exists) {
                    PeriodePiket::create([
                        'kepengurusan_lab_id' => $validated['kepengurusan_lab_id'],
                        'nama'         => 'Minggu ' . $weekStart->translatedFormat('d M') . ' – ' . $weekEnd->translatedFormat('d M Y'),
                        'tanggal_mulai'   => $weekStart->format('Y-m-d'),
                        'tanggal_selesai' => $weekEnd->format('Y-m-d'),
                        'lama_piket'  => $validated['lama_piket'],
                        'isactive'    => false,
                    ]);
                    $created++;
                } else {
                    $skipped++;
                }

                $current->addWeek();
            }

            $message = "Berhasil membuat {$created} periode piket.";
            if ($skipped > 0) {
                $message .= " {$skipped} minggu dilewati (sudah ada periode).";
            }

            return redirect()->route('piket.periode-piket.index', [
                'kepengurusan_lab_id' => $validated['kepengurusan_lab_id'],
            ])->with('success', $message);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error auto-generate periode: ' . $e->getMessage());
            return back()->with('error', 'Gagal generate periode: ' . $e->getMessage())->withInput();
        }
    }

    private function checkOverlappingPeriods($excludeId, $startDate, $endDate, $kepengurusanLabId = null)
    {

        if (!$kepengurusanLabId) {

            return;
        }

        $query = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
            ->where(function ($q) use ($startDate, $endDate) {
                $q->where(function ($q) use ($startDate, $endDate) {
                    $q->where('tanggal_mulai', '<=', $startDate)
                        ->where('tanggal_selesai', '>=', $startDate);
                })->orWhere(function ($q) use ($startDate, $endDate) {
                    $q->where('tanggal_mulai', '<=', $endDate)
                        ->where('tanggal_selesai', '>=', $endDate);
                })->orWhere(function ($q) use ($startDate, $endDate) {
                    $q->where('tanggal_mulai', '>=', $startDate)
                        ->where('tanggal_selesai', '<=', $endDate);
                });
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $overlapping = $query->first();

        if ($overlapping) {
            throw ValidationException::withMessages([
                'tanggal_mulai' => 'Periode ini tumpang tindih dengan periode ' . $overlapping->nama . ' (' .
                    $overlapping->tanggal_mulai->format('d/m/Y') . ' - ' .
                    $overlapping->tanggal_selesai->format('d/m/Y') . ')'
            ]);
        }
    }

    private function validateWeekdayPeriod($startDate, $endDate)
    {
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);

        if ($start->dayOfWeek !== 1) {
            throw ValidationException::withMessages([
                'tanggal_mulai' => 'Tanggal mulai harus hari Senin.'
            ]);
        }

        if ($end->dayOfWeek !== 5) {
            throw ValidationException::withMessages([
                'tanggal_selesai' => 'Tanggal selesai harus hari Jumat.'
            ]);
        }

        $expectedEnd = (clone $start)->next(5);
        if ($end->format('Y-m-d') !== $expectedEnd->format('Y-m-d')) {
            throw ValidationException::withMessages([
                'tanggal_selesai' => 'Tanggal selesai harus hari Jumat di minggu yang sama dengan tanggal mulai.'
            ]);
        }

        if ($start->isWeekend() || $end->isWeekend()) {
            throw ValidationException::withMessages([
                'tanggal_mulai' => 'Periode harus dimulai dan diakhiri pada hari kerja (Senin-Jumat).'
            ]);
        }
    }
}
