<?php

namespace App\Http\Controllers;

use App\Models\Struktur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StrukturController extends Controller
{
    public function index()
    {
        $struktur = Struktur::orderBy('struktur')->get();
        
        return Inertia::render('DataMaster/Struktur', [
            'struktur' => $struktur
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'struktur' => 'required|string|max:255|unique:struktur',
            'tipe_jabatan' => 'nullable|in:dosen,asisten',
            'jabatan_tunggal' => 'required|boolean',
            'jabatan_terkait' => [
                $request->tipe_jabatan === 'dosen' ? 'required' : 'nullable',
                'in:kalab,dosen'
            ],
        ]);

        // Clear jabatan_terkait jika bukan dosen
        $data = $request->all();
        if ($data['tipe_jabatan'] !== 'dosen') {
            $data['jabatan_terkait'] = null;
        }

        Struktur::create($data);

        return redirect()->back()->with('message', 'Struktur berhasil ditambahkan.');
    }

    public function update(Request $request, Struktur $struktur)
    {
        $request->validate([
            'struktur' => 'required|string|max:255|unique:struktur,struktur,' . $struktur->id,
            'tipe_jabatan' => 'nullable|in:dosen,asisten',
            'jabatan_tunggal' => 'required|boolean',
            'jabatan_terkait' => [
                $request->tipe_jabatan === 'dosen' ? 'required' : 'nullable',
                'in:kalab,dosen'
            ],
        ]);

        // Clear jabatan_terkait jika bukan dosen
        $data = $request->all();
        if ($data['tipe_jabatan'] !== 'dosen') {
            $data['jabatan_terkait'] = null;
        }

        $struktur->update($data);

        return redirect()->back()->with('message', 'Struktur berhasil diperbarui.');
    }

    public function destroy(Struktur $struktur)
    {
        // Check if struktur is being used by users
        if ($struktur->users()->count() > 0) {
            return redirect()->back()->with('error', 'Struktur tidak dapat dihapus karena sedang digunakan oleh anggota.');
        }

        // Check if struktur is being used by proker
        if ($struktur->proker()->count() > 0) {
            return redirect()->back()->with('error', 'Struktur tidak dapat dihapus karena memiliki program kerja terkait.');
        }

        $struktur->delete();

        return redirect()->back()->with('message', 'Struktur berhasil dihapus.');
    }
}