<?php

namespace App\Http\Controllers;

use App\Models\MataKuliah;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MataKuliahController extends Controller
{
    public function index(Request $request)
    {
        $search  = $request->input('search', '');
        $perPage = $request->input('perPage', 10);

        $query = MataKuliah::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('kode_mata_kuliah', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%")
                  ->orWhere('sks', 'like', "%{$search}%")
                  ->orWhere('semester', 'like', "%{$search}%");
            });
        }

        $mataKuliah = $query->orderBy('kode_mata_kuliah')->paginate($perPage)->withQueryString();

        return Inertia::render('DataMaster/MataKuliah/Index', [
            'mataKuliah' => $mataKuliah,
            'filters' => [
                'search'  => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->hasAccess('matakuliah.create')) {
            abort(403, 'Tidak memiliki izin.');
        }

        $validated = $request->validate([
            'kode_mata_kuliah' => 'required|string|max:30|unique:mata_kuliah,kode_mata_kuliah',
            'nama'             => 'required|string|max:255',
            'sks'              => 'required|integer|min:1|max:6',
            'semester'         => 'required|integer|min:1|max:14',
        ]);

        MataKuliah::create([
            'kode_mata_kuliah' => strtoupper(trim($validated['kode_mata_kuliah'])),
            'nama'             => trim($validated['nama']),
            'sks'              => $validated['sks'],
            'semester'         => $validated['semester'],
            'status'           => 'aktif',
        ]);

        return redirect()->back()->with('message', 'Mata kuliah berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        if (!$this->hasAccess('matakuliah.update')) {
            abort(403, 'Tidak memiliki izin.');
        }

        $mataKuliah = MataKuliah::findOrFail($id);

        $validated = $request->validate([
            'kode_mata_kuliah' => 'required|string|max:30|unique:mata_kuliah,kode_mata_kuliah,' . $id,
            'nama'             => 'required|string|max:255',
            'sks'              => 'required|integer|min:1|max:6',
            'semester'         => 'required|integer|min:1|max:14',
            'status'           => 'required|in:aktif,nonaktif',
        ]);

        $mataKuliah->update([
            'kode_mata_kuliah' => strtoupper(trim($validated['kode_mata_kuliah'])),
            'nama'             => trim($validated['nama']),
            'sks'              => $validated['sks'],
            'semester'         => $validated['semester'],
            'status'           => $validated['status'],
        ]);

        return redirect()->back()->with('message', 'Mata kuliah berhasil diperbarui');
    }

    public function destroy($id)
    {
        if (!$this->hasAccess('matakuliah.delete')) {
            abort(403, 'Tidak memiliki izin.');
        }

        $mataKuliah = MataKuliah::findOrFail($id);

        if ($mataKuliah->praktikums()->count() > 0) {
            return redirect()->back()->with('error', 'Mata kuliah tidak bisa dihapus karena masih digunakan oleh praktikum.');
        }

        $mataKuliah->delete();

        return redirect()->back()->with('message', 'Mata kuliah berhasil dihapus');
    }

    private function hasAccess(string $permission): bool
    {
        $user = Auth::user();

        if (!$user) {
            return false;
        }

        $hasPermission = method_exists($user, 'can') && call_user_func([$user, 'can'], $permission);
        $isSuperAdmin = method_exists($user, 'hasRole') && call_user_func([$user, 'hasRole'], 'superadmin');

        return $hasPermission || $isSuperAdmin;
    }
}
