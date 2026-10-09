import Button from "@/Components/Button";
import FaceCapture from "@/Components/FaceCapture";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import StatusBadge from "@/Components/StatusBadge";
import { confirmDialog } from "@/Components/confirmDialog";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { useKepengurusanAccess } from '@/Hooks/useKepengurusanAccess';

export default function Wajah({ enrollment, approved, canReviewFaces, hasActiveLab }) {
    const { canMutate } = useKepengurusanAccess();
    const [proof, setProof] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const pending = enrollment?.status === "pending";

    const submit = async () => {
        if (!proof) return;
        setSubmitting(true);
        try {
            await axios.post(route("piket.wajah.enroll"), proof);
            toast.success("Pendaftaran wajah dikirim untuk persetujuan admin.");
            setProof(null);
            router.reload();
        } catch (error) {
            toast.error(error.response?.data?.errors?.face?.[0] || "Pendaftaran wajah gagal. Ulangi perekaman.");
        } finally {
            setSubmitting(false);
        }
    };

    const revoke = async () => {
        if (await confirmDialog({ title: "Cabut data wajah", message: "Anda perlu mendaftar ulang dan menunggu persetujuan untuk memakai absensi wajah.", type: "danger", confirmText: "Cabut" })) {
            router.delete(route("piket.wajah.revoke"));
        }
    };

    return (
        <DashboardLayout>
            <Head title="Pendaftaran Wajah" />
            <div className="space-y-6">
                <PageHeader title="Pendaftaran Wajah" description="Daftarkan wajah Anda untuk absensi piket pada periode yang mewajibkannya." />
                {canReviewFaces && <Button href={route("piket.wajah.review")} variant="outline">Tinjau pendaftaran</Button>}
                {!hasActiveLab && <p className="text-sm text-warning">Pilih kepengurusan lab aktif untuk mendaftarkan wajah.</p>}
                <PageSection title="Status pendaftaran">
                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={approved ? "active" : pending ? "pending" : "inactive"} label={approved ? "Aktif" : pending ? "Menunggu admin" : "Belum aktif"} />
                        {enrollment?.review_note && <p className="text-sm text-base-content/70">Catatan admin: {enrollment.review_note}</p>}
                    </div>
                    {canMutate && (approved || pending) && <Button type="button" variant="danger" className="mt-4" onClick={revoke}>Cabut data wajah</Button>}
                </PageSection>
                {canMutate && hasActiveLab && !pending && <PageSection title={approved ? "Ganti data wajah" : "Daftarkan wajah"} description="Rekam wajah di tempat terang. Permintaan baru akan ditinjau admin; data aktif sebelumnya tetap dipakai sampai disetujui.">
                    <div className="space-y-4">
                        <FaceCapture purpose="enroll" onCapture={setProof} />
                        <Button type="button" onClick={submit} loading={submitting} disabled={!proof}>Kirim untuk ditinjau</Button>
                    </div>
                </PageSection>}
            </div>
        </DashboardLayout>
    );
}
