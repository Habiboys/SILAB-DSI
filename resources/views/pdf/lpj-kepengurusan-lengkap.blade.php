<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>LPJ - {{ $lpj->judul }}</title>
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
            line-height: 1.5;
        }

        p, td, li { text-align: justify; }

        /* ── Cover ── */
        .cover {
            text-align: center;
            page-break-after: always;
            position: relative;
            height: 252mm;
        }
        .cover p {
            text-align: center;
        }
        .cover-top {
            padding-top: 10mm;
        }
        .cover-title {
            font-size: 15pt;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.4;
            margin: 0 0 5px 0;
        }
        .cover-jadwal {
            font-size: 12pt;
            font-weight: bold;
            margin: 4px 0 0 0;
        }
        .cover-logo-wrap {
            margin-top: 38mm;
            min-height: 36mm;
        }
        .cover-logo {
            max-height: 150px;
            max-width: 280px;
        }
        .cover-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
        }
        .cover-dept {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 2px 0;
            line-height: 1.5;
        }
        .cover-year {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 6px 0 0 0;
            line-height: 1.5;
        }

        /* ── Divisi header ── */
        .divisi-header {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            margin: 0 0 18px 0;
        }

        /* ── Proker block ── */
        .proker-block {
            margin-bottom: 20px;
            page-break-inside: auto;
        }
        .proker-title {
            font-size: 12pt;
            font-weight: bold;
            margin: 0 0 14px 0;
        }

        /* ── Section label ── */
        .section-label {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 16px 0 8px 0;
        }

        /* ── Info grid ── */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5pt;
            margin-bottom: 6px;
        }
        .info-table td {
            vertical-align: top;
            padding: 2px 4px;
        }
        .info-table td.label {
            width: 30%;
            font-weight: bold;
        }
        .info-table td.sep {
            display: none;
        }
        .info-table-bordered td {
            border: 1px solid #000;
            padding: 4px 6px;
        }
        .info-table-bordered td.label {
            width: 30%;
            font-weight: bold;
            border-right: 0;
        }
        .info-table-bordered td.sep {
            display: none;
        }

        /* ── Parameter table ── */
        table.param {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5pt;
            margin-bottom: 8px;
        }
        table.param th,
        table.param td {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: top;
        }
        table.param th {
            font-weight: bold;
            text-align: center;
        }
        table.param td.center { text-align: center; }
        table.param tr.total-row td {
            font-weight: bold;
        }

        /* ── Kegiatan table ── */
        table.kegiatan {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-bottom: 8px;
            page-break-inside: auto;
        }
        table.kegiatan th,
        table.kegiatan td {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: top;
        }
        table.kegiatan th {
            font-weight: bold;
            text-align: center;
        }
        table.kegiatan tr { page-break-inside: auto; }
        table.kegiatan td { page-break-inside: auto; }

        /* ── Dokumentasi foto grid ── */
        .foto-grid {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .foto-grid td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 4px;
        }
        .foto-grid img {
            max-width: 100%;
            max-height: 90px;
            border: 1px solid #ccc;
        }
        .foto-caption {
            font-size: 9pt;
            margin-top: 2px;
            text-align: center;
            color: #444;
        }

        .no-data {
            font-size: 10pt;
            color: #666;
            font-style: italic;
        }

        p { margin: 3px 0; }

        /* ── Lembar Pengesahan ── */
        .pengesahan-page {
            padding-top: 10mm;
        }
        .pengesahan-title {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 18px;
        }
        .pengesahan-body {
            font-size: 11pt;
            line-height: 1.7;
            text-align: justify;
            text-indent: 36px;
            margin-bottom: 20px;
        }
        .sig3-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .sig3-cell {
            text-align: center;
            vertical-align: top;
            padding: 0 6px;
        }
        .sig3-cell p { text-align: center; }
        .sig3-line {
            width: 85%;
            height: 68px;
            margin: 0 auto 6px auto;
        }
        .sig3-name { font-weight: bold; margin: 0; }
        .sig3-nim  { margin: 0; font-size: 10pt; }
        .sig3-nip  { margin: 0; font-size: 10pt; }
    </style>
</head>
<body>

@php
    $bulanId = [
        1=>'Januari',2=>'Februari',3=>'Maret',4=>'April',
        5=>'Mei',6=>'Juni',7=>'Juli',8=>'Agustus',
        9=>'September',10=>'Oktober',11=>'November',12=>'Desember',
    ];

    $labNama  = $lpj->kepengurusanLab?->laboratorium?->nama ?? '';
    $tahun    = $lpj->kepengurusanLab?->tahunKepengurusan;
    $logoPath = $lpj->kepengurusanLab?->laboratorium?->logo ?? null;

    $jadwal = '-';
    if ($tahun?->mulai && $tahun?->selesai) {
        $mulai   = \Carbon\Carbon::parse($tahun->mulai);
        $selesai = \Carbon\Carbon::parse($tahun->selesai);
        if ($mulai->year === $selesai->year) {
            $jadwal = $bulanId[$mulai->month] . ' – ' . $bulanId[$selesai->month] . ' ' . $mulai->year;
        } else {
            $jadwal = $bulanId[$mulai->month] . ' ' . $mulai->year . ' – ' . $bulanId[$selesai->month] . ' ' . $selesai->year;
        }
    } elseif ($tahun?->tahun) {
        $jadwal = $tahun->tahun;
    }

    $logoSrc = null;
    if ($logoPath) {
        $logoFull = storage_path('app/public/' . $logoPath);
        if (file_exists($logoFull)) {
            $mime    = mime_content_type($logoFull);
            $logoSrc = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($logoFull));
        }
    }

    $statusMap = [
        'belum_mulai'     => 'Belum Mulai',
        'sedang_berjalan' => 'Sedang Berjalan',
        'selesai'         => 'Selesai',
        'ditunda'         => 'Ditunda',
    ];
    $approvalMap = [
        'draft'     => 'Draft',
        'diajukan'  => 'Diajukan',
        'disetujui' => 'Disetujui',
        'ditolak'   => 'Ditolak',
    ];
@endphp

{{-- ══ COVER ══════════════════════════════════════════════════════════════ --}}
<div class="cover">
    {{-- Judul di atas --}}
    <div class="cover-top">
        <p class="cover-title">Laporan Pertanggungjawaban (LPJ)<br>{{ strtoupper($labNama) }}</p>
        <p class="cover-jadwal">Periode {{ $jadwal }}</p>
    </div>

    {{-- Logo di tengah --}}
    <div class="cover-logo-wrap">
        @if($logoSrc)
            <img class="cover-logo" src="{{ $logoSrc }}" alt="Logo Lab">
        @endif
    </div>

    <div class="cover-bottom">
        {{-- Identitas institusi dari .env (paling bawah halaman) --}}
        <p class="cover-dept">{{ env('APP_FAKULTAS', 'Fakultas Teknologi Informasi') }}</p>
        <p class="cover-dept">{{ env('APP_DEPARTEMEN', 'Departemen Sistem Informasi') }}</p>
        <p class="cover-dept">{{ env('APP_UNIVERSITAS', 'Universitas Andalas') }}</p>

        {{-- Tahun di bawah --}}
        <p class="cover-year">{{ $tahun?->tahun ?? now()->year }}</p>
    </div>
</div>

{{-- ══ LEMBAR PENGESAHAN ═════════════════════════════════════════════════ --}}
@php
    $kordas    = $personalia['koordinator_asisten'] ?? null;
    $sek       = $personalia['sekretaris'] ?? null;
    $kepalaLab = $personalia['kepala_lab'] ?? null;

    $tglNow = now();
    $bulanIdLp = [
        1=>'Januari',2=>'Februari',3=>'Maret',4=>'April',
        5=>'Mei',6=>'Juni',7=>'Juli',8=>'Agustus',
        9=>'September',10=>'Oktober',11=>'November',12=>'Desember',
    ];
    $tglPengesahan = 'Padang, ' . $tglNow->day . ' ' . $bulanIdLp[$tglNow->month] . ' ' . $tglNow->year;

    $kepalaLabNip = $kepalaLab?->profile?->nomor_induk ?? null;
    $kordasNim    = $kordas?->user?->profile?->nomor_induk ?? null;
    $sekNim       = $sek?->user?->profile?->nomor_induk ?? null;
@endphp

<div class="pengesahan-page">
    <p class="pengesahan-title">Lembar Pengesahan</p>

    <p class="pengesahan-body">
        Laporan Pertanggungjawaban (LPJ) Laboratorium {{ $labNama }} periode {{ $jadwal }} ini disusun
        sebagai bentuk pertanggungjawaban atas pelaksanaan program kerja, kegiatan operasional, serta
        pengelolaan laboratorium selama periode kepengurusan yang telah berlangsung. Laporan ini memuat
        uraian kegiatan, capaian pelaksanaan, evaluasi, serta kendala yang dihadapi sebagai bahan peninjauan
        dan evaluasi untuk peningkatan pengelolaan laboratorium pada periode selanjutnya. Setelah dilakukan
        pemeriksaan dan penelaahan, laporan ini dinyatakan dapat diterima dan disahkan.
    </p>

    <p style="text-align:center; margin-bottom: 20px;">{{ $tglPengesahan }}</p>

    {{-- Baris 1: Disusun oleh (Kordas + Sekretaris) --}}
    <p style="text-align:center; margin: 0 0 2px 0;">Disusun oleh,</p>
    <table class="sig3-table" style="margin-bottom: 28px;">
        <tr>
            <td class="sig3-cell" style="width:50%;">
                <p style="margin:0;">{{ $kordas?->jabatan ?? 'Koordinator Asisten' }}</p>
                <div class="sig3-line"></div>
                <p class="sig3-name">{{ $kordas?->user?->name ?? '&nbsp;' }}</p>
                @if($kordasNim)<p class="sig3-nim">NIM. {{ $kordasNim }}</p>@endif
            </td>
            <td class="sig3-cell" style="width:50%;">
                <p style="margin:0;">{{ $sek?->jabatan ?? 'Sekretaris' }}</p>
                <div class="sig3-line"></div>
                <p class="sig3-name">{{ $sek?->user?->name ?? '&nbsp;' }}</p>
                @if($sekNim)<p class="sig3-nim">NIM. {{ $sekNim }}</p>@endif
            </td>
        </tr>
    </table>

    {{-- Baris 2: Disetujui oleh (Kepala Lab, tengah) --}}
    <p style="text-align:center; margin: 0 0 2px 0;">Disetujui dan Disahkan oleh,</p>
    <table class="sig3-table">
        <tr>
            <td class="sig3-cell" style="width:25%;"></td>
            <td class="sig3-cell" style="width:50%;">
                <p style="margin:0;">Kepala Laboratorium {{ $labNama }}</p>
                <div class="sig3-line"></div>
                <p class="sig3-name">{{ $kepalaLab?->name ?? '&nbsp;' }}</p>
                @if($kepalaLabNip)<p class="sig3-nip">NIP. {{ $kepalaLabNip }}</p>@endif
            </td>
            <td class="sig3-cell" style="width:25%;"></td>
        </tr>
    </table>
</div>

{{-- ══ ISI PER DIVISI ════════════════════════════════════════════════════ --}}
@php
    $prokerNo = 0;
    $toAlpha = function ($num) {
        $letters = '';
        while ($num > 0) {
            $num--;
            $letters = chr(65 + ($num % 26)) . $letters;
            $num = intdiv($num, 26);
        }
        return $letters;
    };
@endphp
@foreach($detail['divisi'] as $divisiIdx => $divisi)

    <div style="page-break-before: always;">
        <p class="divisi-header">{{ $divisi['nama'] }}</p>

        @foreach($divisi['proker'] as $prokerIdx => $proker)
        <div class="proker-block" @if($prokerIdx > 0) style="page-break-before: always;" @endif>

            @php $sectionNo = 1; @endphp

            {{-- Judul Proker --}}
            <p class="proker-title">
                {{ $toAlpha(++$prokerNo) }}. {{ strtoupper($proker['nama_proker']) }}
            </p>

            {{-- Info Umum --}}
            <p class="section-label">{{ $sectionNo++ }}. INFORMASI UMUM</p>
            <table class="info-table info-table-bordered">
                @if($proker['pj'])
                <tr>
                    <td class="label">Penanggung Jawab</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['pj'] }}</td>
                </tr>
                @endif
                <tr>
                    <td class="label">Status Pelaksanaan</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['status'] }}</td>
                </tr>
                <tr>
                    <td class="label">Periode</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['tanggal_mulai'] }} – {{ $proker['tanggal_selesai'] }}</td>
                </tr>
                @if($proker['deskripsi'])
                <tr>
                    <td class="label">Deskripsi</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['deskripsi'] }}</td>
                </tr>
                @endif
                @if($proker['tujuan'])
                <tr>
                    <td class="label">Tujuan</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['tujuan'] }}</td>
                </tr>
                @endif
                @if($proker['sasaran'])
                <tr>
                    <td class="label">Sasaran</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['sasaran'] }}</td>
                </tr>
                @endif
                @if($proker['output_kegiatan'])
                <tr>
                    <td class="label">Output Kegiatan</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['output_kegiatan'] }}</td>
                </tr>
                @endif
            </table>

            {{-- Parameter Keberhasilan --}}
            @if(!empty($proker['parameter']))
            <p class="section-label">{{ $sectionNo++ }}. PARAMETER KEBERHASILAN</p>
            <table class="param">
                <thead>
                    <tr>
                        <th style="width:5%">No</th>
                        <th style="width:50%">Parameter</th>
                        <th style="width:15%">Bobot (%)</th>
                        <th style="width:15%">Capaian (%)</th>
                        <th style="width:15%">Tertimbang (%)</th>
                    </tr>
                </thead>
                <tbody>
                    @php $totalBobot = 0; $totalTertimbang = 0; @endphp
                    @foreach($proker['parameter'] as $i => $param)
                        @php
                            $tertimbang = (!is_null($param['capaian']) && $param['bobot'])
                                ? round(($param['bobot'] * $param['capaian']) / 100, 1)
                                : null;
                            $totalBobot += $param['bobot'];
                            $totalTertimbang += $tertimbang ?? 0;
                        @endphp
                        <tr>
                            <td class="center">{{ $i + 1 }}</td>
                            <td>{{ $param['nama'] }}</td>
                            <td class="center">{{ $param['bobot'] }}</td>
                            <td class="center">{{ is_null($param['capaian']) ? '-' : $param['capaian'] }}</td>
                            <td class="center">{{ is_null($tertimbang) ? '-' : $tertimbang }}</td>
                        </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="2" class="center">Total</td>
                        <td class="center">{{ $totalBobot }}</td>
                        <td class="center">-</td>
                        <td class="center">{{ round($totalTertimbang, 1) }}</td>
                    </tr>
                </tbody>
            </table>
            @endif

            {{-- Kendala, Solusi, Saran --}}
            @if($proker['kendala'] || $proker['solusi'] || $proker['saran'])
            <p class="section-label">{{ $sectionNo++ }}. EVALUASI</p>
            <table class="info-table">
                @if($proker['kendala'])
                <tr>
                    <td class="label">Kendala</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['kendala'] }}</td>
                </tr>
                @endif
                @if($proker['solusi'])
                <tr>
                    <td class="label">Solusi</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['solusi'] }}</td>
                </tr>
                @endif
                @if($proker['saran'])
                <tr>
                    <td class="label">Saran</td>
                    <td class="sep">:</td>
                    <td>{{ $proker['saran'] }}</td>
                </tr>
                @endif
            </table>
            @endif

            {{-- Kegiatan (hanya yang disetujui) --}}
            <p class="section-label">{{ $sectionNo++ }}. Kegiatan</p>
            @if(empty($proker['kegiatan']))
                <p class="no-data">Belum ada kegiatan</p>
            @else
                @foreach($proker['kegiatan'] as $ki => $kg)
                <div style="margin-bottom: 12px; padding: 6px 0;">
                    <p style="font-weight: bold; font-size: 10.5pt; margin: 0 0 3px 0;">
                        {{ strtolower($toAlpha($ki + 1)) }}. {{ $kg['nama_kegiatan'] }}
                    </p>
                    <p style="font-size: 10pt; color: #333; margin: 0 0 2px 0;">
                        {{ $kg['tanggal_mulai'] }} – {{ $kg['tanggal_selesai'] }}
                    </p>
                    @if(!empty($kg['deskripsi']))
                    <p style="font-size: 10pt; margin: 2px 0;">{{ $kg['deskripsi'] }}</p>
                    @endif

                    {{-- Dokumentasi kegiatan ini --}}
                    @if(!empty($kg['dokumentasi']))
                    @php $chunks = array_chunk($kg['dokumentasi'], 3); @endphp
                    @foreach($chunks as $row)
                    <table class="foto-grid" style="margin-top: 4px;">
                        <tr>
                            @foreach($row as $dok)
                            <td>
                                <img src="{{ $dok['src'] }}" alt="{{ $dok['judul'] ?? '' }}">
                                <p class="foto-caption">{{ $dok['judul'] ?? '' }}</p>
                            </td>
                            @endforeach
                            @for($fill = count($row); $fill < 3; $fill++)
                            <td></td>
                            @endfor
                        </tr>
                    </table>
                    @endforeach
                    @endif
                </div>
                @endforeach
            @endif

        </div>{{-- end proker-block --}}
        @endforeach

    </div>
@endforeach


</body>
</html>
