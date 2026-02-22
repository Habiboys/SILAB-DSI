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
            padding: 3px 6px 3px 3px;
        }
        table { width: 100%; border-collapse: collapse; }
        td.qr {
            width: 70px;
            text-align: center;
            vertical-align: middle;
            padding-right: 5px;
            border-right: 1px dashed #ccc;
        }
        td.qr img { width: 60px; height: 60px; }
        td.info {
            vertical-align: middle;
            padding-left: 6px;
        }
        .nama { font-size: 8pt; font-weight: bold; }
        .kode { font-size: 10pt; font-weight: bold; font-family: 'Courier New', monospace; }
        .meta { font-size: 6pt; color: #888; }
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
                    <div class="nama">{{ $aset->kategoriAset->nama ?? 'Aset' }}</div>
                    <div class="kode">{{ $aset->kode_barang }}</div>
                    <div class="meta">{{ $aset->kategoriAset->laboratorium->nama ?? '' }} &bull; {{ $aset->created_at ? $aset->created_at->format('d/m/Y') : '' }}</div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
