<?php

namespace App\Http\Controllers;

use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class LaboratoriumController extends Controller
{

    public function index()
    {
        $laboratorium = Laboratorium::all();

        return Inertia::render('DataMaster/Laboratorium', [
            'laboratorium' => $laboratorium
        ]);
    }


    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $data = ['nama' => $request->nama, 'is_active' => true];

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('laboratorium', 'public');
            $data['logo'] = $path;
        }

        Laboratorium::create($data);

        return redirect()->back()->with('message', 'Data Laboratorium berhasil ditambahkan.');
    }


    public function toggle(Laboratorium $laboratorium)
    {
        $laboratorium->update([
            'is_active' => !$laboratorium->is_active,
        ]);

        $statusText = $laboratorium->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('message', "Laboratorium berhasil $statusText.");
    }


    public function update(Request $request, Laboratorium $laboratorium)
    {

        $request->validate([
            'nama' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $data = ['nama' => $request->nama];
        $oldLogo = $laboratorium->logo;

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('laboratorium', 'public');
            if (!$data['logo']) return back()->withErrors(['logo' => 'Gagal mengupload logo.']);
        }

        $laboratorium->update($data);
        if (isset($data['logo']) && $oldLogo && $oldLogo !== $data['logo']) {
            Storage::disk('public')->delete($oldLogo);
        }

        return redirect()->route('laboratorium.index')
            ->with('message', 'Data Laboratorium berhasil diperbarui.');
    }
}
