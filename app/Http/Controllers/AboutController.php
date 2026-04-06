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
            'version' => '2.0.0',
            'description' => 'SILAB-DSI adalah platform operasional laboratorium akademik yang mengintegrasikan proses inti dalam satu sistem: inventaris, keuangan, praktikum, absensi, modul, tugas dan penilaian, piket, kegiatan/proker, surat menyurat, kepengurusan, sertifikat, dan kuesioner.',
            'development_story' => 'Pengembangan SILAB-DSI dimulai pada awal tahun 2025 sebagai kelanjutan dari tugas besar mata kuliah Project Based Framework (PBF), lalu dikembangkan bertahap menjadi sistem terintegrasi lintas modul hingga versi 2.0.',
            'features' => [
                'Manajemen Data Master & Kepengurusan',
                'Praktikum Berbasis Kelas/Sub-kelas',
                'Pertemuan, Modul, dan Materi Praktikum',
                'Tugas, Rubrik, Matrix Grading, dan Import/Export Nilai',
                'Absensi Praktikan dan Asisten + Rekap',
                'Manajemen Praktikan dan Aslab',
                'Inventaris Aset',
                'Keuangan, Kas, dan Laporan',
                'Jadwal Piket & Riwayat Absensi Piket',
                'Kegiatan, Proker, LPJ, dan Kalender',
                'Surat Menyurat, Disposisi, dan Arsip',
                'Sertifikat Praktikum/Kegiatan dan Kuesioner'
            ],

        ];

        $developers = [
            [
                'name' => 'Muhammad Nouval Habibie',
                'role' => 'Pengembang Utama (Lead Developer)',
                'type' => 'utama',
                'photo' => '/images/nouval.jpeg',
                'email' => '2211521020_muhammad@student.unand.ac.id',
                'quote' => 'Fokus kami adalah membuat SILAB-DSI stabil, terukur, dan benar-benar membantu operasional laboratorium.',
                'social_media' => [
                    'instagram' => 'https://www.instagram.com/nuval18_/',
                    'linkedin' => 'https://www.linkedin.com/in/nouvalhabibie',
                    'github' => 'https://github.com/Habiboys'
                ]
            ],
            [
                'name' => 'Mustafa Fathur Rahman',
                'role' => 'Tim Pendukung',
                'type' => 'pendukung',
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
                'role' => 'Tim Pendukung',
                'type' => 'pendukung',
                'photo' => '/images/rizka.jpeg',
                'email' => '2211521012_rizka@student.unand.ac.id',
                'quote' => 'selesaikan apa yang telah di mulai (termasuk error-error itu)',
                'social_media' => [
                    'instagram' => 'https://instagram.com/rizka.icaa',
                    'linkedin' => 'https://id.linkedin.com/in/rizkakurniaillahi',
                    'github' => 'https://github.com/Rizkaicaaa'
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
