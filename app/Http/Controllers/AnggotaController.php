<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Struktur;
use App\Models\Laboratorium;
use App\Models\Kepengurusan;
use App\Models\DetailKepengurusan;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AnggotaController extends Controller
{
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id', null);
        // dd($lab_id);
        
        // Get active tahun kepengurusan if not specified
        if (!$tahun_id) {
            $tahun = TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $tahun ? $tahun->id : null;
        }
        
        // Get lab and its structure
        $lab = $lab_id ? Laboratorium::find($lab_id) : null;
        
        // Get all struktur for this lab
        $strukturs = $lab_id ? Struktur::where('laboratorium_id', $lab_id)->get() : [];
        
        // Get all kepengurusan for these struktur and tahun
        $kepengurusanIds = [];
        if (!empty($strukturs) && $tahun_id) {
            $kepengurusanIds = Kepengurusan::whereIn('struktur_id', $strukturs->pluck('id'))
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->pluck('id');
        }
        
// Get all anggota (koor and detail anggota)
$anggota = [];
if (!empty($strukturs) && $tahun_id) {
    // First, get all kepengurusan records for the lab and year
    $kepengurusanRecords = Kepengurusan::with(['struktur'])
        ->whereIn('struktur_id', $strukturs->pluck('id'))
        ->where('tahun_kepengurusan_id', $tahun_id)
        ->get();
    
    // Get koordinator users
    foreach ($kepengurusanRecords as $kep) {
        if ($kep->koor) {
            $koordinator = User::find($kep->koor);
            if ($koordinator) {
                $anggota[] = [
                    'id' => $koordinator->id,
                    'name' => $koordinator->name,
                    'email' => $koordinator->email,
                    'nim' => $koordinator->nim,
                    'nip' => $koordinator->nip,
                    'jenis_kelamin' => $koordinator->jenis_kelamin,
                    'jabatan' => $kep->struktur->struktur . ' (Koordinator)',
                    'kepengurusan_id' => $kep->id,
                    'is_koordinator' => true,
                ];
            }
        }
    }
    
    // Get regular members (from detail_kepengurusan table)
    $detailRecords = DetailKepengurusan::whereIn('kepengurusan_id', $kepengurusanRecords->pluck('id'))->get();
    
    foreach ($detailRecords as $detail) {
        $member = User::find($detail->anggota);
        $kepRecord = $kepengurusanRecords->firstWhere('id', $detail->kepengurusan_id);
        
        if ($member && $kepRecord) {
            $anggota[] = [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'nim' => $member->nim,
                'nip' => $member->nip,
                'jenis_kelamin' => $member->jenis_kelamin,
                'jabatan' => $kepRecord->struktur->struktur . ' (Anggota)',
                'kepengurusan_id' => $detail->kepengurusan_id,
                'detail_id' => $detail->id,
                'is_koordinator' => false,
            ];
        }
    }
}
        
        // Get all tahun kepengurusan for dropdown
        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();
        
        return Inertia::render('Anggota/Index', [
            'anggota' => $anggota,
            'lab' => $lab,
            'strukturs' => $strukturs,
            'tahunKepengurusan' => $tahunKepengurusan,
            'selectedTahun' => $tahun_id,
        ]);
    }

    public function create(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id', null);
        
        // Get lab and its structure
        $lab = $lab_id ? Laboratorium::find($lab_id) : null;
        
        // Get all strukturs for this lab
        $strukturs = $lab_id ? Struktur::where('laboratorium_id', $lab_id)->get() : [];
        // dd($lab_id);
        // dd($strukturs);
        
        // Get all tahun kepengurusan for dropdown
        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();
        
        return Inertia::render('Anggota/Create', [
            'lab' => $lab,
            'strukturs' => $strukturs,
            'tahunKepengurusan' => $tahunKepengurusan,
            'selectedTahun' => $tahun_id,
        ]);
    }

    public function store(Request $request)
    {
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'tipe' => 'required|in:dosen,asisten',
            'nim' => $request->input('tipe') == 'asisten' ? 'required|string|unique:users,nim' : 'nullable',
            'nip' => $request->input('tipe') == 'dosen' ? 'required|string|unique:users,nip' : 'nullable',
            'jenis_kelamin' => 'required', // Ensure the value is 'L' or 'P'
            'no_hp' => 'nullable|string',
            'alamat' => 'nullable|string',
            'tempat_lahir' => 'nullable|string',
            'tanggal_lahir' => 'nullable|date',
            'struktur_id' => 'required|exists:struktur,id',
            'tahun_kepengurusan_id' => 'required|exists:tahun_kepengurusan,id',
            'jabatan' => 'required|in:koordinator,anggota',
        ]);
    
        // Create user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'nim' => $request->tipe == 'asisten' ? $request->nim : null,
            'nip' => $request->tipe == 'dosen' ? $request->nip : null,
            'jenis_kelamin' => $request->jenis_kelamin, 
            'no_hp' => $request->no_hp,
            'alamat' => $request->alamat,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'nomor_anggota' => 'ANG-' . time(), // Generate unique member number
        ]);
    
        // Assign role
        // $user->assignRole($request->tipe == 'dosen' ? 'dosen' : 'asisten');
    
        // Create or update kepengurusan
        $kepengurusan = Kepengurusan::firstOrCreate([
            'struktur_id' => $request->struktur_id,
            'tahun_kepengurusan_id' => $request->tahun_kepengurusan_id,
            'koor' => $user->id,
        ]);
    
        if ($request->jabatan == 'koordinator') {
            // Assign as koordinator
            $kepengurusan->koor = $user->id;
            $kepengurusan->save();
        } else {
            // Assign as regular member
            DetailKepengurusan::create([
                'kepengurusan_id' => $kepengurusan->id,
                'anggota' => $user->id,
            ]);
        }
    
        return redirect()->route('anggota.index', ['lab_id' => $request->lab_id, 'tahun_id' => $request->tahun_kepengurusan_id])
            ->with('message', 'Anggota berhasil ditambahkan');
    }


    public function edit(Request $request, User $user)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id', null);
        
        // Get lab and its structure
        $lab = $lab_id ? Laboratorium::find($lab_id) : null;
        
        // Get all strukturs for this lab
        $strukturs = $lab_id ? Struktur::where('laboratorium_id', $lab_id)->get() : [];
        
        // Get all tahun kepengurusan for dropdown
        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();
        
        // Load related kepengurusan and detailKepengurusan data
        $user->load(['kepengurusan', 'detailKepengurusan']);
    
        // Determine the current position of the user
        $anggota = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'tipe' => $user->tipe,
            'nim' => $user->nim,
            'nip' => $user->nip,
            'jenis_kelamin' => $user->jenis_kelamin,
            'no_hp' => $user->no_hp,
            'alamat' => $user->alamat,
            'tempat_lahir' => $user->tempat_lahir,
            'tanggal_lahir' => $user->tanggal_lahir,
            'struktur_id' => $user->kepengurusan ? $user->kepengurusan->struktur_id : ($user->detailKepengurusan->first() ? $user->detailKepengurusan->first()->kepengurusan->struktur_id : ""),
            'tahun_kepengurusan_id' => $user->kepengurusan ? $user->kepengurusan->tahun_kepengurusan_id : ($user->detailKepengurusan->first() ? $user->detailKepengurusan->first()->kepengurusan->tahun_kepengurusan_id : ""),
            'jabatan' => $user->kepengurusan ? 'koordinator' : 'anggota',
        ];
    
        return Inertia::render('Anggota/Edit', [
            'anggota' => $anggota,
            'lab' => $lab,
            'strukturs' => $strukturs,
            'tahunKepengurusan' => $tahunKepengurusan,
            'selectedTahun' => $tahun_id,
        ]);
    }
    
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:8',
            'tipe' => 'required|in:dosen,asisten',
            'nim' => $request->input('tipe') == 'asisten' ? 'required|string|unique:users,nim,' . $user->id : 'nullable',
            'nip' => $request->input('tipe') == 'dosen' ? 'required|string|unique:users,nip,' . $user->id : 'nullable',
            'jenis_kelamin' => 'required',
            'no_hp' => 'nullable|string',
            'alamat' => 'nullable|string',
            'tempat_lahir' => 'nullable|string',
            'tanggal_lahir' => 'nullable|date',
            'struktur_id' => 'required|exists:struktur,id',
            'tahun_kepengurusan_id' => 'required|exists:tahun_kepengurusan,id',
            'jabatan' => 'required|in:koordinator,anggota',
        ]);
    
        // Update data user
        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password ? Hash::make($request->password) : $user->password,
            'nim' => $request->tipe == 'asisten' ? $request->nim : null,
            'nip' => $request->tipe == 'dosen' ? $request->nip : null,
            'jenis_kelamin' => $request->jenis_kelamin,
            'no_hp' => $request->no_hp,
            'alamat' => $request->alamat,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
        ]);
    
        // Update kepengurusan
        if ($request->jabatan == 'koordinator') {
            // Jadikan user sebagai koordinator
            $kepengurusan = Kepengurusan::updateOrCreate(
                [
                    'struktur_id' => $request->struktur_id,
                    'tahun_kepengurusan_id' => $request->tahun_kepengurusan_id,
                ],
                ['koor' => $user->id]
            );
    
            // Hapus user dari DetailKepengurusan jika sebelumnya dia anggota
            DetailKepengurusan::where('anggota', $user->id)->delete();
        } else {
            // Jika user adalah anggota, pastikan dia masuk ke dalam DetailKepengurusan
            $kepengurusan = Kepengurusan::firstOrCreate([
                'struktur_id' => $request->struktur_id,
                'tahun_kepengurusan_id' => $request->tahun_kepengurusan_id,
            ]);
    
            DetailKepengurusan::updateOrCreate(
                [
                    'kepengurusan_id' => $kepengurusan->id,
                    'anggota' => $user->id,
                ]
            );
    
            // Hapus user sebagai koordinator jika sebelumnya dia koordinator
            Kepengurusan::where('koor', $user->id)->update(['koor' => null]);
        }
    
        return redirect()->route('anggota.index', [
            'lab_id' => $request->lab_id,
            'tahun_id' => $request->tahun_kepengurusan_id
        ])->with('message', 'Anggota berhasil diperbarui');
    }
    

    public function destroy(User $user)
    {
        // dd($user->id);
        // Hapus user dari kepengurusan jika dia adalah koordinator
        Kepengurusan::where('koor', $user->id)->update(['koor' => null]);
    
        // Hapus user dari detail kepengurusan jika dia anggota
        DetailKepengurusan::where('anggota', $user->id)->delete();
    
        // Hapus user dari database
        $user->delete();
    
        return redirect()->route('anggota.index')->with('message', 'Anggota berhasil dihapus');
    }
    
}