import { useFCM } from '@/Hooks/useFCM.jsx';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '../Components/Breadcrumb';
import PageHeader from '../Components/PageHeader';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';

const LABELS = {
  dashboard: 'Dashboard', inventaris: 'Inventaris', permohonan: 'Permohonan', peminjaman: 'Peminjaman',
  praktikum: 'Praktikum', kegiatan: 'Kegiatan', proker: 'Program Kerja', kuesioner: 'Kuesioner',
  sertifikat: 'Sertifikat', piket: 'Piket', admin: 'Administrasi', profile: 'Profil',
  'data-master': 'Data Master', 'kepengurusan-lab': 'Kepengurusan Laboratorium',
  'riwayat-keuangan': 'Riwayat Keuangan', 'catatan-kas': 'Catatan Kas', 'rekap-keuangan': 'Rekap Keuangan',
  praktikan: 'Praktikan', tugas: 'Tugas', modul: 'Modul', pertemuan: 'Pertemuan', riwayat: 'Riwayat',
};

const ID_PATTERN = /^(?:[0-9a-f]{8}-[0-9a-f-]{27}|\d+)$/i;
const NAME_KEYS = ['mata_kuliah', 'nama_praktikum', 'judul_tugas', 'judul', 'nama_kegiatan', 'nama_proker', 'nama_kelas', 'nama', 'name', 'kode_barang'];

const findEntityLabel = (value, targetId, depth = 0, visited = new Set()) => {
  if (!value || depth > 4 || typeof value !== 'object' || visited.has(value)) return null;
  visited.add(value);
  if (!Array.isArray(value) && String(value.id ?? '') === String(targetId)) {
    const key = NAME_KEYS.find((nameKey) => value[nameKey]);
    if (key) return String(value[key]);
  }
  for (const child of Object.values(value)) {
    const result = findEntityLabel(child, targetId, depth + 1, visited);
    if (result) return result;
  }
  return null;
};

const titleCase = (segment, pageProps) => {
  if (LABELS[segment]) return LABELS[segment];
  if (ID_PATTERN.test(segment)) return findEntityLabel(pageProps, segment) || 'Detail';
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const DashboardLayout = ({ children, title = 'SILAB', pageTitle, description, actions, breadcrumbs }) => {
  useFCM();
  const { url, props: pageProps } = usePage();
  const [isCollapsed, setIsCollapsed] = useState(() => (
    typeof window !== 'undefined' && localStorage.getItem('sidebarCollapsed') === 'true'
  ));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => localStorage.setItem('sidebarCollapsed', String(isCollapsed)), [isCollapsed]);
  useEffect(() => setIsMobileSidebarOpen(false), [url]);

  const breadcrumbItems = useMemo(() => {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    if (segments[0] === 'dashboard') return [];
    let path = '';
    return segments.map((segment, index) => {
      path += `/${segment}`;
      return { label: titleCase(segment, pageProps), href: index === segments.length - 1 ? null : path };
    });
  }, [url, pageProps]);

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

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4 lg:px-8">
          {(breadcrumbs ?? breadcrumbItems).length > 0 && (
            <div className="mb-2">
              <Breadcrumb items={breadcrumbs ?? breadcrumbItems} />
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

        <footer className="border-t border-base-content/10 bg-base-100 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 text-xs text-base-content/60 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
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
