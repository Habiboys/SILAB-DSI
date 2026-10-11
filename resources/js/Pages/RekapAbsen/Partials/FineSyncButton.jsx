import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import Button from '@/Components/Button';

export default function FineSyncButton({ periodId }) {
    const [loading, setLoading] = useState(false);
    const sync = async () => {
        setLoading(true);
        try {
            await axios.post(route('piket.denda-piket.sync', periodId));
            router.reload({ onFinish: () => setLoading(false) });
            toast.success('Tagihan denda diperbarui.');
        } catch {
            setLoading(false);
            toast.error('Tagihan denda belum dapat diperbarui. Coba lagi.');
        }
    };
    return <Button variant="outline" loading={loading} onClick={sync}>Perbarui tagihan denda</Button>;
}
