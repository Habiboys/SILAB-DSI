# Dokumentasi Modul Auth

Direktori ini berisi diagram Use Case dan Sequence untuk **Modul Auth** pada sistem SILAB.

---

## Daftar Use Case

| Kode | Nama Use Case         | Aktor                            | Middleware |
| ---- | --------------------- | -------------------------------- | ---------- |
| UC01 | Login                 | Publik                           | guest      |
| UC02 | Register              | Publik                           | guest      |
| UC03 | Lupa & Reset Password | Publik                           | guest      |
| UC04 | Logout                | Admin, Asisten, Kadep, Praktikan | auth       |
| UC05 | Ganti Password        | Admin, Asisten, Kadep, Praktikan | auth       |
| UC06 | Verifikasi Email      | Admin, Asisten, Kadep, Praktikan | auth       |
| UC07 | Konfirmasi Password   | Admin, Asisten, Kadep, Praktikan | auth       |

> UC04–UC07 menggunakan aktor abstrak **Pengguna** sebagai induk generalisasi dari Admin, Asisten, Kadep, dan Praktikan.

**Diagram:** [`usecase/UC_AUTH.puml`](usecase/UC_AUTH.puml)

---

## Daftar Sequence Diagram

| File                                                                          | Use Case | Skenario                                                                          |
| ----------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| [`SEQ_01_LOGIN.puml`](sequence/SEQ_01_LOGIN.puml)                             | UC01     | A: Buka halaman login — B: Login berhasil (dengan rate limit & redirect per role) |
| [`SEQ_02_REGISTER.puml`](sequence/SEQ_02_REGISTER.puml)                       | UC02     | A: Buka halaman register — B: Register berhasil                                   |
| [`SEQ_03_LUPA_RESET_PASSWORD.puml`](sequence/SEQ_03_LUPA_RESET_PASSWORD.puml) | UC03     | A: Request link reset via email — B: Reset password via token                     |
| [`SEQ_04_LOGOUT.puml`](sequence/SEQ_04_LOGOUT.puml)                           | UC04     | Logout (invalidate session + regenerate CSRF token)                               |
| [`SEQ_05_GANTI_PASSWORD.puml`](sequence/SEQ_05_GANTI_PASSWORD.puml)           | UC05     | Ganti password dengan verifikasi password lama                                    |
| [`SEQ_06_VERIFIKASI_EMAIL.puml`](sequence/SEQ_06_VERIFIKASI_EMAIL.puml)       | UC06     | A: Lihat notice — B: Kirim ulang email — C: Verifikasi via link                   |
| [`SEQ_07_KONFIRMASI_PASSWORD.puml`](sequence/SEQ_07_KONFIRMASI_PASSWORD.puml) | UC07     | A: Tampil form konfirmasi — B: Submit konfirmasi password                         |

---

## Struktur Direktori

```
docs/auth/
├── usecase/
│   └── UC_AUTH.puml
├── sequence/
│   ├── SEQ_01_LOGIN.puml
│   ├── SEQ_02_REGISTER.puml
│   ├── SEQ_03_LUPA_RESET_PASSWORD.puml
│   ├── SEQ_04_LOGOUT.puml
│   ├── SEQ_05_GANTI_PASSWORD.puml
│   ├── SEQ_06_VERIFIKASI_EMAIL.puml
│   └── SEQ_07_KONFIRMASI_PASSWORD.puml
└── README.md
```

---

## Controller & Route

| Controller                                | File                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `AuthenticatedSessionController`          | `app/Http/Controllers/Auth/AuthenticatedSessionController.php`          |
| `RegisteredUserController`                | `app/Http/Controllers/Auth/RegisteredUserController.php`                |
| `PasswordResetLinkController`             | `app/Http/Controllers/Auth/PasswordResetLinkController.php`             |
| `NewPasswordController`                   | `app/Http/Controllers/Auth/NewPasswordController.php`                   |
| `PasswordController`                      | `app/Http/Controllers/Auth/PasswordController.php`                      |
| `EmailVerificationPromptController`       | `app/Http/Controllers/Auth/EmailVerificationPromptController.php`       |
| `EmailVerificationNotificationController` | `app/Http/Controllers/Auth/EmailVerificationNotificationController.php` |
| `VerifyEmailController`                   | `app/Http/Controllers/Auth/VerifyEmailController.php`                   |
| `ConfirmablePasswordController`           | `app/Http/Controllers/Auth/ConfirmablePasswordController.php`           |

### Routes (guest middleware)

| Method | Route                     | Controller & Action                     | Use Case |
| ------ | ------------------------- | --------------------------------------- | -------- |
| GET    | `/login`                  | `AuthenticatedSessionController@create` | UC01     |
| POST   | `/login`                  | `AuthenticatedSessionController@store`  | UC01     |
| GET    | `/register`               | `RegisteredUserController@create`       | UC02     |
| POST   | `/register`               | `RegisteredUserController@store`        | UC02     |
| GET    | `/forgot-password`        | `PasswordResetLinkController@create`    | UC03     |
| POST   | `/forgot-password`        | `PasswordResetLinkController@store`     | UC03     |
| GET    | `/reset-password/{token}` | `NewPasswordController@create`          | UC03     |
| POST   | `/reset-password`         | `NewPasswordController@store`           | UC03     |

### Routes (auth middleware)

| Method | Route                              | Controller & Action                              | Use Case |
| ------ | ---------------------------------- | ------------------------------------------------ | -------- |
| POST   | `/logout`                          | `AuthenticatedSessionController@destroy`         | UC04     |
| PUT    | `/password`                        | `PasswordController@update`                      | UC05     |
| GET    | `/verify-email`                    | `EmailVerificationPromptController`              | UC06     |
| POST   | `/email/verification-notification` | `EmailVerificationNotificationController@store`  | UC06     |
| GET    | `/verify-email/{id}/{hash}`        | `VerifyEmailController` `[signed, throttle:6,1]` | UC06     |
| GET    | `/confirm-password`                | `ConfirmablePasswordController@show`             | UC07     |
| POST   | `/confirm-password`                | `ConfirmablePasswordController@store`            | UC07     |

---

## Catatan Implementasi

- **Rate Limiting Login:** Maksimum 5 percobaan login per throttle key (`email|ip`). Jika melebihi, user dikunci sementara dan diberikan informasi waktu tunggu.
- **Redirect setelah Login:** Berbeda per role — `praktikan` diarahkan ke `praktikan.daftar-tugas`, sedangkan `admin`/`kadep` dan lainnya diarahkan ke `dashboard`.
- **Email Verification:** Dipicu otomatis oleh event `Registered` saat registrasi. Pengguna bisa meminta kirim ulang dengan throttle 6 kali per menit.
- **Konfirmasi Password:** Disimpan di session (`auth.password_confirmed_at`). Tidak perlu konfirmasi ulang selama interval tertentu (default Laravel: 3 jam).
- **Password Reset Token:** Disimpan di tabel `password_reset_tokens`, di-hash SHA-256, dan bersifat single-use.
