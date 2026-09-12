const TONES = {
    active: 'badge-success', aktif: 'badge-success', approved: 'badge-success', disetujui: 'badge-success', selesai: 'badge-success', success: 'badge-success',
    pending: 'badge-warning', diajukan: 'badge-warning', warning: 'badge-warning',
    rejected: 'badge-error', ditolak: 'badge-error', error: 'badge-error',
    info: 'badge-info', draft: 'badge-info',
    inactive: 'badge-neutral', nonaktif: 'badge-neutral', neutral: 'badge-neutral',
};

export default function StatusBadge({ status, label, tone, className = '' }) {
    const key = String(tone ?? status ?? '').toLowerCase().replaceAll(' ', '');
    return <span className={`badge badge-sm ${TONES[key] ?? 'badge-ghost'} ${className}`}>{label ?? status ?? '-'}</span>;
}
