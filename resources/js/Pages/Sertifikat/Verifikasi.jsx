import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import { Head } from '@inertiajs/react';

export default function Verifikasi({ valid, nomor, data }) {
    const fields = valid && data ? [
        ['Nama', data.nama], ['NIM', data.nim], ['Jenis sertifikat', data.jenis], ['Mata kuliah / kegiatan', data.praktikum], ['Laboratorium', data.lab], ['Tanggal terbit', data.tanggal_terbit],
    ].filter(([, value]) => value) : [];
    return <><Head title="Verifikasi Sertifikat" /><main className="flex min-h-dvh items-center justify-center bg-base-200 p-4"><div className="w-full max-w-lg space-y-4"><header className="text-center"><img src="/images/silab.png" alt="SILAB" className="mx-auto h-16 w-auto" /><p className="mt-2 text-sm text-base-content/70">Sistem Informasi Laboratorium</p></header><PageSection title="Verifikasi sertifikat" description={`Nomor sertifikat: ${nomor}`} actions={<StatusBadge status={valid ? 'aktif' : 'error'} label={valid ? 'Terverifikasi' : 'Tidak ditemukan'} />}><div aria-live="polite">{valid && data ? <dl className="divide-y divide-base-300">{fields.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-2"><dt className="text-sm text-base-content/70">{label}</dt><dd className="break-words font-medium">{value}</dd></div>)}</dl> : <div className="alert alert-error" role="alert">Nomor sertifikat ini tidak terdaftar. Hubungi administrator laboratorium jika data seharusnya tersedia.</div>}</div></PageSection><p className="text-center text-xs text-base-content/60">Diverifikasi oleh SILAB · {new Date().getFullYear()}</p></div></main></>;
}
