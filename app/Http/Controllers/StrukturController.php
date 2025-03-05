<?php

namespace App\Http\Controllers;

use App\Models\Struktur;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StrukturController extends Controller
{
    
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
    
        $struktur = $lab_id 
            ? Struktur::where('laboratorium_id', $lab_id)->get()
            : Struktur::all();
    
        return Inertia::render('Struktur', [
            'struktur' => $struktur
        ]);
    }


    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'struktur' => 'required|string|max:255',
            'laboratorium_id' => 'required|exists:laboratorium,id'
        ]);

        Struktur::create($validatedData);

        return back()->with('message', 'Struktur berhasil ditambahkan');
    }

    public function update(Request $request, Struktur $struktur)
    {
        $validatedData = $request->validate([
            'struktur' => 'required|string|max:255',
            'laboratorium_id' => 'required|exists:laboratorium,id'
        ]);

        $struktur->update($validatedData);

        return back()->with('message', 'Struktur berhasil diperbarui');
    }

    public function destroy(Struktur $struktur)
    {
        $struktur->delete();

        return back()->with('message', 'Struktur berhasil dihapus');
    }
}