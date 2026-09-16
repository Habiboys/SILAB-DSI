import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Sheet({ show = false, onClose, title, description, children }) {
    const dialogRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (show && !dialog.open) {
            triggerRef.current = document.activeElement;
            dialog.showModal();
        } else if (!show && dialog.open) {
            dialog.close();
        }
    }, [show]);

    const handleClose = () => {
        onClose?.();
        requestAnimationFrame(() => triggerRef.current?.focus?.());
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal items-end justify-end bg-transparent p-0 sm:items-stretch"
            onClose={() => show && handleClose()}
            onCancel={(event) => {
                event.preventDefault();
                handleClose();
            }}
        >
            <section className="modal-box m-0 flex max-h-[92dvh] w-full max-w-none flex-col rounded-b-none border border-base-300 bg-base-100 p-0 shadow-xl sm:min-h-screen sm:max-h-screen sm:w-[min(30rem,92vw)] sm:rounded-none" aria-labelledby="sheet-title">
                <header className="flex items-start justify-between gap-4 border-b border-base-300 p-4 sm:p-5">
                    <div className="min-w-0">
                        <h2 id="sheet-title" className="text-lg font-semibold text-base-content">{title}</h2>
                        {description && <p className="mt-1 text-sm text-base-content/70">{description}</p>}
                    </div>
                    <button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={handleClose} aria-label="Tutup panel">
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
            </section>
            <button type="button" className="modal-backdrop cursor-default" onClick={handleClose} aria-label="Tutup panel" />
        </dialog>
    );
}
