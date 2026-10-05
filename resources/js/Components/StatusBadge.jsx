const TONES = {
    active: 'badge-success', aktif: 'badge-success', approved: 'badge-success', disetujui: 'badge-success', selesai: 'badge-success', success: 'badge-success',
    pending: 'badge-warning', diajukan: 'badge-warning', warning: 'badge-warning',
    rejected: 'badge-error', ditolak: 'badge-error', error: 'badge-error',
    info: 'badge-info', draft: 'badge-info',
    // Hindari badge-neutral (hitam/abu): pakai permukaan berwarna yang tetap netral.
    inactive: 'border border-base-300 bg-secondary/10 text-secondary',
    nonaktif: 'border border-base-300 bg-secondary/10 text-secondary',
    neutral: 'border border-base-300 bg-secondary/10 text-secondary',
    ghost: 'badge-ghost',
};

export default function StatusBadge({ status, label, tone, className = '' }) {
    const key = String(tone ?? status ?? '').toLowerCase().replaceAll(' ', '');
    return <span className={`badge badge-sm font-medium ${TONES[key] ?? 'badge-ghost'} ${className}`}>{label ?? status ?? '-'}</span>;
}
