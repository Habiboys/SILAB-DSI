import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import Modal from '../Components/Modal';

export default function TugasViewer({ 
  tugas, 
  praktikum, 
  fileUrl 
}) {
  console.log('TugasViewer props:', { tugas, praktikum, fileUrl });
  
  
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
      className="min-h-screen bg-gray-50 select-none"
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      
      <Head title="Instruksi Tugas" />
      <div className="bg-white shadow-sm border-b border-gray-200 px-2 sm:px-4 py-1 sm:py-3">
        
        <div className="block sm:hidden">
          <div className="mb-2">
            <h1 className="text-sm font-semibold text-gray-900 truncate">
              {tugas?.judul_tugas || 'Instruksi Tugas'}
            </h1>
            {praktikum && (
              <span className="text-xs text-gray-500 truncate block">
                {praktikum.mata_kuliah || praktikum.nama || 'Praktikum'}
              </span>
            )}
          </div>
          
          
          <div className="flex items-center justify-between space-x-1">
            
            <div className="flex items-center space-x-0.5 bg-gray-50 rounded-md border border-gray-300 px-1 py-1">
              <GoToFirstPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    <span className="text-xs text-gray-500">/ 0</span>
                  </div>
                )}
              </CurrentPageInput>
              <GoToNextPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                    title="Halaman Terakhir"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </GoToLastPageButton>
            </div>
            
            
            <div className="flex items-center space-x-0.5 bg-gray-50 rounded-md border border-gray-300 px-1 py-1">
              <ZoomOutButton>
                {(props) => (
                  <button
                    {...props}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    className="px-1.5 py-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
            <h1 className="text-xl font-semibold text-gray-900">
              {tugas?.judul_tugas || 'Instruksi Tugas'}
            </h1>
            {praktikum && (
              <span className="text-sm text-gray-500">
                - {praktikum.mata_kuliah || praktikum.nama || 'Praktikum'}
              </span>
            )}
            
            
            <button
              onClick={() => setShowInfoPopup(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Informasi"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          
          <div className="flex items-center space-x-4">
            
            <div className="flex items-center space-x-2 bg-gray-50 rounded-md border border-gray-300 px-2 py-1">
              <GoToFirstPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    <span className="text-sm text-gray-500">/ 0</span>
                  </div>
                )}
              </CurrentPageInput>
              <GoToNextPageButton>
                {(props) => (
                  <button
                    {...props}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                    title="Halaman Terakhir"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </GoToLastPageButton>
            </div>
            
            
            <div className="flex items-center space-x-2 bg-gray-50 rounded-md border border-gray-300 px-2 py-1">
              <ZoomOutButton>
                {(props) => (
                  <button
                    {...props}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    className="px-2 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                <h3 className="text-lg font-semibold text-gray-900">Informasi Tugas</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <h4 className="font-medium text-yellow-800 mb-2">Perhatian</h4>
                  <p className="text-sm text-yellow-700">
                    Instruksi tugas ini hanya dapat diakses oleh mahasiswa yang terdaftar dalam praktikum.
                    Jika Anda tidak seharusnya mengakses instruksi ini, silakan hubungi asisten laboratorium.
                  </p>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">Cara Penggunaan</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Anda dapat menyalin teks menggunakan:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <kbd className="px-2 py-1 bg-blue-200 rounded text-xs font-mono">Ctrl+C</kbd>
                    <span className="text-xs text-blue-600">(Windows/Linux)</span>
                    <kbd className="px-2 py-1 bg-blue-200 rounded text-xs font-mono">⌘+C</kbd>
                    <span className="text-xs text-blue-600">(Mac)</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    Klik kanan, save, dan print telah dinonaktifkan untuk keamanan.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInfoPopup(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Tutup
                </button>
              </div>
        </div>
      </Modal>

      
      <div className="flex-1 bg-gray-100 mx-2 sm:mx-4 mb-2 sm:mb-4" style={{ height: 'calc(100vh - 120px)' }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <div className="h-full flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
            
            <div 
              className="flex-1 overflow-auto bg-gray-50"
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
                  <div className="flex items-center justify-center h-full bg-white">
                    <div className="text-center p-8">
                      <div className="text-red-500 text-6xl mb-4">⚠️</div>
                      <h3 className="text-lg font-semibold text-red-600 mb-2">Gagal Memuat PDF</h3>
                      <p className="text-sm text-gray-600 mb-4 max-w-md">
                        Terjadi kesalahan saat memuat dokumen PDF. Pastikan file tersedia dan dapat diakses.
                      </p>
                      <p className="text-xs text-gray-500 mb-6 font-mono break-all">
                        URL: {fileUrl}
                      </p>
                      <button
                        onClick={() => window.open(fileUrl, '_blank')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Buka di Tab Baru
                      </button>
                    </div>
                  </div>
                )}
                renderLoader={(percentages) => (
                  <div className="flex items-center justify-center h-full bg-white">
                    <div className="text-center p-8">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{Math.round(percentages)}%</span>
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium">Memuat dokumen PDF...</p>
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


