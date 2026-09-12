export default function PageHeader({ title, description, actions }) {
    return (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-base-content">{title}</h1>
                {description && <p className="mt-1 text-sm text-base-content/70">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
    );
}
