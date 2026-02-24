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
        $struktur = Struktur::with(['defaultRole', 'parent'])->orderBy('struktur')->get();

        // Get all available roles for dropdown
        $roles = Role::select('id', 'name')->get();

        // Parent options: only root struktuts (parent_id = null) for the parent dropdown
        $parentOptions = Struktur::whereNull('parent_id')
            ->orderBy('struktur')
            ->get(['id', 'struktur']);

        return Inertia::render('DataMaster/Struktur', [
            'struktur'      => $struktur,
            'roles'         => $roles,
            'parentOptions' => $parentOptions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'struktur'         => 'required|string|max:255|unique:struktur',
            'jabatan_tunggal'  => 'required|boolean',
            'default_role_id'  => 'required|exists:roles,id',
            'parent_id'        => 'nullable|exists:struktur,id',
        ]);

        Struktur::create($request->only(['struktur', 'jabatan_tunggal', 'default_role_id', 'parent_id']));

        return redirect()->back()->with('message', 'Struktur berhasil ditambahkan.');
    }

    public function update(Request $request, Struktur $struktur)
    {
        $request->validate([
            'struktur'        => 'required|string|max:255|unique:struktur,struktur,' . $struktur->id,
            'jabatan_tunggal' => 'required|boolean',
            'default_role_id' => 'required|exists:roles,id',
            'parent_id'       => [
                'nullable',
                'exists:struktur,id',
                function ($attribute, $value, $fail) use ($struktur) {
                    if ($value && $value === $struktur->id) {
                        $fail('Struktur tidak bisa menjadi induknya sendiri.');
                    }
                },
            ],
        ]);

        $struktur->update($request->only(['struktur', 'jabatan_tunggal', 'default_role_id', 'parent_id']));

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
