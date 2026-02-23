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
                <Toaster richColors position="top-right" />
            </LabProvider>,
        );
    },
    progress: {
        color: "#4B5563",
    },
});
