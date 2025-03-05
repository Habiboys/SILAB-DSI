<?php

namespace App\Http\Controllers;

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnggotaController extends Controller
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