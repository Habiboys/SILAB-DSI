import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { LabProvider } from "./Components/LabContext";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

const pagesJsx = import.meta.glob("./Pages/**/*.jsx", { eager: true });
const pagesTsx = import.meta.glob("./Pages/**/*.tsx", { eager: true });

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        return (
            pagesTsx[`./Pages/${name}.tsx`] ?? pagesJsx[`./Pages/${name}.jsx`]
        );
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <LabProvider auth={props?.auth} laboratorium={props?.laboratorium}>
                <App {...props} />
                <Toaster
                    position="top-right"
                    expand={false}
                    toastOptions={{
                        classNames: {
                            toast: 'bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3',
                            title: 'text-sm font-semibold text-gray-900',
                            description: 'text-xs text-gray-500',
                            success: 'border-green-200',
                            error: 'border-red-200',
                        },
                    }}
                />
            </LabProvider>,
        );
    },
    progress: {
        color: "#4B5563",
    },
});
