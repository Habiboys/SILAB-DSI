import React from 'react';
import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
    show,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin?',
    confirmText = 'Ya',
    cancelText = 'Tidak',
    type = 'warning', // warning, danger, info
    showInput = false,
    inputLabel = '',
    inputPlaceholder = '',
    inputValue = '',
    onInputChange = null,
}) {
    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <X className="h-6 w-6 text-red-600" />,
                    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                };
            case 'info':
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
                    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                };
            default:
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
                    button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                };
        }
    };

    const styles = getTypeStyles();
    const safeInputValue = inputValue ?? '';

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                className="fixed inset-0 z-50 flex transform items-center overflow-y-auto px-4 py-6 transition-all sm:px-0"
                onClose={onClose}
            >
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-gray-500/75" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <DialogPanel className="mb-6 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center space-x-3">
                                    {styles.icon}
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {title}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                                >
                                    &times;
                                </button>
                            </div>

                            <div
                                className={`rounded-lg p-4 mb-6 border ${styles.bg} ${styles.border}`}
                            >
                                <p className="text-sm text-gray-700">{message}</p>
                            </div>

                            {showInput && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {inputLabel}
                                    </label>
                                    <input
                                        type="text"
                                        value={safeInputValue}
                                        onChange={onInputChange ?? (() => {})}
                                        placeholder={inputPlaceholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
