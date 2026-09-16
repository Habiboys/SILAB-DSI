import { createRoot } from 'react-dom/client';
import ConfirmModal from './ConfirmModal';

let container = null;
let root = null;

/**
 * Konfirmasi imperatif berbasis ConfirmModal:
 * `if (!(await confirmDialog({ title, message }))) return;`
 * Pengganti window.confirm agar semua dialog memakai pola UI yang sama.
 */
export function confirmDialog({
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin?',
    confirmText = 'Ya',
    cancelText = 'Batal',
    type = 'warning',
} = {}) {
    return new Promise((resolve) => {
        if (!container) {
            container = document.createElement('div');
            document.body.appendChild(container);
        }
        if (!root) {
            root = createRoot(container);
        }

        const finish = (result) => {
            root.render(null);
            resolve(result);
        };

        root.render(
            <ConfirmModal
                show
                onClose={() => finish(false)}
                onConfirm={() => finish(true)}
                title={title}
                message={message}
                confirmText={confirmText}
                cancelText={cancelText}
                type={type}
            />,
        );
    });
}
