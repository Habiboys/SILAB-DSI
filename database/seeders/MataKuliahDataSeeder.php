<?php

namespace Database\Seeders;

use App\Models\MataKuliah;
use Illuminate\Database\Seeder;

class MataKuliahDataSeeder extends Seeder
{
    public function run(): void
    {
        $rows = <<<'DATA'
MWU60102|Pancasila|2|1
MWU60104|Bahasa Indonesia|2|1
DSI61101|Konsep Sistem Informasi|2|1
DSI61102|Pengantar Bisnis dan Manajemen|2|1
DSI61103|Komunikasi Bisnis dan Teknis|2|1
DSI61104|Algoritma dan Pemrograman Dasar|3|1
DSI61105|Matematika Diskrit|3|1
DSI61106|Aljabar Linear|2|1
DSI61107|Bahasa Inggris|2|1
JSI61101|Pengantar Bisnis dan Manajemen|3|1
JSI61103|Dasar-dasar Pemrograman|3|1
JSI61104|Aljabar Linear|2|1
JSI61105|Matematika Diskrit|2|1
JSI61106|Dasar-Dasar Sistem Informasi|2|1
JSI62127|Komunikasi Bisnis dan Teknis|2|1
MWU60101|Pendidikan Agama|2|2
MWU60103|Kewarganegaraan|2|2
DSI62108|Basis Data|3|2
DSI62109|Infrastruktur Teknologi Informasi|2|2
DSI62110|Manajemen Proses Bisnis|3|2
DSI62111|Rekayasa Perangkat Lunak|2|2
DSI62112|Perancangan Antarmuka Pengguna|3|2
DSI62113|Struktur Data|3|2
JSI62107|Interaksi Manusia dan Komputer|3|2
JSI62108|Struktur Data dan Algoritma|3|2
JSI62109|Infrastruktur Teknologi Informasi|2|2
JSI62110|Probabilitas dan Statistik|2|2
JSI62111|Kalkulus|2|2
JSI62112|Bahasa Inggris|2|2
AND60102|Kewirausahaan|3|3
DSI61114|Perancangan Basis Data|3|3
DSI61115|Sistem Operasi|2|3
DSI61116|Analisis dan Perancangan Sistem Informasi|3|3
DSI61117|Pemrograman Berorientasi Objek|3|3
DSI61118|Statistika dan Probabilitas|3|3
DSI61119|Big Data|3|3
JSI61113|Basis Data|3|3
JSI61114|Sistem Informasi Geografis|3|3
JSI61115|Proses Bisnis|3|3
JSI61116|Pemrograman Berorientasi Objek|3|3
JSI61117|Jaringan dan Komunikasi Data|2|3
JSI61118|Sistem Operasi|2|3
JSI61119|Komputer dan Masyarakat|2|3
AND61102|Kewirausahaan|3|3
DSI62120|Jaringan Komputer|3|4
DSI62121|Perencanaan Strategis Teknologi Informasi|3|4
DSI62122|Pemrograman Web|3|4
DSI62123|Keamanan Sistem Informasi|3|4
DSI62124|Data Mining|3|4
DSI62125|Analitik dan Visualisasi Data|2|4
DSI62126|Sistem Pendukung Keputusan|3|4
JSI62120|Perancangan Basis Data|3|4
JSI62121|Analisa dan Visualisasi Data|2|4
JSI62122|Data Mining|3|4
JSI62123|Keamanan Informasi|2|4
JSI62124|Sistem Penunjang Keputusan|3|4
JSI62125|Pemograman Web|3|4
JSI62126|Rekayasa Perangkat Lunak|2|4
JSI62145|Enterprise Resource Planning|3|4
DSI61127|Sistem Informasi Geografis|3|5
DSI61128|Manajemen Proyek Sistem Informasi|3|5
DSI61129|Enterprise Resource Planning|3|5
DSI61130|Pemrograman Mobile|3|5
DSI61131|Etika Profesi|2|5
DSI61132|Business Intelligence|3|5
DSI61133|Machine Learning|3|5
JSI61128|e-Bisnis|3|5
JSI61129|Akuisisi Data|2|5
JSI61130|Strategi Pengelolaan dan Perolehan SI|2|5
JSI61131|Pemrograman Teknologi Bergerak|3|5
JSI61132|Analisa dan Perancangan SI|3|5
JSI61134|Manajemen Proyek SI|3|5
JSI61141|Perancangan Sistem Enterprise|2|5
PILIHANV|Mata Kuliah Pilihan|3|5
DSI62134|Transformasi Digital|2|6
DSI62135|E-Bisnis|3|6
DSI62136|Tata Kelola Teknologi Informasi|3|6
DSI62137|Pengujian Perangkat Lunak|2|6
DSI62138|Enterprise Architecture|3|6
DSI60139|Kerja Praktik|2|6
PILIHANVI|Mata Kuliah Pilihan|6|6
JSI62135|Big Data|2|6
JSI62136|Intelegensi Bisnis|2|6
JSI62138|Aplikasi Pembelajaran Mesin|3|6
JSI62139|Komputasi Awan|2|6
JSI62140|Audit Sistem Informasi|2|6
AND60101|KKN|4|6
JSI61137|Inovasi Sistem Informasi|2|6
DSI60140|Proyek Pengembangan Sistem Informasi|4|7
DSI61141|Audit Sistem Informasi|3|7
DSI60142|Metode Penelitian|2|7
PILIHANVII|Mata Kuliah Pilihan|6|7
JSI61133|Proyek Pengembangan SI|4|7
JSI61142|Kerja Praktik/Magang|2|7
JSI61143|Metode Penelitian|2|7
DSI60143|Tugas Akhir|4|8
JSI60150|Tugas Akhir|4|8
PILIHANVIII|Mata Kuliah Pilihan|3|8
DATA;

        foreach (explode("\n", trim($rows)) as $row) {
            [$kode, $nama, $sks, $semester] = explode('|', $row);
            MataKuliah::updateOrCreate(
                ['kode_mata_kuliah' => $kode],
                ['nama' => $nama, 'sks' => $sks, 'semester' => $semester, 'status' => 'aktif']
            );
        }
    }
}
