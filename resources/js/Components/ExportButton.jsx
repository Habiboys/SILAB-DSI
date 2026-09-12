import { Inertia } from '@inertiajs/inertia';
import { Download } from 'lucide-react';

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
            type="button"
            onClick={handleExport}
            className="btn btn-success min-h-11"
        >
            <Download className="h-5 w-5" aria-hidden="true" />
            <span>Ekspor Excel</span>
        </button>
    );
};

export default ExportButton;