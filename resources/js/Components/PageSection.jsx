export default function PageSection({ title, description, actions, children, className = '', bodyClassName = '' }) {
    return (
        <section className={`card bg-base-100 shadow-xs ${className}`}>
            {(title || description || actions) && (
                <header className="flex flex-col gap-2 border-b border-base-200 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div><h2 className="text-sm font-medium text-base-content sm:text-base">{title}</h2>{description && <p className="mt-0.5 text-xs text-base-content/60">{description}</p>}</div>
                    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                </header>
            )}
            <div className={`p-3.5 sm:p-4 ${bodyClassName}`}>{children}</div>
        </section>
    );
}
