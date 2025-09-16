import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { rotatePlugin } from '@react-pdf-viewer/rotate';
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode';
import { selectionModePlugin } from '@react-pdf-viewer/selection-mode';

import '@react-pdf-viewer/core/lib/styles/index.css';

import { X, Download, Maximize2, Minimize2 } from 'lucide-react';

export default function ModernPdfViewer({ 
  show, 
  onClose, 
  fileUrl, 
  filename,
  allowDownload = false 
}) {
  const [fullscreen, setFullscreen] = React.useState(false);

  // Initialize plugins
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;
  
  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;
  
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { CurrentPageInput, GoToFirstPageButton, GoToLastPageButton, GoToNextPageButton, GoToPreviousPageButton } = pageNavigationPluginInstance;
  
  const rotatePluginInstance = rotatePlugin();
  const { RotateBackwardButton, RotateForwardButton } = rotatePluginInstance;
  
  const scrollModePluginInstance = scrollModePlugin();
  const { ScrollModeButton } = scrollModePluginInstance;
  
  const selectionModePluginInstance = selectionModePlugin();
  const { SwitchSelectionModeButton } = selectionModePluginInstance;

  const toggleFullscreen = () => {
    setFullscreen(prev => !prev);
  };

  const handleKeyDown = React.useCallback((event) => {
    if (event.key === 'Escape' && fullscreen) {
      setFullscreen(false);
    } else if (event.key === 'Escape') {
      onClose();
    }
  }, [fullscreen, onClose]);

  React.useEffect(() => {
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [show, handleKeyDown]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl ${fullscreen ? 'fixed inset-0 rounded-none' : 'w-full max-w-6xl h-5/6'}`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {filename || 'PDF Viewer'}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title={fullscreen ? 'Keluar dari layar penuh' : 'Layar penuh'}
              >
                {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              {allowDownload && (
                <button
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Download PDF"
                >
                  <Download size={20} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1" style={{ height: fullscreen ? 'calc(100vh - 80px)' : 'calc(100% - 80px)' }}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <Viewer 
              fileUrl={fileUrl}
              renderError={(error) => (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className="text-red-600 mb-4">Gagal memuat PDF</p>
                    <p className="text-sm text-gray-600 mb-4">URL: {fileUrl}</p>
                    <button
                      onClick={() => window.open(fileUrl, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Buka di Tab Baru
                    </button>
                  </div>
                </div>
              )}
              renderLoader={(percentages) => (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat PDF... {Math.round(percentages)}%</p>
                  </div>
                </div>
              )}
            />
          </Worker>
        </div>
      </div>
    </div>
  );
}