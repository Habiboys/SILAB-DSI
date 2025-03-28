<!DOCTYPE html>
<html>
<head>
    <title>Laporan Keuangan {{ $kepengurusanLab->laboratorium->nama }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .summary {
            background-color: #f4f4f4;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table, th, td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        th {
            background-color: #f2f2f2;
            text-align: left;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 0.8em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Keuangan Laboratorium</h1>
        <h2>{{ $kepengurusanLab->laboratorium->nama }}</h2>
        <p>Tahun Kepengurusan: {{ $kepengurusanLab->tahunKepengurusan->tahun }}</p>
    </div>

    <div class="summary">
        <h3>Ringkasan Keuangan</h3>
        <p>Total Pemasukan: Rp. {{ number_format($totalPemasukan, 2, ',', '.') }}</p>
        <p>Total Pengeluaran: Rp. {{ number_format($totalPengeluaran, 2, ',', '.') }}</p>
        <p>Saldo Akhir: Rp. {{ number_format($saldo, 2, ',', '.') }}</p>
    </div>

    <h3>Riwayat Transaksi</h3>
    <table>
        <thead>
            <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Nominal</th>
                <th>Keterangan</th>
                <th>Pencatat</th>
            </tr>
        </thead>
        <tbody>
            @foreach($riwayatKeuangan as $riwayat)
            <tr>
                <td>{{ $riwayat->tanggal }}</td>
                <td>{{ $riwayat->jenis == 'masuk' ? 'Pemasukan' : 'Pengeluaran' }}</td>
                <td>Rp. {{ number_format($riwayat->nominal, 2, ',', '.') }}</td>
                <td>{{ $riwayat->keterangan }}</td>
                <td>{{ $riwayat->user->name }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h3>Daftar Asisten</h3>
    <table>
        <thead>
            <tr>
                <th>Nama</th>
                <th>Nomor Anggota</th>
                <th>Posisi</th>
            </tr>
        </thead>
        <tbody>
            @foreach($asisten as $assistant)
            <tr>
                <td>{{ $assistant->name }}</td>
                <td>{{ $assistant->profile->nomor_anggota }}</td>
                <td>{{ $assistant->struktur->first()->jabatan ?? 'Tidak ada posisi' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Laporan Keuangan Laboratorium - {{ date('d F Y') }}</p>
    </div>
</body>
</html>