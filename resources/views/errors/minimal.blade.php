<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>@yield('title') · SILAB</title>
    <style>
        :root {
            color-scheme: light;
            --color-base-100: #ffffff;
            --color-base-200: #f7f8fc;
            --color-base-content: #172033;
            --color-primary: #5964d8;
            --color-primary-content: #ffffff;
            --color-neutral: #263044;
            --color-neutral-content: #ffffff;
            --color-base-content-muted: #5f6b80;
            --color-base-300: #dfe4ee;
        }

        *, *::before, *::after { box-sizing: border-box; }
        html, body { min-height: 100%; }
        body {
            margin: 0;
            min-height: 100dvh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: var(--color-base-200);
            color: var(--color-base-content);
            font-family: Figtree, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        .error-shell { width: min(100%, 680px); }
        .brand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            color: var(--color-base-content);
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: .08em;
        }
        .brand img { width: 42px; height: 42px; object-fit: contain; }
        .card {
            border: 1px solid var(--color-base-300);
            border-radius: .375rem;
            background: var(--color-base-100);
            box-shadow: 0 12px 32px rgb(38 48 68 / 8%);
        }
        .card-body { padding: clamp(24px, 5vw, 48px); }
        .error-code {
            margin: 0;
            color: var(--color-primary);
            font-size: clamp(4rem, 16vw, 7rem);
            line-height: .9;
            font-weight: 800;
            letter-spacing: -.07em;
        }
        h1 { margin: 20px 0 10px; font-size: clamp(1.35rem, 4vw, 1.8rem); line-height: 1.25; }
        .description { margin: 0; max-width: 54ch; color: var(--color-base-content-muted); line-height: 1.7; }
        .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
        .btn { min-height: 44px; border-radius: .5rem; padding: 10px 18px; font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
        .btn-primary { border: 1px solid var(--color-primary); background: var(--color-primary); color: var(--color-primary-content); }
        .btn-outline { border: 1px solid var(--color-neutral); background: transparent; color: var(--color-neutral); }
        .btn:hover { filter: brightness(.94); }
        .btn:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
        @media (max-width: 520px) {
            body { padding: 16px; }
            .brand { margin-bottom: 18px; }
            .actions { flex-direction: column; }
            .btn { width: 100%; text-align: center; }
        }
    </style>
</head>
<body>
    <main class="error-shell">
        <div class="brand">
            <img src="{{ asset('images/silab2.png') }}" alt="Logo SILAB">
            <span>SILAB</span>
        </div>

        <section class="card" aria-labelledby="error-title">
            <div class="card-body">
                <p class="error-code" aria-label="Kode error @yield('code')">@yield('code')</p>
                <h1 id="error-title">@yield('message')</h1>
                <p class="description">@yield('description', 'Permintaan Anda belum dapat diproses. Periksa kembali alamat halaman atau coba beberapa saat lagi.')</p>
                <div class="actions">
                    <a href="{{ auth()->check() ? url('/dashboard') : url('/') }}" class="btn btn-primary">Kembali ke beranda</a>
                    <a href="{{ url()->previous() }}" class="btn btn-outline">Halaman sebelumnya</a>
                </div>
            </div>
        </section>
    </main>
</body>
</html>
