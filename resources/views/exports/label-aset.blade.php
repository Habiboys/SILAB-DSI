<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #111; }

        .label {
            width: 100%;
            border: 0.5px solid #999;
            padding: 1.5mm 1mm;
            overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; }

        td.qr {
            width: 20mm;
            text-align: center;
            vertical-align: middle;
            padding-right: 1mm;
            border-right: 0.5px dashed #ccc;
        }
        td.qr img { width: 18mm; height: 18mm; }

        td.info {
            vertical-align: top;
            padding-left: 1.5mm;
        }

        /* Header teks aplikasi */
        .label-header {
            font-size: 4.5pt;
            font-weight: bold;
            color: #333;
            text-align: center;
            padding-bottom: 0.6mm;
            margin-bottom: 0.6mm;
            border-bottom: 0.5px solid #bbb;
            line-height: 1;
        }

        .nama { font-size: 8pt; font-weight: bold; line-height: 1.15; margin-bottom: 0.4mm; overflow: hidden; max-height: 6.5mm; }
        .kode { font-size: 7.5pt; font-weight: bold; font-family: 'Courier New', monospace; margin-bottom: 0.3mm; }
        .meta { font-size: 5.5pt; color: #555; line-height: 1.2; }
    </style>
</head>
<body>
    <div class="label">
        <table>
            <tr>
                <td class="qr">
                    <img src="{{ $qrDataUri }}" alt="QR">
                </td>
                <td class="info">
                    <div class="label-header">SILAB Departemen Sistem Informasi</div>
                    <div class="nama">{{ $aset->nama ?? $aset->kategoriAset->nama ?? 'Aset' }}</div>
                    <div class="kode">{{ $aset->kode_barang }}</div>
                    <div class="meta">{{ $aset->kategoriAset->laboratorium->nama ?? '' }}</div>
                    <div class="meta">{{ $aset->created_at ? $aset->created_at->format('d/m/Y') : '' }}</div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
