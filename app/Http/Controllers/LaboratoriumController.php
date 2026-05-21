<?php

namespace App\Http\Controllers;

use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

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

        Log::info('Update request data:', $request->all());
        Log::info('Files:', $request->allFiles());

        $request->validate([
            'nama' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $data = ['nama' => $request->nama];

        if ($request->hasFile('logo')) {
            Log::info('Logo file detected');

            try {

                if ($laboratorium->logo && file_exists(public_path('storage/' . $laboratorium->logo))) {
                    unlink(public_path('storage/' . $laboratorium->logo));
                }

                $logoPath = $request->file('logo')->store('laboratorium-logos', 'public');
                $data['logo'] = $logoPath;

                Log::info('Logo stored at: ' . $logoPath);
            } catch (\Exception $e) {
                Log::error('Error uploading logo: ' . $e->getMessage());
                return back()->withErrors(['logo' => 'Gagal mengupload logo: ' . $e->getMessage()]);
            }
        } else {
            Log::info('No logo file uploaded');
        }

        $laboratorium->update($data);

        Log::info('Laboratorium updated successfully');

        return redirect()->route('laboratorium.index')
            ->with('message', 'Data Laboratorium berhasil diperbarui.');
    }
}
