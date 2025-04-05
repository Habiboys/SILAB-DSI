<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Keuangan</title>
    <style>
        @page {
            margin: 0;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #2c3e50;
            line-height: 1.6;
            background-color: #fff;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(52, 152, 219, 0.05);
            z-index: -1;
        }
        
        .container {
            position: relative;
            padding: 10mm;
        }
        
        .header-section {
            position: relative;
            background-color: #2c3e50;
            color: white;
            padding: 20mm 10mm 15mm 10mm;
            margin: -10mm -10mm 5mm -10mm;
        }
        
        .lab-logo {
            position: absolute;
            top: 10mm;
            right: 10mm;
            font-size: 36px;
            font-weight: bold;
            color: white;
            border: 2px solid white;
            padding: 8px 15px;
            border-radius: 5px;
        }
        
        .header-title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .header-subtitle {
            font-size: 20px;
            font-weight: normal;
            opacity: 0.8;
        }
        
        .header-period {
            font-size: 16px;
            opacity: 0.7;
            margin-top: 10px;
        }
        
        .finance-summary {
            display: flex;
            justify-content: space-between;
            margin: 15mm 0;
            gap: 5mm;
        }
        
        .summary-card {
            flex: 1;
            position: relative;
            background-color: white;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            overflow: hidden;
        }
        
        .summary-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
        }
        
        .card-income::before {
            background-color: #2ecc71;
        }
        
        .card-expense::before {
            background-color: #e74c3c;
        }
        
        .card-balance::before {
            background-color: #3498db;
        }
        
        .summary-label {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .summary-value {
            font-size: 24px;
            font-weight: bold;
        }
        
        .income-value {
            color: #2ecc71;
        }
        
        .expense-value {
            color: #e74c3c;
        }
        
        .balance-value {
            color: #3498db;
        }
        
        .report-heading {
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
        }
        
        .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 20px 0;
        }
        
        .transactions-table th {
            background-color: #f8f9fa;
            color: #2c3e50;
            font-weight: bold;
            text-align: left;
            padding: 12px 15px;
            border-bottom: 2px solid #3498db;
            font-size: 14px;
        }
        
        .transactions-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #ecf0f1;
            font-size: 13px;
        }
        
        .transactions-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .transactions-table tr:hover {
            background-color: #edf7fd;
        }
        
        .column-no {
            width: 40px;
            text-align: center;
        }
        
        .column-date {
            width: 100px;
        }
        
        .column-type {
            width: 100px;
        }
        
        .column-amount {
            width: 150px;
            text-align: right;
        }
        
        .amount {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            text-align: right;
        }
        
        .type-masuk {
            color: #2ecc71;
            font-weight: 600;
        }
        
        .type-keluar {
            color: #e74c3c;
            font-weight: 600;
        }
        
        .footer {
            margin-top: 20mm;
            padding-top: 5mm;
            border-top: 1px solid #ecf0f1;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #7f8c8d;
        }
        
        .signature-section {
            margin-top: 15mm;
            text-align: right;
        }
        
        .signature-title {
            font-weight: bold;
            margin-bottom: 20mm;
        }
        
        .signature-name {
            font-weight: bold;
            border-top: 1px solid #2c3e50;
            padding-top: 5px;
            display: inline-block;
        }
        
        .page-number {
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 5mm;
        }
        
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 10px 15px;
            margin: 10px 0 20px 0;
            font-size: 13px;
            color: #7f8c8d;
        }
        
        .chart-section {
            text-align: center;
            margin: 10mm 0;
        }
        
        .chart-placeholder {
            background-color: #f8f9fa;
            border: 1px dashed #bdc3c7;
            padding: 10mm;
            text-align: center;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="watermark">SILAB</div>
    
    <div class="container">
        <div class="header-section">
            <div class="lab-logo">SILAB</div>
            <div class="header-title">LAPORAN KEUANGAN</div>
            <div class="header-subtitle">{{ $laboratorium->nama }}</div>
            <div class="header-period">Tahun Kepengurusan {{ $tahun->tahun }}</div>
        </div>
        
        <div class="finance-summary">
            <div class="summary-card card-income">
                <div class="summary-label">Total Pemasukan</div>
                <div class="summary-value income-value">Rp {{ number_format($totalPemasukan, 0, ',', '.') }}</div>
            </div>
            
            <div class="summary-card card-expense">
                <div class="summary-label">Total Pengeluaran</div>
                <div class="summary-value expense-value">Rp {{ number_format($totalPengeluaran, 0, ',', '.') }}</div>
            </div>
            
            <div class="summary-card card-balance">
                <div class="summary-label">Saldo Akhir</div>
                <div class="summary-value balance-value">Rp {{ number_format($saldo, 0, ',', '.') }}</div>
            </div>
        </div>
        
        <div class="info-box">
            Laporan ini menampilkan seluruh transaksi keuangan yang tercatat dalam sistem SILAB untuk periode tahun kepengurusan {{ $tahun->tahun }}.
        </div>
        
        <div class="report-heading">Riwayat Transaksi Keuangan</div>
        
        <table class="transactions-table">
            <thead>
                <tr>
                    <th class="column-no">No</th>
                    <th class="column-date">Tanggal</th>
                    <th>Deskripsi</th>
                    <th class="column-type">Jenis</th>
                    <th class="column-amount">Nominal</th>
                </tr>
            </thead>
            <tbody>
                @if(count($riwayatKeuangan) > 0)
                    @foreach($riwayatKeuangan as $index => $item)
                    <tr>
                        <td class="column-no">{{ $index + 1 }}</td>
                        <td class="column-date">{{ date('d/m/Y', strtotime($item->tanggal)) }}</td>
                        <td>{{ $item->deskripsi }}</td>
                        <td class="type-{{ $item->jenis }}">{{ ucfirst($item->jenis) }}</td>
                        <td class="amount">
                            Rp {{ number_format($item->nominal, 0, ',', '.') }}
                        </td>
                    </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 20px;">Tidak ada data transaksi</td>
                    </tr>
                @endif
            </tbody>
        </table>
        
        <div class="signature-section">
            <div class="signature-title">Bendahara</div>
            <div class="signature-name">{{ $laboratorium->nama }}</div>
        </div>
        
        <div class="footer">
            <div>
                <strong>SILAB</strong> - Sistem Informasi Laboratorium DSI UNAND
            </div>
            <div>
                Dicetak pada: {{ date('d/m/Y H:i:s') }}
            </div>
        </div>
        
    </div>
</body>
</html>