import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import { IconAction } from '@/Components/RowActions';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';

const STATUS_TONE = {
    dinilai: 'success',
    terlambat: 'error',
    dikumpulkan: 'warning',
};

export default function RubrikPenilaianGrading({ tugas, praktikans, pengumpulans, nilaiRubriks, nilaiTambahans }) {
    const [showTambahModal, setShowTambahModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filteredPraktikans, setFilteredPraktikans] = useState(praktikans);

    useEffect(() => {
        setFilteredPraktikans(praktikans);
    }, [praktikans]);

    const nilaiTambahanForm = useForm({
        tugas_praktikum_id: tugas.id,
        praktikan_id: '',
        praktikan_search: '',
        nilai: 0,
        kategori: 'bonus',
        keterangan: '',
    });

    const getKomponenById = (komponenId) => tugas.rubrik_aktif?.komponen_rubriks.find((k) => k.id === komponenId);

    const handleNilaiRubrikChange = async (praktikanId, komponenId, nilai, catatan = '') => {
        if (nilai < 0 || nilai > getKomponenById(komponenId)?.nilai_maksimal) return;

        setLoading(true);
        try {
            const pengumpulanId = pengumpulans[praktikanId]?.id || null;

            await axios.post(route('praktikum.nilai-rubrik.store'), {
                komponen_rubrik_id: komponenId,
                praktikan_id: praktikanId,
                nilai,
                catatan,
                pengumpulan_tugas_id: pengumpulanId,
            });

            window.location.reload();
        } catch (error) {
            console.error('Error saving nilai:', error);
            alert('Gagal menyimpan nilai: ' + error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTambahNilai = (e) => {
        e.preventDefault();
        nilaiTambahanForm.post(route('praktikum.nilai-tambahan.store'), {
            onSuccess: () => {
                setShowTambahModal(false);
                nilaiTambahanForm.reset();
                window.location.reload();
            },
        });
    };

    const hapusNilaiTambahan = async (nilaiId) => {
        if (!confirm('Hapus nilai tambahan ini?')) return;

        try {
            await axios.delete(route('praktikum.nilai-tambahan.delete', nilaiId));
            window.location.reload();
        } catch (error) {
            alert('Gagal menghapus nilai tambahan');
        }
    };

    const getNilaiRubrik = (praktikanId, komponenId) => nilaiRubriks[praktikanId]?.[komponenId]?.[0];

    const getNilaiTambahan = (praktikanId) => nilaiTambahans[praktikanId] || [];

    const calculateTotalNilai = (praktikanId) => {
        let total = 0;
        let totalBobot = 0;

        tugas.rubrik_aktif.komponen_rubriks.forEach((komponen) => {
            const nilai = getNilaiRubrik(praktikanId, komponen.id);
            if (nilai) {
                total += (nilai.nilai / komponen.nilai_maksimal) * komponen.bobot;
            }
            totalBobot += komponen.bobot;
        });

        const nilaiTambahan = getNilaiTambahan(praktikanId);
        const totalNilaiTambahan = nilaiTambahan.reduce((sum, nilai) => sum + parseFloat(nilai.nilai), 0);

        return { nilaiRubrik: total, nilaiTambahan: totalNilaiTambahan, nilaiAkhir: total + totalNilaiTambahan };
    };

    const rows = useMemo(
        () =>
            (praktikans || []).map((praktikan) => ({
                id: praktikan.id,
                praktikan: praktikan.user.name,
                nim: praktikan.nim,
                pengumpulan: pengumpulans[praktikan.id] || null,
            })),
        [praktikans, pengumpulans],
    );

    const columns = useMemo(() => {
        const komponenColumns = (tugas.rubrik_aktif?.komponen_rubriks || []).map((komponen) => ({
            key: `komponen_${komponen.id}`,
            header: (
                <div className="space-y-1">
                    <div>{komponen.nama_komponen}</div>
                    <div className="text-xs font-normal text-base-content/60">
                        {komponen.bobot}% (Max: {komponen.nilai_maksimal})
                    </div>
                </div>
            ),
            sortable: false,
            searchable: false,
            render: (row) => {
                const nilaiRubrik = getNilaiRubrik(row.id, komponen.id);
                return (
                    <div className="space-y-2">
                        <input
                            type="number"
                            min="0"
                            max={komponen.nilai_maksimal}
                            step="0.1"
                            value={nilaiRubrik?.nilai || ''}
                            onChange={(e) => handleNilaiRubrikChange(row.id, komponen.id, parseFloat(e.target.value) || 0)}
                            className="input input-bordered input-sm w-20 text-center focus:input-primary"
                            placeholder="0"
                            disabled={loading}
                        />
                        {nilaiRubrik?.catatan && (
                            <div className="max-w-20 truncate text-xs text-base-content/60" title={nilaiRubrik.catatan}>
                                {nilaiRubrik.catatan}
                            </div>
                        )}
                    </div>
                );
            },
        }));

        return [
            {
                key: 'praktikan',
                header: 'Praktikan',
                render: (row) => (
                    <div>
                        <div className="font-medium">{row.praktikan}</div>
                        <div className="text-sm text-base-content/70">{row.nim}</div>
                    </div>
                ),
            },
            {
                key: 'pengumpulan',
                header: 'Status',
                sortable: false,
                searchable: false,
                render: (row) =>
                    row.pengumpulan ? (
                        <StatusBadge status={STATUS_TONE[row.pengumpulan.status] ?? 'neutral'} label={row.pengumpulan.status} />
                    ) : (
                        <StatusBadge status="neutral" label="Belum mengumpulkan" />
                    ),
            },
            ...komponenColumns,
            {
                key: 'nilai_tambahan',
                header: 'Nilai Tambahan',
                sortable: false,
                searchable: false,
                render: (row) => {
                    const nilaiTambahanList = getNilaiTambahan(row.id);
                    const nilaiTotal = calculateTotalNilai(row.id);
                    return (
                        <div className="space-y-1">
                            {nilaiTambahanList.map((nilai) => (
                                <div key={nilai.id} className="flex items-center justify-between gap-2 rounded bg-base-200 px-2 py-1">
                                    <span className="text-xs">
                                        {nilai.kategori}: +{nilai.nilai}
                                    </span>
                                    <IconAction label="Hapus nilai tambahan" icon={Trash2} tone="delete" onClick={() => hapusNilaiTambahan(nilai.id)} />
                                </div>
                            ))}
                            <div className="text-xs font-medium">Total: +{nilaiTotal.nilaiTambahan}</div>
                        </div>
                    );
                },
            },
            {
                key: 'total',
                header: 'Total Nilai',
                sortable: false,
                searchable: false,
                render: (row) => {
                    const nilaiTotal = calculateTotalNilai(row.id);
                    return (
                        <div className="space-y-1">
                            <div>Rubrik: {nilaiTotal.nilaiRubrik.toFixed(2)}</div>
                            <div className="text-xs text-success">Bonus: +{nilaiTotal.nilaiTambahan}</div>
                            <div className="text-lg font-bold text-primary">{nilaiTotal.nilaiAkhir.toFixed(2)}</div>
                        </div>
                    );
                },
            },
        ];
    }, [tugas.rubrik_aktif, pengumpulans, loading]);

    if (!tugas.rubrik_aktif) {
        return (
            <DashboardLayout>
                <Head title="Penilaian Tugas" />
                <PageHeader title="Penilaian Tugas" description={tugas.judul_tugas} />
                <PageSection>
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <p className="text-base-content/70">Belum ada rubrik penilaian untuk tugas ini.</p>
                        <Button href={route('praktikum.tugas.rubrik.index', tugas.id)}>Buat Rubrik Penilaian</Button>
                    </div>
                </PageSection>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Head title={`Penilaian - ${tugas.judul_tugas}`} />

            <PageHeader
                title="Penilaian Tugas"
                description={`${tugas.judul_tugas} - ${tugas.praktikum.mata_kuliah} (Rubrik: ${tugas.rubrik_aktif.nama_rubrik})`}
                actions={
                    <>
                        <Button variant="ghost" onClick={() => router.visit(`/praktikum/${tugas.praktikum_id}/tugas`)}>
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Daftar Tugas
                        </Button>
                        <Button onClick={() => setShowTambahModal(true)}>
                            <Plus className="h-4 w-4" />
                            Tambah Nilai Bonus
                        </Button>
                    </>
                }
            />

            <PageSection>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    rowKey="id"
                    searchPlaceholder="Cari praktikan atau NIM..."
                    emptyMessage="Belum ada praktikan pada tugas ini."
                />
            </PageSection>

            <Modal show={showTambahModal} onClose={() => setShowTambahModal(false)} maxWidth="md">
                <form onSubmit={handleTambahNilai}>
                    <header className="flex items-center justify-between border-b border-base-content/10 px-5 py-4">
                        <h3 className="text-lg font-semibold">Tambah Nilai Bonus</h3>
                        <button
                            type="button"
                            onClick={() => setShowTambahModal(false)}
                            className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
                            aria-label="Tutup"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </header>

                    <div className="space-y-4 p-5">
                        <FormField label="Praktikan" required>
                            <input
                                type="text"
                                placeholder="Cari nama atau NIM praktikan..."
                                value={nilaiTambahanForm.data.praktikan_search || ''}
                                onChange={(e) => {
                                    nilaiTambahanForm.setData('praktikan_search', e.target.value);

                                    const searchLower = e.target.value.toLowerCase();
                                    setFilteredPraktikans(
                                        praktikans.filter((praktikan) => {
                                            const nama = praktikan.user.name.toLowerCase();
                                            const nim = (praktikan.nim || '').toLowerCase();
                                            return nama.includes(searchLower) || nim.includes(searchLower);
                                        }),
                                    );
                                }}
                                className="input input-bordered min-h-11 w-full focus:input-primary"
                            />
                        </FormField>

                        <div className="max-h-40 overflow-y-auto rounded-md border border-base-300">
                            {filteredPraktikans.map((praktikan) => (
                                <button
                                    key={praktikan.id}
                                    type="button"
                                    onClick={() => {
                                        nilaiTambahanForm.setData('praktikan_id', praktikan.id);
                                        nilaiTambahanForm.setData('praktikan_search', praktikan.user.name);
                                    }}
                                    className={`block w-full border-b border-base-content/10 px-3 py-2 text-left last:border-b-0 hover:bg-base-200 ${nilaiTambahanForm.data.praktikan_id === praktikan.id ? 'bg-base-200' : ''}`}
                                >
                                    <div className="font-medium">{praktikan.user.name}</div>
                                    <div className="text-sm text-base-content/70">NIM: {praktikan.nim || 'N/A'}</div>
                                </button>
                            ))}
                        </div>

                        <FormField label="Kategori" required>
                            <select
                                value={nilaiTambahanForm.data.kategori}
                                onChange={(e) => nilaiTambahanForm.setData('kategori', e.target.value)}
                                className="select select-bordered min-h-11 w-full focus:select-primary"
                            >
                                <option value="bonus">Bonus</option>
                                <option value="partisipasi">Partisipasi</option>
                                <option value="kehadiran">Kehadiran</option>
                                <option value="inisiatif">Inisiatif</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </FormField>

                        <FormField label="Nilai" required error={nilaiTambahanForm.errors.nilai}>
                            <input
                                type="number"
                                step="0.1"
                                value={nilaiTambahanForm.data.nilai}
                                onChange={(e) => nilaiTambahanForm.setData('nilai', parseFloat(e.target.value) || 0)}
                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                required
                            />
                        </FormField>

                        <FormField label="Keterangan" error={nilaiTambahanForm.errors.keterangan}>
                            <textarea
                                value={nilaiTambahanForm.data.keterangan}
                                onChange={(e) => nilaiTambahanForm.setData('keterangan', e.target.value)}
                                rows="3"
                                className="textarea textarea-bordered w-full focus:textarea-primary"
                            />
                        </FormField>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-base-content/10 px-5 py-4">
                        <Button variant="ghost" onClick={() => setShowTambahModal(false)}>
                            Batal
                        </Button>
                        <Button type="submit" loading={nilaiTambahanForm.processing}>
                            Simpan
                        </Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
