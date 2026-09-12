import { Link } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

const TONES = {
    detail: 'text-info hover:bg-info/10',
    edit: 'text-warning hover:bg-warning/10',
    delete: 'text-error hover:bg-error/10',
    success: 'text-success hover:bg-success/10',
    neutral: 'text-base-content/70 hover:bg-base-200',
};

export function IconAction({ label, icon: Icon, tone = 'detail', onClick, href, disabled = false, external = false }) {
    const className = `btn btn-ghost btn-square btn-sm min-h-11 min-w-11 ${TONES[tone] ?? tone}`;
    const content = <Icon className="h-4 w-4" aria-hidden="true" />;

    return (
        <div className="tooltip tooltip-top" data-tip={label}>
            {href && external ? (
                <a href={href} className={className} aria-label={label}>{content}</a>
            ) : href ? (
                <Link href={href} className={className} aria-label={label}>{content}</Link>
            ) : (
                <button type="button" onClick={onClick} disabled={disabled} className={className} aria-label={label}>{content}</button>
            )}
        </div>
    );
}

export default function RowActions({ detailHref, editHref, onDetail, onEdit, onDelete, children }) {
    return (
        <div className="flex items-center justify-end gap-1">
            {(detailHref || onDetail) && <IconAction label="Detail" icon={Eye} href={detailHref} onClick={onDetail} tone="detail" />}
            {(editHref || onEdit) && <IconAction label="Edit" icon={Pencil} href={editHref} onClick={onEdit} tone="edit" />}
            {onDelete && <IconAction label="Hapus" icon={Trash2} onClick={onDelete} tone="delete" />}
            {children}
        </div>
    );
}
