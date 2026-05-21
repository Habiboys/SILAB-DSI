<?php

namespace App\Http\Controllers;

use App\Models\PengaturanPiket;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PengaturanPiketController extends Controller
{

    public function upsert(Request $request)
    {
        try {
            $validated = $request->validate([
                'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
                'ada_denda'           => 'required|boolean',
                'nominal_denda'       => 'nullable|numeric|min:0',
            ]);

            if (!$validated['ada_denda']) {
                $validated['nominal_denda'] = null;
            } elseif (empty($validated['nominal_denda'])) {
                throw ValidationException::withMessages([
                    'nominal_denda' => 'Nominal denda wajib diisi jika ada denda.',
                ]);
            }

            PengaturanPiket::updateOrCreate(
                ['kepengurusan_lab_id' => $validated['kepengurusan_lab_id']],
                [
                    'ada_denda'     => $validated['ada_denda'],
                    'nominal_denda' => $validated['nominal_denda'],
                ]
            );

            return redirect()->back()->with('success', 'Pengaturan denda piket berhasil disimpan.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menyimpan pengaturan: ' . $e->getMessage())->withInput();
        }
    }
}
