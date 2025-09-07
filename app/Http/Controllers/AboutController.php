<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AboutController extends Controller
{
    public function index()
    {
        $appInfo = [
            'name' => 'SILAB-DSI',
            'full_name' => 'Sistem Informasi Laboratorium Departemen Sistem Informasi',
            'version' => '1.0.0',
            'description' => 'Sistem informasi terintegrasi untuk mengelola laboratorium, praktikum, keuangan, dan administrasi departemen.',
            'features' => [
                'Manajemen Laboratorium',
                'Sistem Praktikum',
                'Keuangan dan Laporan',
                'Jadwal Piket',
                'Inventaris Aset',
                'Surat Menyurat',
                'Manajemen Anggota'
            ],
  
        ];

        $developers = [
            [
                'name' => 'Mustafa Fathur Rahman',
                'role' => 'Laboratory Of System Development',
                'photo' => '/images/fathur.png',
                'email' => '2211522036_mustafa@student.unand.ac.id',
                // 'description' => 'Bertanggung jawab atas pengembangan backend, database, dan integrasi sistem.',

            ],
            [
                'name' => 'Rizka Kurnia Ilahi',
                'role' => 'Laboratorium Rekayasa Data & Business Intelligence',
                'photo' => '/images/rizka.jpeg',
                'email' => '2211521012_rizka@student.unand.ac.id',
                // 'description' => 'Bertanggung jawab atas pengembangan interface, user experience, dan responsive design.',
        
            ],
            [
                'name' => 'Muhammad Nouval Habibie',
                'role' => 'Laboratory Of System Development',
                'photo' => '/images/nouval.jpeg',
                'email' => '2211521020_muhammad@student.unand.ac.id',
                // 'description' => 'Bertanggung jawab atas analisis sistem, dokumentasi, dan manajemen proyek.',
     
            ]
        ];

        return Inertia::render('About', [
            'appInfo' => $appInfo,
            'developers' => $developers
        ]);
    }
}
