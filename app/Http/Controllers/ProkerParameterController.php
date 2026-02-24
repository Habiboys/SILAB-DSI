<?php

namespace App\Http\Controllers;

use App\Models\Proker;
use App\Models\ProkerParameter;
use Illuminate\Http\Request;

class ProkerParameterController extends Controller
{
    public function store(Request $request, Proker $proker)
    {
        $this->authorize('update', $proker);

        $request->validate([
            'nama_parameter' => 'required|string|max:255',
            'bobot'          => 'required|integer|min:1|max:100',
        ]);

        $existingBobot = $proker->parameter()->sum('bobot');
        if ($existingBobot + $request->bobot > 100) {
            return back()->withErrors(['bobot' => 'Total bobot semua parameter tidak boleh melebihi 100%.']);
        }

        $maxUrutan = $proker->parameter()->max('urutan') ?? 0;

        ProkerParameter::create([
            'proker_id'      => $proker->id,
            'nama_parameter' => $request->nama_parameter,
            'bobot'          => $request->bobot,
            'urutan'         => $maxUrutan + 1,
        ]);

        return back()->with('message', 'Parameter berhasil ditambahkan.');
    }

    public function update(Request $request, ProkerParameter $parameter)
    {
        $this->authorize('update', $parameter->proker);

        $request->validate([
            'nama_parameter' => 'required|string|max:255',
            'bobot'          => 'required|integer|min:1|max:100',
        ]);

        $existingBobot = $parameter->proker->parameter()
            ->where('id', '!=', $parameter->id)
            ->sum('bobot');

        if ($existingBobot + $request->bobot > 100) {
            return back()->withErrors(['bobot' => 'Total bobot semua parameter tidak boleh melebihi 100%.']);
        }

        $parameter->update([
            'nama_parameter' => $request->nama_parameter,
            'bobot'          => $request->bobot,
        ]);

        return back()->with('message', 'Parameter berhasil diperbarui.');
    }

    public function destroy(ProkerParameter $parameter)
    {
        $this->authorize('update', $parameter->proker);

        $parameter->delete();
        return back()->with('message', 'Parameter berhasil dihapus.');
    }

    /**
     * Update capaian (LPJ fill-in) for a single parameter.
     */
    public function updateCapaian(Request $request, ProkerParameter $parameter)
    {
        $this->authorize('updateProgress', $parameter->proker);

        $request->validate([
            'capaian' => 'nullable|integer|min:0|max:100',
        ]);

        $parameter->update(['capaian' => $request->capaian]);

        return back()->with('message', 'Capaian berhasil disimpan.');
    }
}
