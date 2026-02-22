import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { LabProvider } from './Components/LabContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        let page = pages[`./Pages/${name}.tsx`];
        if (!page) {
             const pagesJsx = import.meta.glob('./Pages/**/*.jsx', { eager: true });
             page = pagesJsx[`./Pages/${name}.jsx`];
        }
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
    
        root.render(
            <LabProvider 
                auth={props?.auth}
                laboratorium={props?.laboratorium}
            >
                <App {...props} />
                <Toaster richColors position="top-right" />
            </LabProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});