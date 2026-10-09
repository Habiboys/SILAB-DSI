import { Home, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { restoreParent } from '../Utils/navigation';
import { navigationHistory } from '../Utils/navigationRuntime';

const Breadcrumb = ({ items = [] }) => {
  const page = usePage();
  const contextualHref = (href) => restoreParent(href, page, navigationHistory(), window.location.origin);
  return (
  <nav className="breadcrumbs overflow-x-auto text-sm text-base-content/70" aria-label="Breadcrumb">
    <ul className="min-w-max">
      <li>
        <Link href={contextualHref(route('dashboard'))} className="min-h-11 gap-2 font-medium hover:text-primary">
          <Home className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </Link>
      </li>
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1 || !item.href;
        return (
          <li key={`${item.href || 'current'}-${item.label}`}>
            <ChevronRight className="hidden h-3.5 w-3.5" aria-hidden="true" />
            {isCurrent ? (
              <span className={index === items.length - 1 ? 'font-semibold text-base-content' : ''} aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>
            ) : (
              <Link href={contextualHref(item.href)} className="min-h-11 font-medium hover:text-primary">{item.label}</Link>
            )}
          </li>
        );
      })}
    </ul>
  </nav>
);
};

export default Breadcrumb;
