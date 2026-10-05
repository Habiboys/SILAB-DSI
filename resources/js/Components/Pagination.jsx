import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const pageClass = (active = false) => `btn btn-sm min-h-11 min-w-11 rounded-md border ${active ? 'btn-primary border-primary' : 'btn-ghost border-base-300 bg-base-100'}`;

const cleanLabel = (label) => String(label)
  .replace(/&laquo;|«/g, '‹')
  .replace(/&raquo;|»/g, '›')
  .replace(/Previous/i, 'Sebelumnya')
  .replace(/Next/i, 'Berikutnya');

export function pageNumbers(currentPage, totalPages) {
  const pages = new Set([1, totalPages]);
  for (let page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page++) pages.add(page);
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    if (!index) return [page];
    const gap = page - sorted[index - 1];
    if (gap === 2) return [page - 1, page];
    return gap > 2 ? ['…', page] : [page];
  });
}

export function NumberPagination({ currentPage, totalPages, onPageChange, disabled = false, className = '' }) {
  if (totalPages <= 1) return null;
  return (
    <nav className={`${className} flex flex-wrap items-center justify-center gap-1`} aria-label="Navigasi halaman">
      <button type="button" className={pageClass()} disabled={disabled || currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Halaman sebelumnya"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
      {pageNumbers(currentPage, totalPages).map((page, index) => page === '…' ? (
        <span key={`gap-${index}`} className="flex min-h-11 min-w-8 items-center justify-center text-base-content/60" aria-hidden="true">…</span>
      ) : (
        <button key={page} type="button" className={pageClass(page === currentPage)} disabled={disabled} onClick={() => onPageChange(page)} aria-label={`Halaman ${page}`} aria-current={page === currentPage ? 'page' : undefined}>{page}</button>
      ))}
      <button type="button" className={pageClass()} disabled={disabled || currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label="Halaman berikutnya"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
    </nav>
  );
}

export default function Pagination({ links, className = 'mt-5' }) {
  if (!links || links.length <= 3) return null;
  return (
    <nav className={`${className} flex flex-wrap items-center justify-center gap-1`} aria-label="Navigasi halaman">
      {links.map((link, index) => {
        const label = cleanLabel(link.label);
        const isArrow = index === 0 || index === links.length - 1;
        const content = isArrow ? index === 0 ? <ChevronLeft className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" /> : label;
        const ariaLabel = isArrow ? index === 0 ? 'Halaman sebelumnya' : 'Halaman berikutnya' : label === '...' ? 'Halaman lain' : `Halaman ${label}`;
        return link.url ? (
          <Link key={`${label}-${index}`} href={link.url} preserveScroll className={pageClass(link.active)} aria-label={ariaLabel} aria-current={link.active ? 'page' : undefined}>{content}</Link>
        ) : (
          <span key={`${label}-${index}`} className={`${pageClass()} opacity-50`} aria-label={ariaLabel} aria-disabled="true">{content}</span>
        );
      })}
    </nav>
  );
}
