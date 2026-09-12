import { useEffect, useRef } from 'react';

const SIZE_CLASS = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    '6xl': 'sm:max-w-6xl',
};

/**
 * Modal berbasis elemen <dialog> native (metode yang direkomendasikan DaisyUI).
 * showModal() menaikkan dialog ke top layer: overlay selalu menutupi viewport,
 * Escape berfungsi, latar terkunci, dan tidak butuh z-index manual.
 */
export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const dialogRef = useRef(null);
    const closedByProp = useRef(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (show && !dialog.open) {
            dialog.showModal();
        } else if (!show && dialog.open) {
            closedByProp.current = true;
            dialog.close();
        }
    }, [show]);

    // Menangkap semua jalur penutupan: Escape, klik backdrop, tombol tutup.
    const handleClose = () => {
        if (closedByProp.current) {
            closedByProp.current = false;
            return;
        }
        if (closeable) onClose();
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal modal-bottom sm:modal-middle"
            onClose={handleClose}
            onCancel={(event) => {
                if (!closeable) event.preventDefault();
            }}
        >
            <div
                className={`modal-box mb-6 flex max-h-[calc(100vh-5em)] transform flex-col overflow-hidden border border-base-content/10 bg-base-100 p-0 text-base-content shadow-xl ${
                    SIZE_CLASS[maxWidth] || SIZE_CLASS['2xl']
                }`}
            >
                {children}
            </div>

            {closeable && (
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            )}
        </dialog>
    );
}