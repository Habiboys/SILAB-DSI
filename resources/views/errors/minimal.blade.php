<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>@yield('title')</title>

        <style>
            :root {
                --silab-blue: #2563eb;
                --silab-blue-600: #1d4ed8;
                --silab-bg: #eff6ff;
                --silab-text: #1f2937;
                --silab-muted: #6b7280;
                --silab-white: #ffffff;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                min-height: 100vh;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                background: var(--silab-bg);
                color: var(--silab-text);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
            }

            .card {
                width: 100%;
                max-width: 560px;
                background: var(--silab-white);
                border-radius: 14px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
                padding: 28px;
                text-align: center;
            }

            .brand {
                font-size: 13px;
                letter-spacing: .08em;
                color: var(--silab-blue);
                font-weight: 700;
                text-transform: uppercase;
                margin-bottom: 8px;
            }

            .code {
                font-size: 42px;
                line-height: 1;
                font-weight: 800;
                color: var(--silab-blue);
                margin-bottom: 10px;
            }

            .title {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                color: var(--silab-text);
            }

            .desc {
                margin: 12px 0 20px;
                color: var(--silab-muted);
                font-size: 14px;
            }

            .actions {
                display: flex;
                justify-content: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .btn {
                display: inline-block;
                padding: 10px 16px;
                border-radius: 8px;
                text-decoration: none;
                font-size: 14px;
                font-weight: 600;
                transition: all .2s ease;
            }

            .btn-primary {
                background: var(--silab-blue);
                color: #fff;
            }

            .btn-primary:hover {
                background: var(--silab-blue-600);
            }

            .btn-light {
                background: #e5e7eb;
                color: #111827;
            }

            .btn-light:hover {
                background: #d1d5db;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="brand">SILAB</div>
            <div class="code">@yield('code')</div>
            <h1 class="title">@yield('message')</h1>
            <p class="desc">
                Halaman yang Anda tuju sedang tidak tersedia atau terjadi gangguan sementara.
            </p>

            <div class="actions">
                <a href="{{ url('/') }}" class="btn btn-primary">Kembali ke Beranda</a>
                <a href="javascript:history.back()" class="btn btn-light">Halaman Sebelumnya</a>
            </div>
        </div>
    </body>
</html>
