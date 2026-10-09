import CancelButton from '@/Components/CancelButton';
import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import FormField from '@/Components/FormField';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useKepengurusanAccess } from '@/Hooks/useKepengurusanAccess';
import { Head, useForm } from '@inertiajs/react';

import { toast } from 'sonner';

const VARIABLES = [
    { token: '{nomor}', desc: 'Nomor urut (misal: 1, 2, 3)' }, { token: '{inisial_lab}', desc: 'Inisial laboratorium' }, { token: '{bulan_romawi}', desc: 'Bulan dalam angka romawi' }, { token: '{tahun}', desc: 'Tahun 4 digit' }, { token: '{bulan}', desc: 'Bulan 2 digit' },
];

export default function Konfigurasi({ kepengurusanLab, konfigurasi }) {
    const { canMutate } = useKepengurusanAccess();
    const form = useForm({ kepengurusan_lab_id: konfigurasi?.kepengurusan_lab_id || kepengurusanLab?.id || '', inisial_lab: konfigurasi?.inisial_lab || 'LAB', format_nomor: konfigurasi?.format_nomor || '{nomor}/LAB.{inisial_lab}/{bulan_romawi}/{tahun}', reset_tiap_tahun: konfigurasi?.reset_tiap_tahun ?? true });
    const preview = () => { const now = new Date(); const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']; return form.data.format_nomor.replace('{nomor}', '1').replace('{inisial_lab}', form.data.inisial_lab).replace('{bulan_romawi}', roman[now.getMonth()]).replace('{tahun}', String(now.getFullYear())).replace('{bulan}', String(now.getMonth() + 1).padStart(2, '0')); };
    const submit = (event) => { event.preventDefault(); if (!canMutate) return; form.post(route('surat-menyurat.konfigurasi.upsert'), { onSuccess: () => toast.success('Konfigurasi berhasil disimpan'), onError: (errors) => toast.error(Object.values(errors)[0] || 'Gagal menyimpan konfigurasi') }); };
    return (
        <DashboardLayout backFallback={null}>
            <Head title="Konfigurasi Surat" />
            <div className="max-w-3xl">
                <PageHeader
                    title="Konfigurasi Nomor Surat"
                    description={kepengurusanLab?.laboratorium
                        ? `${kepengurusanLab.laboratorium.nama} ? ${kepengurusanLab.tahunKepengurusan?.tahun || ''}`
                        : 'Atur format penomoran surat keluar.'}
                />
                <PageSection>
                    <form onSubmit={submit} className="space-y-4">
                        <FormField label="Inisial laboratorium" error={form.errors.inisial_lab} required>
                            <input className="input min-h-11 w-full uppercase" maxLength={20} readOnly={!canMutate}
                                value={form.data.inisial_lab} onChange={(event) => form.setData('inisial_lab', event.target.value.toUpperCase())} required />
                        </FormField>
                        <FormField label="Format nomor surat keluar" error={form.errors.format_nomor} required>
                            <input className="input min-h-11 w-full font-mono" readOnly={!canMutate}
                                value={form.data.format_nomor} onChange={(event) => form.setData('format_nomor', event.target.value)} required />
                        </FormField>
                        <div className="flex flex-wrap gap-2" aria-label="Token format">
                            {VARIABLES.map((item) => (
                                <Button key={item.token} size="sm" variant="ghost" disabled={!canMutate}
                                    onClick={() => form.setData('format_nomor', form.data.format_nomor + item.token)} title={item.desc}>
                                    {item.token}
                                </Button>
                            ))}
                        </div>
                        <div className="alert alert-info">
                            <span>Pratinjau: <strong className="break-all font-mono">{preview()}</strong></span>
                        </div>
                        <DataGrid rows={VARIABLES}
                            columns={[{ key: 'token', header: 'Token' }, { key: 'desc', header: 'Keterangan' }]}
                            searchPlaceholder="Cari token..." defaultPerPage={10} emptyMessage="Token tidak tersedia." />
                        <FormField>
                            <label className="flex min-h-11 items-center gap-3">
                                <input type="checkbox" className="toggle toggle-primary" disabled={!canMutate}
                                    checked={form.data.reset_tiap_tahun} onChange={(event) => form.setData('reset_tiap_tahun', event.target.checked)} />
                                <span>Reset nomor urut setiap tahun kepengurusan</span>
                            </label>
                        </FormField>
                        <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                            <CancelButton variant="ghost">{canMutate ? 'Batal' : 'Kembali'}</CancelButton>
                            {canMutate && <Button type="submit" loading={form.processing}>Simpan konfigurasi</Button>}
                        </div>
                    </form>
                </PageSection>
            </div>
        </DashboardLayout>
    );
}
