<?php

namespace App\Http\Controllers;

use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaboratoriumController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $laboratorium = Laboratorium::all();
        
        return Inertia::render('DataMaster/Laboratorium', [
            'laboratorium' => $laboratorium
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Laboratorium $laboratorium)
    {
        // Debug: log request data
        \Log::info('Update request data:', $request->all());
        \Log::info('Files:', $request->allFiles());
        
        $request->validate([
            'nama' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $data = ['nama' => $request->nama];
        
        // Handle logo upload
        if ($request->hasFile('logo')) {
            \Log::info('Logo file detected');
            
            try {
                // Delete old logo if exists
                if ($laboratorium->logo && file_exists(public_path('storage/' . $laboratorium->logo))) {
                    unlink(public_path('storage/' . $laboratorium->logo));
                }
                
                // Store new logo
                $logoPath = $request->file('logo')->store('laboratorium-logos', 'public');
                $data['logo'] = $logoPath;
                
                \Log::info('Logo stored at: ' . $logoPath);
            } catch (\Exception $e) {
                \Log::error('Error uploading logo: ' . $e->getMessage());
                return back()->withErrors(['logo' => 'Gagal mengupload logo: ' . $e->getMessage()]);
            }
        } else {
            \Log::info('No logo file uploaded');
        }

        $laboratorium->update($data);

        \Log::info('Laboratorium updated successfully');

        return redirect()->route('laboratorium.index')
            ->with('message', 'Data Laboratorium berhasil diperbarui.');
    }
}