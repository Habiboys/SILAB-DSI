<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $lpj->judul }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111827; }
        h1 { font-size: 18px; margin: 0 0 8px 0; }
        h2 { font-size: 14px; margin: 16px 0 8px 0; }
        .muted { color: #6b7280; }
        .box { border: 1px solid #d1d5db; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; }
        th { background: #f3f4f6; text-align: left; }
        .small { font-size: 11px; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <h1>{{ $lpj->judul }}</h1>
    <div class="small muted">
        Lab: {{ $lpj->kepengurusanLab?->laboratorium?->nama ?? '-' }} |
        Tahun: {{ $lpj->kepengurusanLab?->tahunKepengurusan?->tahun ?? '-' }} |
        No Dokumen: {{ $lpj->nomor_dokumen ?? '-' }}
    </div>

    <div class="box" style="margin-top: 10px;">
        <strong>Status:</strong> {{ strtoupper($lpj->status) }}<br>
        <strong>Generated:</strong> {{ optional($lpj->generated_at)->format('d M Y H:i') ?? '-' }} oleh {{ $lpj->generator?->name ?? '-' }}<br>
        <strong>Approved:</strong> {{ optional($lpj->approved_at)->format('d M Y H:i') ?? '-' }} oleh {{ $lpj->approver?->name ?? '-' }}
    </div>

    @if($lpj->ringkasan)
        <div class="box">
            <strong>Ringkasan Eksekutif</strong>
            <div style="margin-top: 6px; white-space: pre-wrap;">{{ $lpj->ringkasan }}</div>
        </div>
    @endif

    <h2>Ringkasan Angka</h2>
    <table>
        <tr>
            <th>Total Proker</th>
            <th>Proker Disetujui</th>
            <th>Proker Selesai</th>
            <th>Total Kegiatan</th>
        </tr>
        <tr>
            <td>{{ $lpj->total_proker }}</td>
            <td>{{ $lpj->proker_disetujui }}</td>
            <td>{{ $lpj->proker_selesai }}</td>
            <td>{{ $lpj->total_kegiatan }}</td>
        </tr>
        <tr>
            <th>Kegiatan Disetujui</th>
            <th>Total LPJ Kegiatan</th>
            <th>Total Dokumentasi</th>
            <th>Capaian Rata-rata</th>
        </tr>
        <tr>
            <td>{{ $lpj->kegiatan_disetujui }}</td>
            <td>{{ $lpj->total_laporan_kegiatan }}</td>
            <td>{{ $lpj->total_dokumentasi_kegiatan }}</td>
            <td>{{ is_null($lpj->persentase_capaian_rata2) ? '-' : $lpj->persentase_capaian_rata2 . '%' }}</td>
        </tr>
    </table>

    <h2>Rekap Proker & Kegiatan</h2>
    <table>
        <thead>
            <tr>
                <th>Program Kerja</th>
                <th>Status</th>
                <th class="text-right">Capaian</th>
                <th>Detail Kegiatan</th>
            </tr>
        </thead>
        <tbody>
            @forelse(($detail['prokers'] ?? []) as $proker)
                <tr>
                    <td>
                        <strong>{{ $proker['nama_proker'] ?? '-' }}</strong><br>
                        <span class="small muted">{{ $proker['struktur'] ?? '-' }}</span>
                    </td>
                    <td>
                        Pengajuan: {{ $proker['status_pengajuan'] ?? '-' }}<br>
                        Pelaksanaan: {{ $proker['status'] ?? '-' }}
                    </td>
                    <td class="text-right">
                        {{ is_null($proker['persentase_capaian']) ? '-' : $proker['persentase_capaian'] . '%' }}
                    </td>
                    <td>
                        @if(empty($proker['kegiatan']))
                            <span class="small muted">Belum ada kegiatan.</span>
                        @else
                            @foreach($proker['kegiatan'] as $kegiatan)
                                <div style="margin-bottom: 6px;">
                                    <strong>{{ $kegiatan['nama_kegiatan'] ?? '-' }}</strong><br>
                                    <span class="small">
                                        {{ $kegiatan['tanggal_mulai'] ?? '-' }} s/d {{ $kegiatan['tanggal_selesai'] ?? '-' }} · {{ $kegiatan['status_approval'] ?? '-' }}
                                    </span><br>
                                    <span class="small muted">
                                        Peserta: {{ $kegiatan['jumlah_peserta'] ?? 0 }},
                                        LPJ: {{ $kegiatan['jumlah_laporan'] ?? 0 }},
                                        Dok: {{ $kegiatan['jumlah_dokumentasi'] ?? 0 }}
                                    </span>
                                </div>
                            @endforeach
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="small muted">Tidak ada data proker.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
