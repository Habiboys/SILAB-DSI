<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 5mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #111; }
        table.grid-table { width: 100%; border-collapse: collapse; }

        /* Layout columns */
        td.label-cell-wrapper { vertical-align: top; padding: 1.5mm; }
        .layout-standard .label-cell-wrapper { width: 33.33%; }
        .layout-medium  .label-cell-wrapper { width: 25%; }
        .layout-small   .label-cell-wrapper { width: 20%; }
        .layout-mini    .label-cell-wrapper { width: 16.66%; padding: 1mm; }

        /* Label box — height auto so top & bottom padding stay equal */
        .label-cell {
            width: 100%;
            border: 0.5px solid #999;
            padding: 1.5mm 1mm;
            overflow: hidden;
        }
        .layout-mini .label-cell { padding: 1mm 0.8mm; }

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
        .layout-small .label-header { font-size: 3.5pt; }
        .layout-mini  .label-header { font-size: 3pt; padding-bottom: 0.4mm; margin-bottom: 0.4mm; }

        /* Content table (QR + Info) */
        .label-content-table { width: 100%; border-collapse: collapse; }

        /* QR cell — sized per layout so it doesn't dominate width */
        td.qr {
            width: 20mm;
            text-align: center;
            vertical-align: middle;
            padding-right: 1mm;
            border-right: 0.5px dashed #ccc;
        }
        td.qr img { width: 18mm; height: 18mm; }

        .layout-medium td.qr       { width: 17mm; }
        .layout-medium td.qr img   { width: 15mm; height: 15mm; }

        .layout-small td.qr        { width: 13mm; padding-right: 0.5mm; }
        .layout-small td.qr img    { width: 11mm; height: 11mm; }

        .layout-mini td.qr         { width: 10mm; padding-right: 0.5mm; }
        .layout-mini td.qr img     { width: 8mm;  height: 8mm; }

        /* Info cell */
        td.info { vertical-align: top; padding-left: 1.5mm; }
        .layout-mini td.info { padding-left: 1mm; }

        /* No-QR: info fills full width */
        .no-qr td.info { padding-left: 0; }

        /* Typography — base (standard) */
        .nama { font-size: 8pt; font-weight: bold; line-height: 1.15; margin-bottom: 0.4mm; overflow: hidden; max-height: 6.5mm; }
        .kode { font-size: 7.5pt; font-weight: bold; font-family: 'Courier New', monospace; margin-bottom: 0.3mm; }
        .meta { font-size: 5.5pt; color: #555; line-height: 1.2; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

        /* Medium */
        .layout-medium .nama { font-size: 7pt; max-height: 5.8mm; }
        .layout-medium .kode { font-size: 6.5pt; }
        .layout-medium .meta { font-size: 5pt; }

        /* Small */
        .layout-small .nama { font-size: 6pt; max-height: 5mm; }
        .layout-small .kode { font-size: 5.5pt; }
        .layout-small .meta { font-size: 4.5pt; }

        /* Mini */
        .layout-mini .nama { font-size: 5pt; max-height: 4mm; }
        .layout-mini .kode { font-size: 5pt; margin-bottom: 0; }
        .layout-mini .meta { font-size: 4pt; }

        /* No-QR — slightly larger text since there is more room */
        .no-qr .nama                    { font-size: 9pt;   max-height: 7mm; }
        .layout-medium.no-qr .nama      { font-size: 8pt;   max-height: 6.5mm; }
        .layout-small.no-qr  .nama      { font-size: 7pt;   max-height: 5.5mm; }
        .layout-mini.no-qr   .nama      { font-size: 6pt;   max-height: 5mm; }
        .no-qr .meta                    { white-space: normal; }
    </style>
</head>
<body class="layout-{{ $layout }} {{ !$showQr ? 'no-qr' : '' }}">
    <table class="grid-table">
        @php
            $cols = match($layout) {
                'medium' => 4,
                'small'  => 5,
                'mini'   => 6,
                default  => 3
            };
            /* Allow more characters for wider labels */
            $labLimit = match($layout) {
                'mini'  => 18,
                'small' => 24,
                default => 35,
            };
        @endphp
        @foreach($items->chunk($cols) as $chunk)
            <tr>
                @foreach($chunk as $item)
                    <td class="label-cell-wrapper">
                        <div class="label-cell">

                            {{-- QR + Info --}}
                            <table class="label-content-table">
                                <tr>
                                    @if($showQr)
                                    <td class="qr">
                                        <img src="{{ $item['qrPath'] }}" alt="QR">
                                    </td>
                                    @endif
                                    <td class="info">
                                        <div class="label-header">SILAB Departemen Sistem Informasi</div>
                                        <div class="nama">{{ $item['nama'] }}</div>
                                        <div class="kode">{{ $item['kode_barang'] }}</div>
                                        <div class="meta">{{ $item['lab'] }}</div>
                                        <div class="meta">{{ $item['tanggal'] }}</div>
                                    </td>
                                </tr>
                            </table>

                        </div>
                    </td>
                @endforeach

                {{-- Fill empty cells to maintain grid --}}
                @for($i = 0; $i < ($cols - $chunk->count()); $i++)
                    <td class="label-cell-wrapper"></td>
                @endfor
            </tr>
        @endforeach
    </table>
</body>
</html>
