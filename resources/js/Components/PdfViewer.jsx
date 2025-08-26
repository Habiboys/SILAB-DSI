import React from 'react';
import { X, Download } from 'lucide-react';

export default function PdfViewer({ show, onClose, fileUrl, filename }) {
    const downloadFile = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold">
                        Preview: {filename}
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={downloadFile}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* PDF Content */}
                <div className="flex-1 h-full">
                    <object
                        data={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        type="application/pdf"
                        className="w-full h-full"
                        onError={(e) => {
                            console.error('PDF preview error:', e);
                            // Fallback: redirect to download
                            window.open(fileUrl, '_blank');
                        }}
                    >
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                                <p className="text-gray-600 mb-4">PDF tidak dapat ditampilkan</p>
                                <button
                                    onClick={() => window.open(fileUrl, '_blank')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Buka di Tab Baru
                                </button>
                            </div>
                        </div>
                    </object>
                </div>
            </div>
        </div>
    );
}
