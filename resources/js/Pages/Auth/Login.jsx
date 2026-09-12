import Button from "@/Components/Button";
import FormField from "@/Components/FormField";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";

const MicrosoftMark = () => (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 23 23" aria-hidden="true">
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
);

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ email: "", password: "", remember: false });

    const submit = (event) => {
        event.preventDefault();
        post(route("login"), { onFinish: () => reset("password") });
    };

    return (
        <div className="flex min-h-screen bg-base-100 text-base-content">
            <Head title="Masuk" />
            <div className="hidden w-1/2 bg-cover bg-center bg-no-repeat md:block" style={{ backgroundImage: "url('/images/lab.png')" }} aria-hidden="true" />

            <main className="flex w-full items-center justify-center p-5 sm:p-6 md:w-1/2">
                <div className="w-full max-w-md">
                    <header className="mb-8 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Selamat Datang</h1>
                        <p className="mt-1 text-base-content/70">Silakan masuk ke akun Anda</p>
                    </header>

                    {status && <div className="alert alert-success mb-4"><span>{status}</span></div>}

                    <form onSubmit={submit} className="space-y-5">
                        <FormField label="Email" error={errors.email} required>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="nama@example.com"
                                value={data.email}
                                className="input input-bordered min-h-11 w-full"
                                autoComplete="username"
                                onChange={(event) => setData("email", event.target.value)}
                            />
                        </FormField>

                        <FormField label="Password" error={errors.password} required>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Masukkan password Anda"
                                    value={data.password}
                                    className="input input-bordered min-h-11 w-full pr-12"
                                    autoComplete="current-password"
                                    onChange={(event) => setData("password", event.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((previous) => !previous)}
                                    className="btn btn-ghost btn-square btn-sm absolute inset-y-0 right-0 min-h-11 min-w-11"
                                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path d="M10 3.5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7zm0 2C6.615 5.5 3.77 7.39 2.64 10.5 3.77 13.61 6.615 15.5 10 15.5c3.385 0 6.23-1.89 7.36-5-1.13-3.11-3.975-5-7.36-5z" />
                                        <path d="M10 7.5a3 3 0 100 6 3 3 0 000-6z" />
                                    </svg>
                                </button>
                            </div>
                        </FormField>

                        <div className="flex items-center justify-between gap-3">
                            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(event) => setData("remember", event.target.checked)}
                                    className="checkbox checkbox-sm"
                                />
                                Ingat Saya
                            </label>
                            {canResetPassword && (
                                <Link href={route("password.request")} className="min-h-11 content-center text-sm font-medium text-primary hover:underline">Lupa Password?</Link>
                            )}
                        </div>

                        <Button type="submit" loading={processing} className="w-full">{processing ? "Memproses..." : "Masuk"}</Button>
                    </form>

                    <div className="divider my-6" />
                    <div className="space-y-3">
                        <Button href={route("auth.microsoft")} variant="ghost" className="w-full justify-center"><MicrosoftMark /> Masuk dengan Microsoft</Button>
                        <Button href={route("auth.unand")} variant="ghost" className="w-full justify-center">Masuk dengan SSO Unand</Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
