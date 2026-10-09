import { useFCM } from '@/Hooks/useFCM.jsx';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '../Components/Breadcrumb';
import PageHeader from '../Components/PageHeader';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import BackButton from '../Components/BackButton';
import { buildBreadcrumbs } from '../Utils/navigation';
import { navigationHistory, navigationRoutes } from '../Utils/navigationRuntime';

const DashboardLayout = ({ children, title = 'SILAB', pageTitle, description, actions, breadcrumbs, backFallback }) => {
  useFCM();
  const page = usePage();
  const { url, props: pageProps } = page;
  const [isCollapsed, setIsCollapsed] = useState(() => (
    typeof window !== 'undefined' && localStorage.getItem('sidebarCollapsed') === 'true'
  ));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => localStorage.setItem('sidebarCollapsed', String(isCollapsed)), [isCollapsed]);
  useEffect(() => setIsMobileSidebarOpen(false), [url]);

  const breadcrumbItems = useMemo(() => buildBreadcrumbs(
    page, navigationRoutes(), (name, parameters) => route(name, parameters),
    navigationHistory(), window.location.origin,
  ), [url, pageProps]);

  return (
    <div className="flex min-h-screen bg-base-200 text-base-content antialiased">
      <Head title={title} />

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-neutral/55 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Tutup menu navigasi"
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main className="w-full flex-1 px-4 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4 lg:px-8">
          {(breadcrumbs ?? breadcrumbItems).length > 0 && (
            <div className="mb-2">
              <Breadcrumb items={breadcrumbs ?? breadcrumbItems} />
            </div>
          )}

          {(backFallback !== undefined || breadcrumbItems.some((item) => item.href)) && (
            <div className="mb-4 flex justify-start" data-page-back>
              <BackButton fallback={backFallback} />
            </div>
          )}

          {pageTitle && <PageHeader title={pageTitle} description={description} actions={actions} />}

          {children || (
            <div className="silab-panel">
              <div className="silab-panel-body py-12 text-center">
                <h2 className="text-xl font-semibold">Konten belum tersedia</h2>
                <p className="silab-muted">Halaman ini belum memiliki konten untuk ditampilkan.</p>
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-base-300 bg-base-100 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col gap-1 text-xs text-base-content/60 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <p>© {new Date().getFullYear()} SILAB-DSI, Universitas Andalas</p>
            <div className="flex items-center gap-3">
              <a href="mailto:nouvalhabibie18@gmail.com" className="min-h-11 content-center hover:text-primary">Kontak</a>
              <span>v1.1.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
