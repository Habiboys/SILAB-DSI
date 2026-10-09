import { usePage } from '@inertiajs/react';
import Button from './Button';
import { ArrowLeft } from 'lucide-react';
import { backDestination, buildBreadcrumbs } from '../Utils/navigation';
import { navigationHistory, navigationRoutes } from '../Utils/navigationRuntime';

export default function BackButton({ fallback, mode = 'back', scope = 'app', children = 'Batal', className, variant, size, ...props }) {
    const page = usePage();
    const routes = navigationRoutes();
    const history = navigationHistory();
    const origin = window.location.origin;
    const breadcrumbs = buildBreadcrumbs(page, routes, (name, parameters) => route(name, parameters), history, origin);
    const parent = [...breadcrumbs].reverse().find((item) => item.href)?.href;
    const href = scope === 'auth' ? route('login') : backDestination(page, fallback || parent || route('dashboard'), history, routes, origin, mode);
    return <Button {...props} variant="ghost" size="sm" className={mode === 'back' ? 'gap-2 rounded-lg px-3 text-sm font-medium' : className} href={href} replace={mode === 'back'}>
        {mode === 'back' ? <><ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />Kembali</> : children}
    </Button>;
}
