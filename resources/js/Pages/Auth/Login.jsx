import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
            <Head title="Log in" />

            <div className="w-full max-w-4xl bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    
                    <div className="w-full md:w-1/2 flex items-center justify-center p-6">
                        <img
                            src="/images/login.jpg"
                            alt="Login Illustration"
                            className="w-full max-w-xs"
                        />
                    </div>

                    
                    <div className="w-full md:w-1/2 p-8">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Selamat Datang
                            </h1>
                            <p className="text-gray-600">
                                Sistem Informasi Laboratorium (SILAB)
                            </p>
                        </div>

                        {status && (
                            <div className="mb-4 text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-gray-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        placeholder="Masukan Email Anda"
                                        value={data.email}
                                        className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoComplete="username"
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-gray-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        name="password"
                                        placeholder="Masukan Password Anda"
                                        value={data.password}
                                        className="pl-10 pr-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoComplete="current-password"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                        aria-label={
                                            showPassword
                                                ? "Sembunyikan password"
                                                : "Lihat password"
                                        }
                                        title={
                                            showPassword
                                                ? "Sembunyikan password"
                                                : "Lihat password"
                                        }
                                    >
                                        {showPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M13.875 13.825A10.05 10.05 0 0110 14.5c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 012.1-3.592l1.454 1.454A7.993 7.993 0 002.64 7.5C3.77 10.61 6.615 12.5 10 12.5c1.032 0 2.02-.176 2.94-.5l.935.935z" />
                                                <path d="M17.657 16.243l-14-14 1.414-1.414 14 14-1.414 1.414z" />
                                                <path d="M12.454 9.626a2.5 2.5 0 00-3.08-3.08l3.08 3.08z" />
                                                <path d="M10.5 7.5a2.5 2.5 0 001.993 2.442l-2.435-2.435A2.507 2.507 0 0010.5 7.5z" />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M10 3.5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7zm0 2C6.615 5.5 3.77 7.39 2.64 10.5 3.77 13.61 6.615 15.5 10 15.5c3.385 0 6.23-1.89 7.36-5-1.13-3.11-3.975-5-7.36-5z" />
                                                <path d="M10 7.5a3 3 0 100 6 3 3 0 000-6z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between mb-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData(
                                                "remember",
                                                e.target.checked,
                                            )
                                        }
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">
                                        Remember me
                                    </span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route("password.request")}
                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Forgot your password?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                            >
                                Sign In
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
