import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { LabProvider } from './Components/LabContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
    
        root.render(
            <LabProvider 
                initialLab={props?.auth?.user?.current_lab}
                laboratories={props?.laboratorium}
                userCanSelectLab={props?.auth?.user?.can_select_lab || false}
            >
                <App {...props} />
            </LabProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});