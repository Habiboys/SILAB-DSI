import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <main className="flex min-h-screen flex-col items-center bg-base-200 px-4 py-6 text-base-content sm:justify-center">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-primary" />
                </Link>
            </div>

            <section className="card mt-6 w-full border border-base-content/10 bg-base-100 shadow-sm sm:max-w-md" aria-label="Autentikasi">
                <div className="card-body p-5 sm:p-7">{children}</div>
            </section>
        </main>
    );
}
