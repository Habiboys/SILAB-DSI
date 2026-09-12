import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import Modal from '../Components/Modal';

export default function PublicModulViewer({ 
  modul, 
  praktikum, 
  fileUrl 
}) {
  console.log('PublicModulViewer props:', { modul, praktikum, fileUrl });
  
  
  const [showInfoPopup, setShowInfoPopup] = useState(false);



  
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;
  
  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;
  
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { CurrentPageInput, GoToFirstPageButton, GoToLastPageButton, GoToNextPageButton, GoToPreviousPageButton } = pageNavigationPluginInstance;


  const handleKeyDown = React.useCallback((event) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey; 
    
    
    if (isCtrlOrCmd && event.key === 's') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.key === 'p') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.shiftKey && event.key === 'P') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (event.key === 'F12') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.shiftKey && event.key === 'I') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.key === 'u') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.key === 'a') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.shiftKey && event.key === 'A') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.shiftKey && event.key === 'C') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.shiftKey && event.key === 'J') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (isCtrlOrCmd && event.shiftKey && event.key === 'K') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (event.metaKey && event.altKey && event.key === 'I') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (event.metaKey && event.altKey && event.key === 'J') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    if (event.metaKey && event.altKey && event.key === 'C') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    
    
    
    
    
    if (event.key === 'Escape') {
      
    }
  }, []);

  const handleContextMenu = React.useCallback((event) => {
    event.preventDefault();
  }, []);

  React.useEffect(() => {
    
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    
    
    const preventDefault = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (
        (isCtrlOrCmd && e.key === 's') ||
        (isCtrlOrCmd && e.key === 'p') ||
        (isCtrlOrCmd && e.shiftKey && e.key === 'S') ||
        (isCtrlOrCmd && e.shiftKey && e.key === 'P') ||
        (e.key === 'F12') ||
        (isCtrlOrCmd && e.shiftKey && e.key === 'I') ||
        (isCtrlOrCmd && e.key === 'u') ||
        (e.metaKey && e.altKey && e.key === 'I') ||
        (e.metaKey && e.altKey && e.key === 'J') ||
        (e.metaKey && e.altKey && e.key === 'C')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    document.addEventListener('keydown', preventDefault, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', preventDefault, true);
    };
  }, [handleKeyDown, handleContextMenu]);

  
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showInfoPopup) {
        setShowInfoPopup(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showInfoPopup]);

  return (
    <div 
      className="min-h-screen select-none bg-base-200 text-base-content"
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      
      <Head title="Modul Praktikum" />
      <div className="border-b border-base-content/10 bg-base-100 px-2 py-1 sm:px-4 sm:py-3">
        
        <div className="block sm:hidden">
          <div className="mb-2">
            <h1 className="truncate text-sm font-semibold text-base-content">
              {modul?.judul || 'Modul Praktikum'}
            </h1>
            {praktikum && (
              <span className="block truncate text-xs text-base-content/60">
                {praktikum.nama || praktikum.name || praktikum.title || 'Praktikum'}
              </span>
            )}
          </div>
          
          
          <div className="flex items-center justify-between space-x-1">
            
            <div className="flex items-center space-x-0.5 rounded-box border border-base-content/10 bg-base-200 px-1 py-1">
              <GoToFirstPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Halaman Pertama"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                )}
              </GoToFirstPageButton>
              <GoToPreviousPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Halaman Sebelumnya"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
              </GoToPreviousPageButton>
              <CurrentPageInput>
                {(props) => (
                  <div className="flex items-center space-x-1 px-1">
                    <input
                      {...props}
                      className="w-8 text-center text-xs border-0 bg-transparent focus:outline-none"
                      placeholder="1"
                    />
                    <span className="text-xs text-base-content/60">/ 0</span>
                  </div>
                )}
              </CurrentPageInput>
              <GoToNextPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Halaman Selanjutnya"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </GoToNextPageButton>
              <GoToLastPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Halaman Terakhir"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </GoToLastPageButton>
            </div>
            
            
            <div className="flex items-center space-x-0.5 rounded-box border border-base-content/10 bg-base-200 px-1 py-1">
              <ZoomOutButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Perkecil"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                )}
              </ZoomOutButton>
              <ZoomPopover>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-xs min-h-9 min-w-9"
                    title="Zoom Level"
                  >
                    100%
                  </button>
                )}
              </ZoomPopover>
              <ZoomInButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Perbesar"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                )}
              </ZoomInButton>
            </div>
          </div>
        </div>
        
        
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-base-content">
              {modul?.judul || 'Modul Praktikum'}
            </h1>
            {praktikum && (
              <span className="text-sm text-base-content/60">
                - {praktikum.nama || praktikum.name || praktikum.title || 'Praktikum'}
              </span>
            )}
            
            
            <button
              onClick={() => setShowInfoPopup(true)}
              className="btn btn-ghost btn-circle btn-sm min-h-9 min-w-9"
              title="Informasi"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          
          <div className="flex items-center space-x-4">
            
            <div className="flex items-center space-x-1 rounded-box border border-base-content/10 bg-base-200 px-2 py-1">
              <GoToFirstPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Halaman Pertama"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                )}
              </GoToFirstPageButton>
              <GoToPreviousPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Halaman Sebelumnya"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
              </GoToPreviousPageButton>
              <CurrentPageInput>
                {(props) => (
                  <div className="flex items-center space-x-1">
                    <input
                      {...props}
                      className="w-12 text-center text-sm border-0 bg-transparent focus:outline-none"
                      placeholder="1"
                    />
                    <span className="text-sm text-base-content/60">/ 0</span>
                  </div>
                )}
              </CurrentPageInput>
              <GoToNextPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Halaman Selanjutnya"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </GoToNextPageButton>
              <GoToLastPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Halaman Terakhir"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </GoToLastPageButton>
            </div>
            
            
            <div className="flex items-center space-x-1 rounded-box border border-base-content/10 bg-base-200 px-2 py-1">
              <ZoomOutButton>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Perkecil"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                )}
              </ZoomOutButton>
              <ZoomPopover>
                {(props) => (
                  <button
                    {...props}
                    className="btn btn-ghost btn-xs min-h-9 min-w-9"
                    title="Zoom Level"
                  >
                    100%
                  </button>
                )}
              </ZoomPopover>
              <ZoomInButton>
                {(props) => (
            <button
                    {...props}
                    className="btn btn-ghost btn-square btn-xs min-h-9 min-w-9"
                    title="Perbesar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
            </button>
                )}
              </ZoomInButton>
            </div>
          </div>
        </div>
      </div>

      
      <Modal
        show={showInfoPopup}
        onClose={() => setShowInfoPopup(false)}
        maxWidth="md"
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-base-content">Informasi Modul</h3>
              </div>
              
              <div className="space-y-4">
                <div className="alert alert-warning items-start">
                  <div>
                    <h4 className="font-medium">Perhatian</h4>
                    <p className="mt-1 text-sm">
                      Modul ini hanya dapat diakses oleh mahasiswa yang terdaftar dalam praktikum.
                      Jika Anda tidak seharusnya mengakses modul ini, silakan hubungi asisten laboratorium.
                    </p>
                  </div>
                </div>
                
                <div className="alert alert-info items-start">
                  <div>
                    <h4 className="font-medium">Cara Penggunaan</h4>
                    <p className="mt-1 text-sm">Anda dapat menyalin teks menggunakan:</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <kbd className="kbd kbd-sm">Ctrl+C</kbd>
                      <span className="text-xs">(Windows/Linux)</span>
                      <kbd className="kbd kbd-sm">⌘+C</kbd>
                      <span className="text-xs">(Mac)</span>
                    </div>
                    <p className="mt-2 text-sm">Klik kanan, save, dan print telah dinonaktifkan untuk keamanan.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInfoPopup(false)}
                  className="btn btn-primary min-h-11"
                >
                  Tutup
                </button>
              </div>
        </div>
      </Modal>

      
      <div className="mx-2 mb-2 flex-1 bg-base-200 sm:mx-4 sm:mb-4" style={{ height: 'calc(100vh - 120px)' }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <div className="flex h-full flex-col overflow-hidden rounded-box border border-base-content/10 bg-base-100">
            
            <div 
              className="flex-1 overflow-auto bg-base-200"
              style={{
                userSelect: 'text',
                WebkitUserSelect: 'text',
                MozUserSelect: 'text',
                msUserSelect: 'text'
              }}
            >
              <Viewer 
                fileUrl={fileUrl}
                plugins={[
                  toolbarPluginInstance,
                  zoomPluginInstance,
                  pageNavigationPluginInstance
                ]}
                renderError={(error) => (
                  <div className="flex items-center justify-center h-full bg-base-100">
                    <div className="text-center p-8">
                      <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-error" aria-hidden="true" />
                      <h3 className="mb-2 text-lg font-semibold text-error">Gagal Memuat PDF</h3>
                      <p className="mb-4 max-w-md text-sm text-base-content/70">
                        Terjadi kesalahan saat memuat dokumen PDF. Pastikan file tersedia dan dapat diakses.
                      </p>
                      <p className="mb-6 break-all font-mono text-xs text-base-content/60">
                        URL: {fileUrl}
                      </p>
                      <button
                        onClick={() => window.open(fileUrl, '_blank')}
                        className="btn btn-primary min-h-11"
                      >
                        Buka di Tab Baru
                      </button>
                    </div>
                  </div>
                )}
                renderLoader={(percentages) => (
                  <div className="flex items-center justify-center h-full bg-base-100">
                    <div className="text-center p-8">
                      <div className="relative">
                        <span className="loading loading-spinner loading-lg mx-auto mb-4 text-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{Math.round(percentages)}%</span>
                        </div>
                      </div>
                      <p className="font-medium text-base-content/70">Memuat dokumen PDF...</p>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </Worker>
      </div>
    </div>
  );
}