<?php

namespace App\Http\Controllers;

use App\Models\Struktur;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Permission\Role;

class StrukturController extends Controller
{
    public function index()
    {
        $struktur = Struktur::with('defaultRole')->orderBy('struktur')->get();
        
        // Get all available roles for dropdown
        $roles = Role::select('id', 'name')->get();
        
        // Debug: Log roles data
        \Log::info('Roles data for dropdown', [
            'count' => $roles->count(),
            'roles' => $roles->toArray()
        ]);
        
        return Inertia::render('DataMaster/Struktur', [
            'struktur' => $struktur,
            'roles' => $roles
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'struktur' => 'required|string|max:255|unique:struktur',
            'jabatan_tunggal' => 'required|boolean',
            'default_role_id' => 'required|exists:roles,id',
        ]);

        Struktur::create($request->all());

        return redirect()->back()->with('message', 'Struktur berhasil ditambahkan.');
    }

    public function update(Request $request, Struktur $struktur)
    {
        $request->validate([
            'struktur' => 'required|string|max:255|unique:struktur,struktur,' . $struktur->id,
            'jabatan_tunggal' => 'required|boolean',
            'default_role_id' => 'required|exists:roles,id',
        ]);

        $struktur->update($request->all());

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