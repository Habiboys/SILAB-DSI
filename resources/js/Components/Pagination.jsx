import { Link } from '@inertiajs/react';

const cleanLabel = (label) => label
  .replace(/&laquo;/g, '‹')
  .replace(/&raquo;/g, '›')
  .replace(/Previous/i, 'Sebelumnya')
  .replace(/Next/i, 'Berikutnya');

export default function Pagination({ links }) {
  if (!links || links.length <= 1) return null;

  return (
    <nav className="mt-5 flex justify-center" aria-label="Navigasi halaman">
      <div className="join flex-wrap">
        {links.map((link, key) => {
          const label = cleanLabel(link.label);
          return link.url ? (
            <Link
              key={`${label}-${key}`}
              href={link.url}
              preserveScroll
              className={`btn btn-sm join-item min-h-11 min-w-11 border ${link.active ? 'btn-primary border-primary' : 'btn-ghost border-base-300 bg-base-100'}`}
              aria-current={link.active ? 'page' : undefined}
            >
              {label}
            </Link>
          ) : (
            <span key={`${label}-${key}`} className="btn btn-sm join-item min-h-11 min-w-11 btn-disabled">
              {label}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
