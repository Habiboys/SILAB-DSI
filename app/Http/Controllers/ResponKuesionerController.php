<?php

namespace App\Http\Controllers;

use App\Models\Kuesioner;
use App\Models\ResponKuesioner;
use App\Models\JawabanKuesioner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ResponKuesionerController extends Controller
{
    public function store(Request $request, Kuesioner $kuesioner)
    {
        // Check if user has already submitted if intended for single response
        // For now, assume multiple responses allowed or handle unique constraint in DB/Model logic if needed
        // Typically surveys are once per user
        $existing = ResponKuesioner::where('kuesioner_id', $kuesioner->id)
            ->where('user_id', auth()->id())
            ->first();

        if ($existing) {
             return redirect()->back()->with('error', 'Anda sudah mengisi kuesioner ini.');
        }

        $request->validate([
            'jawaban' => 'required|array',
            'jawaban.*.pertanyaan_id' => 'required|exists:pertanyaan_kuesioner,id',
            'jawaban.*.jawaban' => 'required', // Validation logic can be more complex based on question type
        ]);

        DB::transaction(function () use ($request, $kuesioner) {
            $respon = ResponKuesioner::create([
                'kuesioner_id' => $kuesioner->id,
                'user_id' => auth()->id(),
                'tanggal_submit' => now(),
            ]);

            foreach ($request->jawaban as $answer) {
                // Handle array answers (checkboxes) by encoding to JSON
                $value = is_array($answer['jawaban']) ? json_encode($answer['jawaban']) : $answer['jawaban'];
                
                JawabanKuesioner::create([
                    'respon_id' => $respon->id,
                    'pertanyaan_id' => $answer['pertanyaan_id'],
                    'jawaban' => $value,
                ]);
            }
        });

        return redirect()->route('dashboard')->with('success', 'Terima kasih telah mengisi kuesioner.');
    }
}
