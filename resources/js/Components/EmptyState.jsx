import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Belum ada data.', description, action, className = '' }) {
    return (
        <div className={`flex min-h-32 flex-col items-center justify-center gap-1.5 text-center ${className}`}>
            <Icon className="mb-1 h-6 w-6 text-base-content/40" aria-hidden="true" />
            <p className="text-sm text-base-content/70">{title}</p>
            {description && <p className="max-w-sm text-xs text-base-content/50">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
