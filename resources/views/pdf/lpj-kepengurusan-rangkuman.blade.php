<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $lpj->judul }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 25mm 20mm 20mm 30mm;
        }

        * { box-sizing: border-box; }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            color: #000;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }

        p, td, li { text-align: justify; }

        /* ── Header ── */
        .header-title {
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            margin: 0 0 2px 0;
            line-height: 1.3;
        }
        .header-sub {
            font-size: 11pt;
            font-weight: bold;
            text-align: center;
            margin: 0 0 2px 0;
        }
        .header-period {
            font-size: 11pt;
            text-align: center;
            margin: 0;
        }

        /* ── Main table ── */
        table.main {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 11pt;
        }
        table.main th,
        table.main td {
            border: 1px solid #000;
            padding: 5px 7px;
            vertical-align: top;
        }
        table.main th {
            font-weight: bold;
        }
        table.main tr {
            page-break-inside: auto;
        }
        table.main td {
            page-break-inside: auto;
        }
        .col-no     { width: 6%;  text-align: center; }
        .col-uraian { width: 28%; }
        .col-ket    { width: 66%; }

        /* ── Signature ── */
        .sig-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        .sig-cell {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 10px;
        }
        .sig-cell p { text-align: center; }
        .sig-spacer { height: 80px; display: block; }
        .sig-img-wrap {
            height: 80px;
            text-align: center;
        }
        .sig-img-wrap img {
            max-height: 78px;
            max-width: 200px;
        }
        p { margin: 4px 0; }
    </style>
</head>
<body>

    {{-- ── Compute variables ───────────────────────── --}}
    @php
        $namaFakultas   = env('APP_FAKULTAS', 'Fakultas Teknologi Informasi');
        $namaDepartemen = env('APP_DEPARTEMEN', 'Departemen Sistem Informasi');
        $namaUniversitas = env('APP_UNIVERSITAS', 'Universitas Andalas');

        $labNama = strtoupper($lpj->kepengurusanLab?->laboratorium?->nama ?? '');
        $tahun   = $lpj->kepengurusanLab?->tahunKepengurusan;

        $bulanId = [
            1=>'Januari',2=>'Februari',3=>'Maret',4=>'April',
            5=>'Mei',6=>'Juni',7=>'Juli',8=>'Agustus',
            9=>'September',10=>'Oktober',11=>'November',12=>'Desember',
        ];

        $jadwal = '-';
        if ($tahun?->mulai && $tahun?->selesai) {
            $mulai   = \Carbon\Carbon::parse($tahun->mulai);
            $selesai = \Carbon\Carbon::parse($tahun->selesai);
            if ($mulai->year === $selesai->year) {
                $jadwal = $bulanId[$mulai->month] . ' – ' . $bulanId[$selesai->month] . ' ' . $mulai->year;
            } else {
                $jadwal = $bulanId[$mulai->month] . ' ' . $mulai->year
                    . ' – ' . $bulanId[$selesai->month] . ' ' . $selesai->year;
            }
        } elseif ($tahun?->tahun) {
            $jadwal = $tahun->tahun;
        }

        $tanggalSkFormatted = '-';
        if (!empty($form['tanggal_sk'])) {
            try {
                $ts = \Carbon\Carbon::parse($form['tanggal_sk']);
                $tanggalSkFormatted = $ts->day . ' ' . $bulanId[$ts->month] . ' ' . $ts->year;
            } catch (\Exception $e) {
                $tanggalSkFormatted = $form['tanggal_sk'];
            }
        }

        $tglBase = !empty($form['tanggal_sk']) ? $form['tanggal_sk'] : ($lpj->approved_at ?? $lpj->generated_at ?? now());
        $tgl = \Carbon\Carbon::parse($tglBase);
        $tglFmt = 'Padang, ' . $tgl->day . ' ' . $bulanId[$tgl->month] . ' ' . $tgl->year;

        // Personalia
        $kadep     = $personalia['kadep'];
        $kepalaLab = $personalia['kepala_lab'];
        $kadepNip  = $kadep?->profile?->nomor_induk ?? null;
        $kaLabNip  = $kepalaLab?->profile?->nomor_induk ?? null;

        // Convert TTD to base64 so dompdf can embed it without symlink issues
        $kadepTtdSrc  = null;
        $kaLabTtdSrc  = null;
        if ($with_ttd) {
            $kadepTtdPath = $kadep?->profile?->tanda_tangan ?? null;
            if ($kadepTtdPath) {
                $fullPath = storage_path('app/public/' . $kadepTtdPath);
                if (file_exists($fullPath)) {
                    $mime = mime_content_type($fullPath);
                    $kadepTtdSrc = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($fullPath));
                }
            }

            $kaLabTtdPath = $kepalaLab?->profile?->tanda_tangan ?? null;
            if ($kaLabTtdPath) {
                $fullPath = storage_path('app/public/' . $kaLabTtdPath);
                if (file_exists($fullPath)) {
                    $mime = mime_content_type($fullPath);
                    $kaLabTtdSrc = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($fullPath));
                }
            }
        }
    @endphp

    {{-- ── Header ─────────────────────────────── --}}
    <p class="header-title">Laporan Kinerja Laboratorium {{ $labNama }}</p>
    <p class="header-sub">{{ $namaFakultas }} {{ $namaUniversitas }}</p>
    <p class="header-period">{{ $jadwal }}</p>

    {{-- ── Main Table ───────────────────────────── --}}
    <table class="main">
        <thead>
            <tr>
                <th class="col-no">No</th>
                <th class="col-uraian">Uraian</th>
                <th class="col-ket">Keterangan</th>
            </tr>
        </thead>
        <tbody>

            <tr>
                <td class="col-no">1</td>
                <td>DASAR</td>
                <td>{{ $form['dasar'] ?: '-' }}</td>
            </tr>

            <tr>
                <td class="col-no">2</td>
                <td>JUDUL SURAT KEPUTUSAN</td>
                <td>{{ $form['judul_surat_keputusan'] ?: '-' }}</td>
            </tr>

            <tr>
                <td class="col-no">3</td>
                <td>TANGGAL SK</td>
                <td>{{ $tanggalSkFormatted }}</td>
            </tr>

            <tr>
                <td class="col-no">4</td>
                <td>JADWAL KEGIATAN</td>
                <td>{{ !empty($form['jadwal_kegiatan']) ? $form['jadwal_kegiatan'] : $jadwal }}</td>
            </tr>

            <tr>
                <td class="col-no">5</td>
                <td>PERSONALIA</td>
                <td>
                    @if($personalia['kepala_lab'])
                        Kepala: {{ $personalia['kepala_lab']->name }}<br>
                    @endif
                    @if(!empty($personalia['dosen_anggota']))
                        Anggota:<br>
                        @foreach($personalia['dosen_anggota'] as $dosen)
                            - {{ $dosen->name }}<br>
                        @endforeach
                    @endif
                    @if(!$personalia['kepala_lab'] && empty($personalia['dosen_anggota']))
                        -
                    @endif
                </td>
            </tr>

            <tr>
                <td class="col-no">6</td>
                <td>ASISTEN LABORATORIUM</td>
                <td>
                    @forelse($personalia['asisten'] as $ast)
                        - {{ $ast->name }}<br>
                    @empty
                        -
                    @endforelse
                </td>
            </tr>

            <tr>
                <td class="col-no">7</td>
                <td>URAIAN PELAKSANAAN KEGIATAN</td>
                <td>
                    @php
                        $grouped = collect($detail['prokers'] ?? [])
                            ->groupBy(fn($p) => $p['struktur'] ?? 'Umum');
                        $divisiLettersR = range('A', 'Z');
                        $divisiIdxR = 0;
                    @endphp
                    @forelse($grouped as $divisi => $prokerList)
                        <strong>{{ $divisiLettersR[$divisiIdxR++] }}. {{ $divisi }}:</strong><br>
                        @foreach($prokerList as $num => $proker)
                            {{ $num + 1 }}. {{ $proker['nama_proker'] }}<br>
                            @foreach($proker['kegiatan'] as $kg)
                                &nbsp;&nbsp;&nbsp;- {{ $kg['nama_kegiatan'] }}<br>
                            @endforeach
                        @endforeach
                        <br>
                    @empty
                        -
                    @endforelse
                </td>
            </tr>

            <tr>
                <td class="col-no">8</td>
                <td>KESIMPULAN</td>
                <td>{{ !empty($form['kesimpulan']) ? $form['kesimpulan'] : 'Kegiatan telah dilaksanakan dengan baik mencakup aspek manajerial, akademik, dan operasional laboratorium.' }}</td>
            </tr>

        </tbody>
    </table>

    {{-- ── Penutup ───────────────────────────────── --}}
    <p style="margin-top: 14px;">
        {{ !empty($form['penutup']) ? $form['penutup'] : 'Demikian laporan ini disampaikan, atas perhatian dan kesempatan yang diberikan diucapkan terima kasih.' }}
    </p>
    <p style="margin-top: 10px; text-align: right;">{{ $tglFmt }}</p>

    {{-- ── Tanda Tangan ─────────────────────────── --}}
    <table class="sig-table">
        <tr>
            <td class="sig-cell">
                <p style="margin:0;">Mengetahui,</p>
                <p style="margin:0;">Ketua {{ $namaDepartemen }}</p>
                @if($kadepTtdSrc)
                    <div class="sig-img-wrap"><img src="{{ $kadepTtdSrc }}" alt="TTD"></div>
                @else
                    <span class="sig-spacer"></span>
                @endif
                <p style="margin:0;font-weight:bold;">{{ $kadep?->name ?? '___________________' }}</p>
                @if($kadepNip)<p style="margin:0;">NIP. {{ $kadepNip }}</p>@endif
            </td>
            <td class="sig-cell">
                <p style="margin:0;">Kepala Laboratorium {{ $lpj->kepengurusanLab?->laboratorium?->nama ?? '' }}</p>
                <p style="margin:0;">{{ $namaDepartemen }} &ndash; {{ $namaFakultas }}</p>
                @if($kaLabTtdSrc)
                    <div class="sig-img-wrap"><img src="{{ $kaLabTtdSrc }}" alt="TTD"></div>
                @else
                    <span class="sig-spacer"></span>
                @endif
                <p style="margin:0;font-weight:bold;">{{ $kepalaLab?->name ?? '___________________' }}</p>
                @if($kaLabNip)<p style="margin:0;">NIP. {{ $kaLabNip }}</p>@endif
            </td>
        </tr>
    </table>

</body>
</html>
