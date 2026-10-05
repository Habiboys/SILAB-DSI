export default function PageHeader({ title, description, actions }) {
    return (
        <header className="mb-4 flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-base-content md:text-2xl">{title}</h1>
                {description && <p className="mt-0.5 text-xs text-base-content/70 md:text-sm">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}
