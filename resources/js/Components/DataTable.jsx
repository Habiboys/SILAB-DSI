import Pagination from './Pagination';
import { ChevronLeft, ChevronRight, ChevronsUpDown, Inbox, Search, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const readValue = (row, key) => key.split('.').reduce((value, part) => value?.[part], row);

export function DataTable({ children, className = '' }) {
    return (
        <div className="silab-table-frame">
            <table className={`table table-sm w-full border-collapse ${className}`}>{children}</table>
        </div>
    );
}

export function DataTableHead({ children }) {
    return <thead className="bg-base-200 text-base-content">{children}</thead>;
}

export function DataTableEmpty({ colSpan, message = 'Belum ada data.' }) {
    return (
        <tr>
            <td colSpan={colSpan}>
                <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-base-content/70">
                    <Inbox className="h-6 w-6" aria-hidden="true" />
                    <span>{message}</span>
                </div>
            </td>
        </tr>
    );
}

export function DataTableState({ colSpan, state = 'loading', message }) {
    const isError = state === 'error';
    return (
        <tr>
            <td colSpan={colSpan}>
                <div className={`flex min-h-32 items-center justify-center gap-2 text-center ${isError ? 'text-error' : 'text-base-content/70'}`} role={isError ? 'alert' : 'status'}>
                    {isError ? <TriangleAlert className="h-5 w-5" aria-hidden="true" /> : <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
                    <span>{message ?? (isError ? 'Data gagal dimuat. Muat ulang halaman untuk mencoba lagi.' : 'Memuat data...')}</span>
                </div>
            </td>
        </tr>
    );
}

export function ServerDataTable({
    paginator,
    columns,
    search = '',
    onSearchChange,
    searchPlaceholder = 'Cari data...',
    perPage = 10,
    onPerPageChange,
    filters = [],
    emptyMessage = 'Belum ada data.',
    loading = false,
    error,
    rowKey = 'id',
    sort,
    onSortChange,
}) {
    const rows = paginator?.data ?? [];
    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <label className="form-control w-full lg:max-w-sm">
                    <span className="label"><span className="label-text">Pencarian</span></span>
                    <label className="input input-bordered flex min-h-11 w-full items-center gap-2 focus-within:input-primary">
                        <Search className="h-4 w-4" aria-hidden="true" />
                        <input value={search} onChange={onSearchChange} className="grow" placeholder={searchPlaceholder} />
                    </label>
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                    {filters.map((filter) => (
                        <label key={filter.key} className="form-control min-w-40">
                            <span className="label"><span className="label-text">{filter.label}</span></span>
                            {filter.control}
                        </label>
                    ))}
                    <label className="form-control min-w-36">
                        <span className="label"><span className="label-text">Baris</span></span>
                        <select className="select select-bordered min-h-11 focus:select-primary" value={perPage} onChange={onPerPageChange}>
                            {[10, 15, 25, 50, 100].map((size) => <option key={size} value={size}>{size} per halaman</option>)}
                        </select>
                    </label>
                </div>
            </div>
            <DataTable>
                <DataTableHead><tr>{columns.map((column) => <th key={column.key ?? column.header} className={column.headerClassName ?? ''}>{sort && column.sortable !== false && column.key ? (
                    <button type="button" className="btn btn-ghost btn-sm min-h-11 w-full justify-between px-1" onClick={() => onSortChange?.({ key: column.key, direction: sort.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>
                        {column.header}
                        <ChevronsUpDown className={`h-4 w-4 ${sort.key === column.key ? 'text-primary' : 'opacity-40'}`} aria-hidden="true" />
                    </button>
                ) : column.header}</th>)}</tr></DataTableHead>
                <tbody>
                    {loading && <DataTableState colSpan={columns.length} />}
                    {error && <DataTableState colSpan={columns.length} state="error" message={error} />}
                    {!loading && !error && rows.map((row, index) => <tr key={typeof rowKey === 'function' ? rowKey(row) : readValue(row, rowKey)} className="hover">{columns.map((column) => <td key={column.key ?? column.header} className={column.cellClassName ?? ''}>{column.render ? column.render(row, (paginator?.from ?? 1) - 1 + index) : readValue(row, column.key)}</td>)}</tr>)}
                    {!loading && !error && !rows.length && <DataTableEmpty colSpan={columns.length} message={emptyMessage} />}
                </tbody>
            </DataTable>
            {!!paginator && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-base-content/70">Menampilkan {paginator.from ?? 0}-{paginator.to ?? 0} dari {paginator.total ?? rows.length} data</p>{paginator.links && <Pagination links={paginator.links} />}</div>}
        </div>
    );
}

export function DataGrid({
    rows = [],
    columns,
    rowKey = 'id',
    searchPlaceholder = 'Cari data...',
    emptyMessage = 'Belum ada data.',
    loading = false,
    error = '',
    defaultPerPage = 10,
    filters = [],
    server,
}) {
    const [search, setSearch] = useState(server?.search ?? '');
    const [perPage, setPerPage] = useState(server?.perPage ?? defaultPerPage);
    const [page, setPage] = useState(server?.page ?? 1);
    const [sort, setSort] = useState(server?.sort ?? { key: '', direction: 'asc' });
    const [filterValues, setFilterValues] = useState(server?.filters ?? {});

    const updateServer = (changes) => server?.onChange?.({
        search,
        perPage,
        page,
        sort,
        filters: filterValues,
        ...changes,
    });

    const filteredRows = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('id-ID');
        const searchableColumns = columns.filter((column) => column.searchable !== false && column.key);

        const result = rows.filter((row) => {
            const matchesSearch = !term || searchableColumns.some((column) =>
                String(readValue(row, column.key) ?? '').toLocaleLowerCase('id-ID').includes(term),
            );
            const matchesFilters = filters.every((filter) =>
                !filterValues[filter.key] || String(readValue(row, filter.key) ?? '') === String(filterValues[filter.key]),
            );
            return matchesSearch && matchesFilters;
        });

        if (!sort.key) return result;
        return [...result].sort((left, right) => {
            const a = readValue(left, sort.key);
            const b = readValue(right, sort.key);
            const comparison = String(a ?? '').localeCompare(String(b ?? ''), 'id-ID', { numeric: true });
            return sort.direction === 'asc' ? comparison : -comparison;
        });
    }, [columns, filterValues, filters, rows, search, sort]);

    const totalRows = server?.total ?? filteredRows.length;
    const totalPages = Math.max(1, server?.lastPage ?? Math.ceil(totalRows / perPage));
    const currentPage = Math.min(server?.page ?? page, totalPages);
    const visibleRows = server ? rows : filteredRows.slice((currentPage - 1) * perPage, currentPage * perPage);
    const from = totalRows ? (server?.from ?? (currentPage - 1) * perPage + 1) : 0;
    const to = server?.to ?? Math.min(currentPage * perPage, totalRows);

    const updateSearch = (value) => {
        setSearch(value);
        setPage(1);
        updateServer({ search: value, page: 1 });
    };

    const toggleSort = (key) => {
        const nextSort = { key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' };
        setSort(nextSort);
        setPage(1);
        updateServer({ sort: nextSort, page: 1 });
    };

    const updateFilter = (key, value) => {
        const nextFilters = { ...filterValues, [key]: value };
        setFilterValues(nextFilters);
        setPage(1);
        updateServer({ filters: nextFilters, page: 1 });
    };

    const updatePerPage = (value) => {
        setPerPage(value);
        setPage(1);
        updateServer({ perPage: value, page: 1 });
    };

    const updatePage = (value) => {
        setPage(value);
        updateServer({ page: value });
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <label className="form-control w-full lg:max-w-sm">
                    <span className="label"><span className="label-text">Pencarian</span></span>
                    <div className="join w-full">
                        <label className="input input-bordered join-item flex min-h-11 w-full items-center gap-2 focus-within:input-primary">
                            <Search className="h-4 w-4" aria-hidden="true" />
                            <input value={search} onChange={(event) => updateSearch(event.target.value)} className="grow" placeholder={searchPlaceholder} />
                        </label>
                        {search && <button type="button" className="btn btn-ghost join-item min-h-11 border border-base-300" onClick={() => updateSearch('')} aria-label="Hapus pencarian"><X className="h-4 w-4" /></button>}
                    </div>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                    {filters.map((filter) => (
                        <label key={filter.key} className="form-control min-w-40">
                            <span className="label"><span className="label-text">{filter.label}</span></span>
                            <select className="select select-bordered min-h-11 focus:select-primary" value={filterValues[filter.key] ?? ''} onChange={(event) => updateFilter(filter.key, event.target.value)}>
                                <option value="">Semua</option>
                                {filter.options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
                            </select>
                        </label>
                    ))}
                    <label className="form-control min-w-32">
                        <span className="label"><span className="label-text">Baris</span></span>
                        <select className="select select-bordered min-h-11 focus:select-primary" value={perPage} onChange={(event) => updatePerPage(Number(event.target.value))}>
                            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} per halaman</option>)}
                        </select>
                    </label>
                </div>
            </div>

            <DataTable>
                <DataTableHead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key ?? column.header} className={column.headerClassName ?? ''}>
                                {column.sortable === false || !column.key ? column.header : (
                                    <button type="button" className="btn btn-ghost btn-sm min-h-11 w-full justify-between px-1" onClick={() => toggleSort(column.key)}>
                                        {column.header}
                                        <ChevronsUpDown className={`h-4 w-4 ${sort.key === column.key ? 'text-primary' : 'opacity-40'}`} aria-hidden="true" />
                                    </button>
                                )}
                            </th>
                        ))}
                    </tr>
                </DataTableHead>
                <tbody aria-busy={loading}>
                    {loading && (
                        <tr><td colSpan={columns.length}><div className="flex min-h-32 items-center justify-center gap-2" role="status"><span className="loading loading-spinner loading-sm" /><span>Memuat data...</span></div></td></tr>
                    )}
                    {!loading && error && (
                        <tr><td colSpan={columns.length}><div className="alert alert-error m-3" role="alert"><span>{error}</span></div></td></tr>
                    )}
                    {!loading && !error && visibleRows.map((row, index) => (
                        <tr key={typeof rowKey === 'function' ? rowKey(row) : readValue(row, rowKey)} className="hover">
                            {columns.map((column) => (
                                <td key={column.key ?? column.header} className={column.cellClassName ?? ''}>
                                    {column.render ? column.render(row, from + index - 1) : readValue(row, column.key)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {!loading && !error && !visibleRows.length && <DataTableEmpty colSpan={columns.length} message={emptyMessage} />}
                </tbody>
            </DataTable>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-base-content/70">Menampilkan {from}-{to} dari {totalRows} data</p>
                <div className="join" aria-label="Navigasi halaman">
                    <button type="button" className="btn btn-ghost join-item min-h-11 min-w-11 border border-base-300" disabled={currentPage === 1 || loading} onClick={() => updatePage(currentPage - 1)} aria-label="Halaman sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
                    <button type="button" className="btn btn-ghost join-item min-h-11 border border-base-300" disabled>Halaman {currentPage} dari {totalPages}</button>
                    <button type="button" className="btn btn-ghost join-item min-h-11 min-w-11 border border-base-300" disabled={currentPage === totalPages || loading} onClick={() => updatePage(currentPage + 1)} aria-label="Halaman berikutnya"><ChevronRight className="h-4 w-4" /></button>
                </div>
            </div>
        </div>
    );
}
