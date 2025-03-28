import React from 'react';
import { Inertia } from '@inertiajs/inertia';

const ExportButton = ({ labId, tahunId }) => {
    const handleExport = () => {
        // Navigasi ke route export dengan parameter
        Inertia.get(route('riwayat-keuangan.export'), 
            { 
                lab_id: labId, 
                tahun_id: tahunId 
            }, 
            {
                preserveState: true,
                preserveScroll: true,
                replace: false,
            }
        );
    };

    return (
        <button 
            onClick={handleExport} 
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center space-x-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-9.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Export Excel</span>
        </button>
    );
};

export default ExportButton;