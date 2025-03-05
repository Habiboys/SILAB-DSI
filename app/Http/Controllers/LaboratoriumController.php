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
        $tahunKepengurusan = Laboratorium::all();
        
        return Inertia::render('TahunKepengurusan', [
            'tahunKepengurusan' => $tahunKepengurusan
        ]);
    }

}