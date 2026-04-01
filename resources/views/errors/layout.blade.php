<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>@yield('title')</title>

        <!-- Styles -->
        <style>
            html, body {
                margin: 0;
                min-height: 100vh;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                background: #eff6ff;
                color: #1f2937;
            }

            .full-height {
                min-height: 100vh;
            }

            .flex-center {
                align-items: center;
                display: flex;
                justify-content: center;
                padding: 24px;
            }

            .position-ref {
                position: relative;
            }

            .content {
                text-align: center;
                width: 100%;
                max-width: 560px;
                background: #fff;
                border-radius: 14px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
                padding: 28px;
            }

            .title {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
            }

            .brand {
                color: #2563eb;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .08em;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="flex-center position-ref full-height">
            <div class="content">
                <div class="brand">SILAB</div>
                <div class="title">
                    @yield('message')
                </div>
            </div>
        </div>
    </body>
</html>
