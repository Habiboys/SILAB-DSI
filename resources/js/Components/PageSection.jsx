export default function PageSection({ title, description, actions, children, className = '', bodyClassName = '' }) {
    return (
        <section className={`card border border-base-content/10 bg-base-100 shadow-none ${className}`}>
            {(title || description || actions) && (
                <header className="flex flex-col gap-3 border-b border-base-content/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div><h2 className="text-lg font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-base-content/70">{description}</p>}</div>
                    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                </header>
            )}
            <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
        </section>
    );
}
