<?php

namespace Database\Seeders;

use App\Models\DokumentasiKegiatan;
use App\Models\Kegiatan;
use App\Models\KegiatanPeserta;
use App\Models\KepengurusanLab;
use App\Models\KepengurusanUser;
use App\Models\LaporanKegiatan;
use App\Models\Proker;
use App\Models\ProkerParameter;
use App\Models\ProkerPj;
use App\Models\Struktur;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProkerKegiatanSeeder extends Seeder
{
    public function run(): void
    {
        $kepLab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
            ->whereHas('tahunKepengurusan')
            ->latest('created_at')
            ->first();

        if (! $kepLab) {
            $this->command?->warn('ProkerKegiatanSeeder: tidak ada data kepengurusan_lab. Seeder dilewati.');
            return;
        }

        $ownerStruktur = Struktur::whereNull('parent_id')->first() ?? Struktur::first();
        if (! $ownerStruktur) {
            $this->command?->warn('ProkerKegiatanSeeder: tidak ada data struktur. Seeder dilewati.');
            return;
        }

        $anggotaAktif = KepengurusanUser::where('kepengurusan_lab_id', $kepLab->id)
            ->where('is_active', true)
            ->pluck('user_id')
            ->unique()
            ->values();

        if ($anggotaAktif->isEmpty()) {
            $fallbackUser = User::first();
            if (! $fallbackUser) {
                $this->command?->warn('ProkerKegiatanSeeder: tidak ada user untuk dijadikan PJ/peserta. Seeder dilewati.');
                return;
            }
            $anggotaAktif = collect([$fallbackUser->id]);
        }

        $approverId = User::role(['admin', 'kadep', 'superadmin'])->value('id') ?? $anggotaAktif->first();

        // === PROKER 1: sudah disetujui + berjalan ===
        $proker1 = Proker::updateOrCreate(
            [
                'kepengurusan_lab_id' => $kepLab->id,
                'nama_proker' => 'Workshop Internal Asisten',
            ],
            [
                'struktur_id' => $ownerStruktur->id,
                'deskripsi' => 'Program penguatan kompetensi asisten melalui workshop rutin.',
                'tujuan' => 'Meningkatkan kompetensi teknis dan soft-skill asisten laboratorium.',
                'sasaran' => 'Seluruh asisten aktif pada periode berjalan.',
                'output_kegiatan' => 'Terselenggara minimal 3 sesi workshop internal.',
                'status' => 'sedang_berjalan',
                'status_pengajuan' => 'disetujui',
                'tanggal_mulai' => now()->startOfMonth()->toDateString(),
                'tanggal_selesai' => now()->addMonths(2)->endOfMonth()->toDateString(),
                'keterangan' => 'Seed data: proker utama periode aktif.',
                'kendala' => 'Sinkronisasi jadwal antar divisi.',
                'solusi' => 'Gunakan polling jadwal mingguan sebelum kegiatan.',
                'saran' => 'Tetapkan PIC cadangan untuk setiap sesi.',
            ]
        );

        ProkerParameter::updateOrCreate(
            ['proker_id' => $proker1->id, 'nama_parameter' => 'Kesesuaian timeline pelaksanaan'],
            ['bobot' => 30, 'capaian' => 85, 'urutan' => 1]
        );
        ProkerParameter::updateOrCreate(
            ['proker_id' => $proker1->id, 'nama_parameter' => 'Kualitas materi workshop'],
            ['bobot' => 40, 'capaian' => 80, 'urutan' => 2]
        );
        ProkerParameter::updateOrCreate(
            ['proker_id' => $proker1->id, 'nama_parameter' => 'Partisipasi peserta'],
            ['bobot' => 30, 'capaian' => 90, 'urutan' => 3]
        );

        foreach ($anggotaAktif->take(2) as $userId) {
            ProkerPj::firstOrCreate([
                'proker_id' => $proker1->id,
                'user_id' => $userId,
            ]);
        }

        // === PROKER 2: masih diajukan ===
        $proker2 = Proker::updateOrCreate(
            [
                'kepengurusan_lab_id' => $kepLab->id,
                'nama_proker' => 'Pelatihan Eksternal Mitra Industri',
            ],
            [
                'struktur_id' => $ownerStruktur->id,
                'deskripsi' => 'Kolaborasi pelatihan dengan mitra industri untuk mahasiswa.',
                'tujuan' => 'Menambah eksposur praktik industri bagi peserta.',
                'sasaran' => 'Asisten dan mahasiswa praktikum tingkat lanjut.',
                'output_kegiatan' => 'Minimal 1 kegiatan pelatihan eksternal.',
                'status' => 'belum_mulai',
                'status_pengajuan' => 'diajukan',
                'tanggal_mulai' => now()->addMonth()->startOfMonth()->toDateString(),
                'tanggal_selesai' => now()->addMonths(2)->endOfMonth()->toDateString(),
                'keterangan' => 'Menunggu approval kepala lab.',
            ]
        );

        ProkerParameter::updateOrCreate(
            ['proker_id' => $proker2->id, 'nama_parameter' => 'Kesiapan mitra & MoU'],
            ['bobot' => 50, 'capaian' => null, 'urutan' => 1]
        );
        ProkerParameter::updateOrCreate(
            ['proker_id' => $proker2->id, 'nama_parameter' => 'Kesiapan materi & narasumber'],
            ['bobot' => 50, 'capaian' => null, 'urutan' => 2]
        );

        foreach ($anggotaAktif->take(2) as $userId) {
            ProkerPj::firstOrCreate([
                'proker_id' => $proker2->id,
                'user_id' => $userId,
            ]);
        }

        // === KEGIATAN untuk PROKER 1 ===
        $kegiatan1 = Kegiatan::updateOrCreate(
            [
                'proker_id' => $proker1->id,
                'nama_kegiatan' => 'Workshop Git & Kolaborasi Tim',
            ],
            [
                'deskripsi_kegiatan' => 'Pelatihan internal mengenai workflow Git, branching, dan code review.',
                'tipe_kegiatan' => 'hybrid',
                'lokasi' => 'Lab Komputer Utama',
                'link_meeting' => 'https://meet.example.com/workshop-git',
                'tanggal_mulai' => now()->subDays(10)->toDateString(),
                'tanggal_selesai' => now()->subDays(10)->toDateString(),
                'status_approval' => 'disetujui',
                'approved_by' => $approverId,
                'approved_at' => now()->subDays(12),
            ]
        );

        $kegiatan2 = Kegiatan::updateOrCreate(
            [
                'proker_id' => $proker1->id,
                'nama_kegiatan' => 'Simulasi Mengajar Praktikum',
            ],
            [
                'deskripsi_kegiatan' => 'Simulasi sesi asistensi untuk peningkatan kualitas penyampaian materi.',
                'tipe_kegiatan' => 'offline',
                'lokasi' => 'Ruang Diskusi Lab',
                'link_meeting' => null,
                'tanggal_mulai' => now()->addDays(14)->toDateString(),
                'tanggal_selesai' => now()->addDays(14)->toDateString(),
                'status_approval' => 'diajukan',
                'approved_by' => null,
                'approved_at' => null,
            ]
        );

        // LPJ contoh untuk kegiatan yang sudah disetujui
        LaporanKegiatan::updateOrCreate(
            [
                'kegiatan_id' => $kegiatan1->id,
                'jenis_laporan' => 'Laporan Pertanggungjawaban (LPJ)',
            ],
            [
                'periode_bulan' => (int) now()->subDays(10)->format('n'),
                'periode_tahun' => (int) now()->format('Y'),
                'deskripsi_capaian' => 'Kegiatan berjalan lancar dengan ketercapaian target peserta 90%.',
                'file_lpj' => null,
            ]
        );

        DokumentasiKegiatan::updateOrCreate(
            [
                'kegiatan_id' => $kegiatan1->id,
                'judul' => 'Dokumentasi Foto Workshop',
            ],
            [
                'file_path' => 'dokumentasi-kegiatan/sample-workshop-foto.jpg',
                'uploaded_by' => $anggotaAktif->first(),
            ]
        );

        foreach ($anggotaAktif->take(3) as $index => $userId) {
            KegiatanPeserta::updateOrCreate(
                [
                    'kegiatan_id' => $kegiatan1->id,
                    'user_id' => $userId,
                ],
                [
                    'peran' => $index === 0 ? 'panitia' : 'peserta',
                    'is_lulus' => true,
                ]
            );
        }

        $this->command?->info('ProkerKegiatanSeeder: sample proker & kegiatan berhasil dibuat/diupdate.');
    }
}
