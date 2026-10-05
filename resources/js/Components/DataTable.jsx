import { ArrowDown, ArrowUp, ChevronsUpDown, Search, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import EmptyState from './EmptyState';
import Pagination, { NumberPagination } from './Pagination';

const readValue = (row, key) => typeof key === 'string' ? key.split('.').reduce((value, part) => value?.[part], row) : undefined;

/** Kontrak kolom (selaras MyUNAND-Akademik):
 *  { key, header, sortable, render(row, index), className (th), cellClassName (td),
 *    filter: { type: 'select'|'text', options?: [{value,label}|string] } } */

export function SortHeaderButton({ column, active, direction, onToggle }) {
    return (
        <button type="button" className="flex min-h-11 w-full items-center justify-between gap-2 text-start md:min-h-8" onClick={onToggle}>
            {column.header}
            {active
                ? direction === 'desc'
                    ? <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    : <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                : <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" aria-hidden="true" />}
        </button>
    );
}

function FilterControl({ filter, value, onChange }) {
    if (filter.control) return filter.control;
    const type = filter.type ?? 'select';
    if (['text', 'date', 'number'].includes(type)) {
        return <input type={type} value={value ?? ''} aria-label={filter.label} onChange={(event) => onChange(event.target.value)} placeholder={filter.placeholder ?? `Saring ${String(filter.label).toLowerCase()}...`} className="input min-h-11 w-full" />;
    }
    return (
        <select className="select min-h-11 w-full" value={value ?? ''} aria-label={filter.label} onChange={(event) => onChange(event.target.value)}>
            <option value="">Semua</option>
            {(filter.options ?? []).map((option) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const label = typeof option === 'object' ? option.label : option;
                return <option key={String(optionValue)} value={optionValue}>{label}</option>;
            })}
        </select>
    );
}

function Toolbar({ search, onSearchChange, searchPlaceholder, filters, filterValues, onFilterChange, onClearFilters, perPage, onPerPageChange, perPageOptions = [10, 25, 50, 100] }) {
    return (
        <div className="flex flex-col gap-2 pb-2 xl:flex-row xl:items-end">
            <label className="w-full xl:w-64 xl:shrink-0">
                <span className="sr-only">Pencarian</span>
                <div className="join w-full">
                    <label className="input join-item flex min-h-11 w-full items-center gap-2">
                        <Search className="h-4 w-4 text-base-content/50" aria-hidden="true" />
                        <input value={search} onChange={(event) => onSearchChange(event.target.value)} className="grow" placeholder={searchPlaceholder} />
                    </label>
                    {search && (
                        <button type="button" className="btn btn-ghost join-item min-h-11 border border-base-300" onClick={() => onSearchChange('')} aria-label="Hapus pencarian">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </label>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:min-w-0 xl:flex-1 xl:flex-wrap xl:items-end xl:justify-end">
                {filters.map((filter) => (
                    <label key={filter.key} className="min-w-0 xl:w-36">
                        <span className="mb-1 block text-xs font-medium text-base-content/70">{filter.label}</span>
                        <FilterControl filter={filter} value={filterValues?.[filter.key]} onChange={(value) => onFilterChange?.(filter.key, value)} />
                    </label>
                ))}
                {onPerPageChange && (
                    <label className="min-w-0 xl:min-w-36">
                        <span className="mb-1 block text-xs font-medium text-base-content/70">Baris</span>
                        <select className="select min-h-11 w-full" value={perPage} onChange={(event) => onPerPageChange(Number(event.target.value))}>
                            {perPageOptions.map((size) => <option key={size} value={size}>{size} per halaman</option>)}
                        </select>
                    </label>
                )}
                {onClearFilters && Object.values(filterValues ?? {}).some((value) => value !== '' && value !== null && value !== undefined) && (
                    <button type="button" className="btn btn-ghost min-h-11 border border-base-300" onClick={onClearFilters}>
                        <X className="h-4 w-4" aria-hidden="true" />
                        Hapus filter
                    </button>
                )}
            </div>
        </div>
    );
}

function TableSkeletonRow({ colSpan, rows = 4 }) {
    return Array.from({ length: rows }).map((_, index) => (
        <tr key={`skeleton-${index}`}>
            <td colSpan={colSpan}>
                <div className="silab-table-skeleton w-full" />
            </td>
        </tr>
    ));
}

export function DataTable({ children, className = '', striped = true }) {
    return (
        <div className="silab-table-frame">
            <table className={`table table-sm w-full ${striped ? 'table-zebra' : ''} ${className}`}>{children}</table>
        </div>
    );
}

export function DataTableHead({ children }) {
    return <thead className="bg-base-100 text-base-content/60">{children}</thead>;
}

export function DataTableEmpty({ colSpan, message = 'Belum ada data.' }) {
    return (
        <tr>
            <td colSpan={colSpan}>
                <EmptyState title={message} />
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
                    {isError ? <TriangleAlert className="h-5 w-5" aria-hidden="true" /> : <span className="silab-table-skeleton h-4 w-4" aria-hidden="true" />}
                    <span>{message ?? (isError ? 'Data gagal dimuat. Muat ulang halaman untuk mencoba lagi.' : 'Memuat data...')}</span>
                </div>
            </td>
        </tr>
    );
}

function renderHeaderCell({ column, sort, onSortChange }) {
    const sortable = onSortChange && column.sortable !== false && column.key;
    return (
        <th key={column.key ?? column.header} className={column.headerClassName ?? column.className ?? ''}>
            <div className="flex items-center justify-between gap-1">
                {sortable ? (
                    <SortHeaderButton
                        column={column}
                        active={sort?.key === column.key}
                        direction={sort?.direction}
                        onToggle={() => onSortChange({ key: column.key, direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' })}
                    />
                ) : (
                    <span className="flex min-h-11 items-center md:min-h-8">{column.header}</span>
                )}
            </div>
        </th>
    );
}

export function ServerDataTable({
    paginator,
    columns,
    search = '',
    onSearchChange,
    searchPlaceholder = 'Cari data...',
    perPage,
    onPerPageChange,
    filters = [],
    filterValues,
    onFilterApply,
    emptyMessage = 'Belum ada data.',
    loading = false,
    error,
    rowKey = 'id',
    sort,
    onSortChange,
    dimmed = false,
    rowClassName,
}) {
    const rows = Array.isArray(paginator?.data) ? paginator.data : [];

    return (
        <div className="space-y-3">
            {(onSearchChange || filters.length > 0 || onPerPageChange) && (
                <Toolbar
                    search={search}
                    onSearchChange={onSearchChange}
                    searchPlaceholder={searchPlaceholder}
                    filters={filters}
                    filterValues={filterValues}
                    onFilterChange={onFilterApply}
                    onClearFilters={() => Object.keys(filterValues ?? {}).forEach((key) => onFilterApply?.(key, ''))}
                    perPage={perPage}
                    onPerPageChange={onPerPageChange}
                />
            )}
            <DataTable>
                <DataTableHead>
                    <tr>{columns.map((column) => renderHeaderCell({ column, sort, onSortChange }))}</tr>
                </DataTableHead>
                <tbody aria-busy={loading} className={loading && rows.length ? 'opacity-50' : ''}>
                    {loading && !rows.length && <TableSkeletonRow colSpan={columns.length} />}
                    {error && <DataTableState colSpan={columns.length} state="error" message={error} />}
                    {!error && rows.map((row, index) => (
                        <tr key={typeof rowKey === 'function' ? rowKey(row) : (readValue(row, rowKey) ?? `row-${index}`)} className={`hover ${rowClassName?.(row) ?? ''}`}>
                            {columns.map((column) => (
                                <td key={column.key ?? column.header} className={column.cellClassName ?? ''}>
                                    {column.render ? column.render(row, (paginator?.from ?? 1) - 1 + index) : readValue(row, column.key)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {!loading && !error && !rows.length && <DataTableEmpty colSpan={columns.length} message={emptyMessage} />}
                </tbody>
            </DataTable>
            {!!paginator && (
                <div className="flex flex-col gap-2 border-t border-base-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-base-content/60">Menampilkan {paginator.from ?? 0}-{paginator.to ?? 0} dari {paginator.total ?? rows.length} data</p>
                    {paginator.links && <Pagination links={paginator.links} className="mt-0" />}
                </div>
            )}
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
    rowClassName,
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

    const filterableColumns = useMemo(
        () => columns
            .filter((column) => column.filter && column.key)
            .map((column) => ({ key: column.key, label: column.header, ...column.filter })),
        [columns],
    );

    const filteredRows = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('id-ID');
        const searchableColumns = columns.filter((column) => column.searchable !== false && column.key);

        const result = (rows ?? []).filter((row) => {
            const matchesSearch = !term || searchableColumns.some((column) =>
                String(readValue(row, column.key) ?? '').toLocaleLowerCase('id-ID').includes(term),
            );
            const matchesFilters = Object.entries(filterValues).every(([key, value]) => {
                if (!value) return true;
                const column = columns.find((item) => item.key === key);
                const actual = String(readValue(row, key) ?? '');
                if (column?.filter?.type === 'text') {
                    return actual.toLocaleLowerCase('id-ID').includes(String(value).toLocaleLowerCase('id-ID'));
                }
                return actual === String(value);
            });
            return matchesSearch && matchesFilters;
        });

        if (!sort.key) return result;
        return [...result].sort((left, right) => {
            const a = readValue(left, sort.key);
            const b = readValue(right, sort.key);
            const comparison = String(a ?? '').localeCompare(String(b ?? ''), 'id-ID', { numeric: true });
            return sort.direction === 'asc' ? comparison : -comparison;
        });
    }, [columns, filterValues, rows, search, sort]);

    const totalRows = server?.total ?? filteredRows.length;
    const totalPages = Math.max(1, server?.lastPage ?? Math.ceil(totalRows / perPage));
    const currentPage = Math.min(server?.page ?? page, totalPages);
    const visibleRows = server ? (rows ?? []) : filteredRows.slice((currentPage - 1) * perPage, currentPage * perPage);
    const from = totalRows ? (server?.from ?? (currentPage - 1) * perPage + 1) : 0;
    const to = server?.to ?? Math.min(currentPage * perPage, totalRows);

    const updateSearch = (value) => {
        setSearch(value);
        setPage(1);
        updateServer({ search: value, page: 1 });
    };

    const toggleSort = (nextSort) => {
        setSort(nextSort);
        setPage(1);
        updateServer({ sort: nextSort, page: 1 });
    };

    const updateFilter = (key, value) => {
        const nextFilters = { ...filterValues, [key]: value };
        if (!value) delete nextFilters[key];
        setFilterValues(nextFilters);
        setPage(1);
        updateServer({ filters: nextFilters, page: 1 });
    };

    const clearFilters = () => {
        setFilterValues({});
        setPage(1);
        updateServer({ filters: {}, page: 1 });
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
            <Toolbar
                search={search}
                onSearchChange={updateSearch}
                searchPlaceholder={searchPlaceholder}
                filters={filters.length ? filters : filterableColumns}
                filterValues={filterValues}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                perPage={perPage}
                onPerPageChange={updatePerPage}
                perPageOptions={[10, 15, 25, 50, 100]}
            />

            <DataTable>
                <DataTableHead>
                    <tr>
                        {columns.map((column) => renderHeaderCell({
                            column,
                            sort,
                            onSortChange: toggleSort,
                        }))}
                    </tr>
                </DataTableHead>
                <tbody aria-busy={loading} className={loading && visibleRows.length ? 'opacity-50' : ''}>
                    {loading && !visibleRows.length && <TableSkeletonRow colSpan={columns.length} />}
                    {!loading && error && (
                        <tr><td colSpan={columns.length}><div className="alert alert-error m-3" role="alert"><span>{error}</span></div></td></tr>
                    )}
                    {!error && visibleRows.map((row, index) => (
                        <tr key={typeof rowKey === 'function' ? rowKey(row) : (readValue(row, rowKey) ?? `row-${index}`)} className={`hover ${rowClassName?.(row) ?? ''}`}>
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

            <div className="flex flex-col gap-2 border-t border-base-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-base-content/60">Menampilkan {from}-{to} dari {totalRows} data</p>
                <NumberPagination currentPage={currentPage} totalPages={totalPages} onPageChange={updatePage} disabled={loading} />
            </div>
        </div>
    );
}
