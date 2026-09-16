import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const WIDTHS = {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-lg',
    xl: 'w-full max-w-xl',
    '2xl': 'w-full max-w-2xl',
};

/**
 * Panel samping kanan untuk detail ringkas, memakai struktur drawer DaisyUI.
 * Dirender ke body via portal dan tetap terpasang selama open supaya transisi
 * geser bawaan drawer-side sempat berjalan (pola dari MyUNAND-Akademik).
 */
export default function Drawer({
    open = false,
    onClose,
    title,
    subtitle,
    actions,
    children,
    footer,
    width = 'md',
}) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="drawer drawer-end fixed inset-0 z-[1002] overflow-hidden">
            <input
                type="checkbox"
                className="drawer-toggle"
                checked={open}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
            />
            <div className="drawer-side h-dvh overflow-hidden">
                <label
                    className="drawer-overlay"
                    aria-label="Tutup panel"
                    onClick={onClose}
                />
                <aside
                    className={`flex h-dvh min-h-0 flex-col overflow-hidden bg-base-100 shadow-2xl ${WIDTHS[width] ?? WIDTHS.md}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label={typeof title === 'string' ? title : undefined}
                >
                    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-base-300 px-4 py-4 sm:px-5">
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-base-content">{title}</h3>
                            {subtitle && <p className="mt-0.5 text-xs text-base-content/60">{subtitle}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            {actions}
                            <button
                                type="button"
                                className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
                                onClick={onClose}
                                aria-label="Tutup"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">{children}</div>
                    {footer && (
                        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-base-300 px-4 py-3 sm:px-5">
                            {footer}
                        </div>
                    )}
                </aside>
            </div>
        </div>,
        document.body,
    );
}
