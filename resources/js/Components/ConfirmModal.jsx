import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

const TYPE_STYLES = {
  danger: { icon: X, alert: 'alert-error', button: 'btn-error' },
  info: { icon: Info, alert: 'alert-info', button: 'btn-info' },
  warning: { icon: AlertTriangle, alert: 'alert-warning', button: 'btn-warning' },
};

export default function ConfirmModal({
  show,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmText = 'Ya',
  cancelText = 'Tidak',
  type = 'warning',
  showInput = false,
  inputLabel = '',
  inputPlaceholder = '',
  inputValue = '',
  onInputChange = null,
}) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.warning;
  const Icon = style.icon;
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

  const handleClose = () => {
    if (closedByProp.current) {
      closedByProp.current = false;
      return;
    }
    onClose?.();
  };

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={handleClose}>
      <div className="modal-box relative max-w-md border border-base-content/10 bg-base-100 p-0 text-base-content shadow-xl">
        <div className="flex items-center justify-between border-b border-base-content/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <Icon className="h-6 w-6" aria-hidden="true" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11" aria-label="Tutup konfirmasi">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div role="alert" className={`alert ${style.alert}`}>
            <span className="text-sm">{message}</span>
          </div>

          {showInput && (
            <label className="form-control w-full">
              <span className="label"><span className="label-text font-medium">{inputLabel}</span></span>
              <input
                type="text"
                value={inputValue ?? ''}
                onChange={onInputChange ?? (() => {})}
                placeholder={inputPlaceholder}
                className="input input-bordered min-h-11 w-full focus:input-primary"
              />
            </label>
          )}
        </div>

        <div className="modal-action m-0 border-t border-base-content/10 px-5 py-4">
          <button type="button" onClick={onClose} className="btn btn-outline min-h-11">{cancelText}</button>
          <button type="button" onClick={onConfirm} className={`btn min-h-11 ${style.button}`}>{confirmText}</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}