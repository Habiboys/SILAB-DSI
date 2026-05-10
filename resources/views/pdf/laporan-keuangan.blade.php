<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Keuangan - {{ $laboratorium->nama }}</title>
    <style>
        @page {
            margin: 18mm 16mm 22mm 16mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1f2937;
            font-size: 11px;
            line-height: 1.5;
        }

        .header {
            border-bottom: 2px solid #111827;
            padding-bottom: 10px;
            margin-bottom: 18px;
        }

        .header table {
            width: 100%;
            border-collapse: collapse;
        }

        .header .brand {
            font-size: 10px;
            color: #6b7280;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .header .title {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            letter-spacing: 0.5px;
        }

        .header .subtitle {
            font-size: 11px;
            color: #4b5563;
            margin-top: 2px;
        }

        .header .meta {
            text-align: right;
            font-size: 10px;
            color: #6b7280;
            line-height: 1.6;
        }

        .header .meta strong {
            color: #111827;
        }

        .summary {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px 0;
            margin: 0 -6px 22px -6px;
        }

        .summary td {
            width: 33.33%;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 12px 14px;
            vertical-align: top;
        }

        .summary .label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b7280;
            margin-bottom: 6px;
        }

        .summary .value {
            font-size: 15px;
            font-weight: bold;
            color: #111827;
        }

        .summary .accent-income {
            border-left: 3px solid #059669;
        }

        .summary .accent-expense {
            border-left: 3px solid #dc2626;
        }

        .summary .accent-balance {
            border-left: 3px solid #2563eb;
        }

        .summary .value-income { color: #059669; }
        .summary .value-expense { color: #dc2626; }
        .summary .value-balance { color: #2563eb; }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 8px 0;
            padding-bottom: 4px;
            border-bottom: 1px solid #d1d5db;
        }

        table.transactions {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }

        table.transactions th {
            background: #f3f4f6;
            color: #111827;
            font-weight: bold;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 1.5px solid #111827;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        table.transactions td {
            padding: 7px 10px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
            font-size: 10.5px;
        }

        table.transactions tr:nth-child(even) td {
            background: #fafafa;
        }

        .col-no { width: 26px; text-align: center; }
        .col-date { width: 78px; white-space: nowrap; }
        .col-type { width: 80px; }
        .col-amount { width: 110px; text-align: right; white-space: nowrap; }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .badge-masuk {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-keluar {
            background: #fee2e2;
            color: #991b1b;
        }

        .amount-in { color: #059669; font-weight: bold; }
        .amount-out { color: #dc2626; font-weight: bold; }

        .empty-row td {
            text-align: center;
            padding: 24px 10px;
            color: #9ca3af;
            font-style: italic;
        }

        .totals {
            width: 100%;
            border-collapse: collapse;
            margin-top: -8px;
            margin-bottom: 24px;
        }

        .totals td {
            padding: 6px 10px;
            font-size: 10.5px;
        }

        .totals .label {
            text-align: right;
            color: #4b5563;
        }

        .totals .value {
            text-align: right;
            width: 110px;
            font-weight: bold;
            color: #111827;
        }

        .totals .grand td {
            border-top: 1.5px solid #111827;
            padding-top: 8px;
            font-size: 12px;
            font-weight: bold;
        }

        .signature {
            width: 100%;
            margin-top: 24px;
        }

        .signature td {
            width: 50%;
            vertical-align: top;
            text-align: center;
            font-size: 10.5px;
        }

        .signature .role {
            margin-bottom: 60px;
            color: #4b5563;
        }

        .signature .name {
            font-weight: bold;
            color: #111827;
            border-top: 1px solid #111827;
            padding-top: 4px;
            display: inline-block;
            min-width: 180px;
        }

        .footer {
            position: fixed;
            bottom: -14mm;
            left: 0;
            right: 0;
            font-size: 9px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 6px;
        }

        .footer table { width: 100%; border-collapse: collapse; }
        .footer .right { text-align: right; }
    </style>
</head>
<body>

    <div class="header">
        <table>
            <tr>
                <td>
                    <div class="brand">SILAB &middot; Sistem Informasi Laboratorium</div>
                    <div class="title">Laporan Keuangan</div>
                    <div class="subtitle">{{ $laboratorium->nama }}</div>
                </td>
                <td class="meta">
                    <strong>Periode</strong><br>
                    Tahun Kepengurusan {{ $tahun->tahun }}<br>
                    Dicetak: {{ \Carbon\Carbon::now()->translatedFormat('d F Y, H:i') }}
                </td>
            </tr>
        </table>
    </div>

    <table class="summary">
        <tr>
            <td class="accent-income">
                <div class="label">Total Pemasukan</div>
                <div class="value value-income">Rp {{ number_format($totalPemasukan, 0, ',', '.') }}</div>
            </td>
            <td class="accent-expense">
                <div class="label">Total Pengeluaran</div>
                <div class="value value-expense">Rp {{ number_format($totalPengeluaran, 0, ',', '.') }}</div>
            </td>
            <td class="accent-balance">
                <div class="label">Saldo Akhir</div>
                <div class="value value-balance">Rp {{ number_format($saldo, 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Rincian Transaksi</div>

    <table class="transactions">
        <thead>
            <tr>
                <th class="col-no">No</th>
                <th class="col-date">Tanggal</th>
                <th>Deskripsi</th>
                <th class="col-type">Jenis</th>
                <th class="col-amount">Nominal</th>
            </tr>
        </thead>
        <tbody>
            @forelse($riwayatKeuangan as $index => $item)
                <tr>
                    <td class="col-no">{{ $index + 1 }}</td>
                    <td class="col-date">{{ \Carbon\Carbon::parse($item->tanggal)->translatedFormat('d M Y') }}</td>
                    <td>{{ $item->deskripsi ?: '-' }}</td>
                    <td class="col-type">
                        <span class="badge badge-{{ $item->jenis }}">
                            {{ $item->jenis === 'masuk' ? 'Masuk' : 'Keluar' }}
                        </span>
                    </td>
                    <td class="col-amount {{ $item->jenis === 'masuk' ? 'amount-in' : 'amount-out' }}">
                        {{ $item->jenis === 'masuk' ? '+' : '-' }} Rp {{ number_format($item->nominal, 0, ',', '.') }}
                    </td>
                </tr>
            @empty
                <tr class="empty-row">
                    <td colspan="5">Tidak ada data transaksi pada periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td class="label">Total Pemasukan</td>
            <td class="value value-income amount-in">Rp {{ number_format($totalPemasukan, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td class="label">Total Pengeluaran</td>
            <td class="value value-expense amount-out">Rp {{ number_format($totalPengeluaran, 0, ',', '.') }}</td>
        </tr>
        <tr class="grand">
            <td class="label">Saldo Akhir</td>
            <td class="value">Rp {{ number_format($saldo, 0, ',', '.') }}</td>
        </tr>
    </table>

    <table class="signature">
        <tr>
            <td>
                <div class="role">Mengetahui,<br>Kepala Laboratorium</div>
                <div class="name">&nbsp;</div>
            </td>
            <td>
                <div class="role">Bendahara</div>
                <div class="name">&nbsp;</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        <table>
            <tr>
                <td>SILAB &middot; Sistem Informasi Laboratorium DSI UNAND</td>
                <td class="right">Halaman <span class="pagenum"></span></td>
            </tr>
        </table>
    </div>

</body>
</html>
