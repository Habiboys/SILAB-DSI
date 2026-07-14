import { Head } from "@inertiajs/react";

export default function PendingApproval() {
    const handleLogout = () => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = route("logout");
        form.appendChild(
            Object.assign(document.createElement("input"), {
                type: "hidden",
                name: "_token",
                value: document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content"),
            }),
        );
        document.body.appendChild(form);
        form.submit();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
            <Head title="Menunggu Persetujuan" />

            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
                <div className="mb-6">
                    <svg
                        className="mx-auto h-16 w-16 text-yellow-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                    Akun Belum Aktif
                </h1>

                <p className="text-gray-600 mb-6">
                    Akun Anda telah berhasil dibuat melalui Microsoft SSO, namun
                    belum memiliki role/akses di sistem ini. Silakan hubungi
                    administrator laboratorium untuk mengaktifkan akun Anda.
                </p>

                <div className="bg-gray-50 rounded-md p-4 mb-6 text-left text-sm text-gray-600">
                    <p className="font-medium mb-1">Langkah selanjutnya:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>
                            Hubungi administrator atau kepala laboratorium
                        </li>
                        <li>
                            Sampaikan email akun yang digunakan untuk mendaftar
                        </li>
                        <li>
                            Admin akan memberikan role yang sesuai (anggota,
                            asisten, praktikan, dll.)
                        </li>
                        <li>
                            Setelah role diberikan, Anda bisa login kembali dan
                            mengakses sistem
                        </li>
                    </ol>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md transition duration-150 ease-in-out"
                >
                    Keluar
                </button>
            </div>
        </div>
    );
}
