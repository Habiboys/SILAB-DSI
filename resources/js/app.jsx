import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { LabProvider } from "./Components/LabContext";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

const pages = import.meta.glob("./Pages/**/*.{jsx,tsx}");

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            [`./Pages/${name}.jsx`, `./Pages/${name}.tsx`],
            pages,
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <div className="min-h-screen bg-base-200 text-base-content">
            <LabProvider auth={props?.auth} laboratorium={props?.laboratorium}>
                <App {...props} />
                <Toaster
                    position="top-right"
                    expand={false}
                    theme="light"
                    invert={false}
                    richColors
                    closeButton
                    icons={{
                        success: (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ),
                        error: <XCircle className="w-5 h-5 text-red-600" />,
                        warning: (
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        ),
                        info: <Info className="w-5 h-5 text-blue-600" />,
                    }}
                    toastOptions={{
                        classNames: {
                            toast: "bg-white text-gray-900 border border-gray-200 shadow-lg rounded-lg px-4 py-3",
                            title: "text-sm font-semibold text-inherit",
                            description: "text-xs text-inherit opacity-80",
                            closeButton:
                                "bg-white border border-gray-200 text-gray-500 hover:text-gray-700",
                            success:
                                "bg-green-50 !text-green-900 border-green-200 border-l-4 border-l-green-500",
                            error: "bg-red-50 !text-red-900 border-red-200 border-l-4 border-l-red-500",
                            warning:
                                "bg-amber-50 !text-amber-900 border-amber-200 border-l-4 border-l-amber-500",
                            info: "bg-blue-50 !text-blue-900 border-blue-200 border-l-4 border-l-blue-500",
                        },
                    }}
                />
            </LabProvider>
            </div>,
        );
    },
    progress: {
        color: "#4B5563",
    },
});
