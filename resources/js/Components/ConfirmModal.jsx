import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

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
    onInputChange = null
}) {
    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <X className="h-6 w-6 text-red-600" />,
                    button: 'bg-red-600 hover:bg-red-700 transition-colors',
                    bg: 'bg-red-50',
                    border: 'border-red-200'
                };
            case 'info':
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
                    button: 'bg-blue-600 hover:bg-blue-700 transition-colors',
                    bg: 'bg-blue-50',
                    border: 'border-blue-200'
                };
            default:
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
                    button: 'bg-yellow-600 hover:bg-yellow-700 transition-colors',
                    bg: 'bg-yellow-50',
                    border: 'border-blue-200'
                };
        }
    };

    const styles = getTypeStyles();

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        {styles.icon}
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                
                <div className={`rounded-lg p-4 mb-6 ${styles.bg} ${styles.border}`}>
                    <p className="text-sm text-gray-700">{message}</p>
                </div>
                
                {showInput && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {inputLabel}
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={onInputChange}
                            placeholder={inputPlaceholder}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                )}
                
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded-md ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
