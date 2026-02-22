 <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 5mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #111; }
        table.grid-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        /* Layout columns */
        td.label-cell-wrapper { vertical-align: top; padding: 2mm; }
        .layout-standard .label-cell-wrapper { width: 33.33%; }
        .layout-medium .label-cell-wrapper { width: 25%; }
        .layout-small .label-cell-wrapper { width: 20%; }
        .layout-mini .label-cell-wrapper { width: 16.66%; padding: 1mm; } /* Tighter padding for mini */

        .label-cell {
            width: 100%;
            height: 25mm;
            border: 0.5px solid #999;
            padding: 1mm;
            position: relative;
            overflow: hidden;
        }
        .label-content-table { width: 100%; height: 100%; border-collapse: collapse; }
        
        /* QR Cell Defaults (Standard) */
        td.qr {
            width: 24mm;
            text-align: center;
            vertical-align: middle;
            padding-right: 1mm;
            border-right: 0.5px dashed #ccc;
        }
        td.qr img { width: 22mm; height: 22mm; }

        /* Medium Layout Adjustments */
        .layout-medium td.qr { width: 20mm; }
        .layout-medium td.qr img { width: 18mm; height: 18mm; }
        
        /* Small Layout Adjustments */
        .layout-small td.qr { width: 16mm; padding-right: 0.5mm; }
        .layout-small td.qr img { width: 14mm; height: 14mm; }

        /* Mini Layout Adjustments */
        .layout-mini .label-cell { padding: 0.5mm; height: 22mm; } /* Slightly shorter? or keep 25mm */
        .layout-mini td.qr { width: 12mm; padding-right: 0.5mm; } /* Very small QR */
        .layout-mini td.qr img { width: 10mm; height: 10mm; }
        .layout-mini .header img { height: 2.5mm; }
        .layout-mini .header span { font-size: 3pt; }

        /* No QR Layout */
        .no-qr td.qr { display: none; }
        .no-qr td.info { padding-left: 0; text-align: left; }
        .no-qr .nama { font-size: 9pt; } /* Bigger text if no QR */
        .layout-mini.no-qr .nama { font-size: 7pt; }

        td.info {
            vertical-align: middle;
            padding-left: 1.5mm;
        }
        
        /* Typography */
        .nama { font-size: 8pt; font-weight: bold; margin-bottom: 0.5mm; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .kode { font-size: 7.5pt; font-weight: bold; font-family: 'Courier New', monospace; margin-bottom: 0.5mm; }
        .meta { font-size: 6pt; color: #555; line-height: 1; }

        /* Typography Scaling */
        .layout-medium .nama { font-size: 7pt; }
        .layout-medium .kode { font-size: 6.5pt; }
        .layout-medium .meta { font-size: 5pt; }

        .layout-small .nama { font-size: 6pt; }
        .layout-small .kode { font-size: 6pt; }
        .layout-small .meta { font-size: 4.5pt; }

        .layout-mini .nama { font-size: 5pt; -webkit-line-clamp: 3; }
        .layout-mini .kode { font-size: 5pt; margin-bottom: 0; }
        .layout-mini .meta { font-size: 4pt; }
        .layout-mini td.info { padding-left: 1mm; }

    </style>
</head>
<body class="layout-{{ $layout }} {{ !$showQr ? 'no-qr' : '' }}">
    <table class="grid-table">
        @php
            $cols = match($layout) {
                'medium' => 4,
                'small' => 5,
                'mini' => 6,
                default => 3
            };
        @endphp
        @foreach($items->chunk($cols) as $chunk)
            <tr>
                @foreach($chunk as $item)
                    <td class="label-cell-wrapper">
                        <div class="label-cell">
                            <!-- Logo Header -->
                             <div style="position: absolute; top: 1mm; right: 1mm; text-align: right;">
                                <img src="{{ public_path('images/logo_unand.png') }}" style="height: 3mm; vertical-align: middle;">
                                <span style="font-size: 4pt; font-weight: bold; vertical-align: middle;">SILAB</span>
                            </div>

                            <table class="label-content-table" style="margin-top: 2mm;">
                                <tr>
                                    @if($showQr)
                                    <td class="qr">
                                        <img src="{{ $item['qrPath'] }}" alt="QR">
                                    </td>
                                    @endif
                                    <td class="info">
                                        <div class="nama">{{ $item['nama'] }}</div>
                                        <div class="kode">{{ $item['kode_barang'] }}</div>
                                        <div class="meta">
                                            {{ Str::limit($item['lab'], 25) }} • 
                                            {{ $item['tanggal'] }}
                                        </div>
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
