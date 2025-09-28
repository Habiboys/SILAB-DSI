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
            'version' => '1.1.0',
            'description' => 'Sistem informasi terintegrasi untuk mengelola laboratorium, praktikum, keuangan, dan administrasi laboratorium.',
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
                'quote' => 'if the program works, don\'t touch it',
                'social_media' => [
                    'instagram' => 'https://www.linkedin.com/in/mustafa-fathur-rahman04/',
                    'linkedin' => 'https://linkedin.com/in/mustafa-fathur-rahman',
                    'github' => 'https://github.com/mustafa-fathur'
                ]
            ],
            [
                'name' => 'Rizka Kurnia Ilahi',
                'role' => 'Laboratorium Rekayasa Data & Business Intelligence',
                'photo' => '/images/rizka.jpeg',
                'email' => '2211521012_rizka@student.unand.ac.id',
                'quote' => 'selesaikan apa yang telah di mulai (termasuk error-error itu)',
                'social_media' => [
                    'instagram' => 'https://instagram.com/rizka.icaa',
                    'linkedin' => 'https://id.linkedin.com/in/rizkakurniaillahi',
                    'github' => 'https://github.com/Rizkaicaaa'
                ]
            ],
            [
                'name' => 'Muhammad Nouval Habibie',
                'role' => 'Laboratory Of System Development',
                'photo' => '/images/nouval.jpeg',
                'email' => '2211521020_muhammad@student.unand.ac.id',
                'quote' => 'Capek buat ini ges, pliss follow sosmed aku hehehe 😁👍.',
                'social_media' => [
                    'instagram' => 'https://www.instagram.com/nuval18_/',
                    'linkedin' => 'https://www.linkedin.com/in/nouvalhabibie',
                    'github' => 'https://github.com/Habiboys'
                ]
            ]
        ];

        $serverProviders = [
            [
                'name' => 'Nabil Rizki Navisa',
                'role' => 'Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi',
                'photo' => '/images/nabil.jpeg',
                'email' => '2211522018_nabil@student.unand.ac.id',
                'quote' => 'Makin sedikit yang kau tau makin baik',
                'social_media' => [
                    'instagram' => 'https://instagram.com/nabilrizkinavisa',
                    'linkedin' => 'https://www.linkedin.com/in/nabilrizkinavisa2004',
                    'github' => 'https://github.com/nabilrn'
                ]
            ],
            [
                'name' => 'Khalied Nauly Maturino',
                'role' => 'Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi',
                'photo' => '/images/khalied.jpeg',
                'email' => '2211523030_khalied@student.unand.ac.id',
                'quote' => 'The less you speak, the louder your presence.',
                'social_media' => [
                    'instagram' => 'https://www.instagram.com/khaliedmtrn?igsh=enZ0NGNzb2F5eDE4',
                    'linkedin' => 'https://www.linkedin.com/in/khaliedmtrn/',
                    'github' => 'https://github.com/paybackretr0'
                ]
            ]
        ];

        return Inertia::render('About', [
            'appInfo' => $appInfo,
            'developers' => $developers,
            'serverProviders' => $serverProviders
        ]);
    }
}
