<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>View Modul - {{ $modul->judul ?? 'Untitled' }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
        }
        
        .header {
            background-color: #fff;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            margin: 0;
            color: #374151;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .header p {
            margin: 0.5rem 0 0 0;
            color: #6b7280;
            font-size: 0.875rem;
        }
        
        .pdf-container {
            width: 100%;
            height: calc(100vh - 80px);
            background-color: #fff;
        }
        
        .pdf-embed {
            width: 100%;
            height: 100%;
            border: none;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
        
        /* Disable text selection */
        .pdf-container {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        /* Hide scrollbars but keep functionality */
        .pdf-embed::-webkit-scrollbar {
            display: none;
        }
        
        .pdf-embed {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        

        
        /* Interactive overlay to block right-click and other actions */
        .interactive-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            z-index: 15;
            pointer-events: none; /* Allow scroll by default */
            cursor: default;
        }
        
        /* Activate overlay only when right-click is detected */
        .interactive-overlay.active {
            pointer-events: auto;
            background: rgba(0, 0, 0, 0.001); /* Almost invisible */
        }
        
        /* Make PDF container relative for absolute positioning */
        .pdf-container {
            position: relative;
            overflow: auto;
        }
        
        /* Custom PDF Viewer Styles */
        .pdf-viewer {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: #f5f5f5;
        }
        
        .pdf-toolbar {
            background: #fff;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .toolbar-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        
        .toolbar-btn:hover {
            background: #2563eb;
        }
        
        .toolbar-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        
        .page-info {
            font-size: 14px;
            color: #374151;
            font-weight: 500;
        }
        
        .zoom-level {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .view-mode-toggle {
            display: flex;
            gap: 5px;
            margin-left: 20px;
        }
        
        .mode-btn {
            background: #e5e7eb;
            color: #6b7280;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        }
        
        .mode-btn:hover {
            background: #d1d5db;
        }
        
        .mode-btn.active {
            background: #3b82f6;
            color: white;
        }
        
        .pdf-pages-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 15px;
            min-height: 100%;
        }
        
        .pdf-page {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 4px;
            margin: 0 auto 15px auto;
            width: 100%;
            max-width: 800px;
            display: flex;
            justify-content: center;
        }
        
        .pdf-page canvas {
            display: block;
            width: 100%;
            height: auto;
            max-width: 100%;
        }
        
        /* Responsive design for smaller screens */
        @media (max-width: 900px) {
            .pdf-page {
                max-width: 95%;
            }
        }
        
        @media (max-width: 600px) {
            .pdf-page {
                max-width: 98%;
            }
            
            .pdf-pages-container {
                padding: 10px;
                gap: 10px;
            }
        }
        
        .pdf-canvas-container {
            flex: 1;
            overflow: auto;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 20px;
            background: #f5f5f5;
        }
        
        #pdf-canvas {
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 4px;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        /* Allow text selection on PDF content but disable copy */
        .pdf-viewer {
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
        }
        
        /* Disable context menu on all PDF elements */
        .pdf-viewer * {
            -webkit-context-menu: none !important;
            -moz-context-menu: none !important;
            context-menu: none !important;
        }
        
        /* Allow text selection on canvas but disable copy */
        canvas {
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
            pointer-events: auto;
        }
        
        /* Allow pointer events for buttons */
        .toolbar-btn, .mode-btn {
            pointer-events: auto !important;
        }
        
        /* Disable copy but allow selection */
        .pdf-viewer {
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
        }
        
        .no-pdf {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #6b7280;
            font-size: 1.125rem;
        }
        
        .download-warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 0.75rem;
            margin: 1rem;
            border-radius: 0.5rem;
            text-align: center;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $modul->judul ?? 'Modul Praktikum' }}</h1>
        <p>Pertemuan ke-{{ $modul->pertemuan ?? 'N/A' }} - {{ $praktikum->mata_kuliah ?? 'Mata Kuliah' }}</p>
    </div>
    
    <div class="download-warning">
        <strong>⚠️ Perhatian:</strong> File ini hanya untuk dilihat, tidak dapat didownload.
    </div>
    
    <div class="pdf-container">
        @if($isPdf)

            
            <!-- Custom PDF Viewer with PDF.js -->
            <div id="pdf-viewer" class="pdf-viewer">
                <div id="pdf-toolbar" class="pdf-toolbar">
                    <button id="prev-page" class="toolbar-btn" title="Halaman Sebelumnya">‹</button>
                    <span id="page-info" class="page-info">Halaman <span id="page-num"></span> dari <span id="page-count"></span></span>
                    <button id="next-page" class="toolbar-btn" title="Halaman Selanjutnya">›</button>
                    <button id="zoom-in" class="toolbar-btn" title="Zoom In">+</button>
                    <button id="zoom-out" class="toolbar-btn" title="Zoom Out">-</button>
                    <span id="zoom-level" class="zoom-level">100%</span>
                    <div class="view-mode-toggle">
                        <button id="single-page-mode" class="mode-btn active" title="Mode Halaman Tunggal">📄</button>
                        <button id="scroll-mode" class="mode-btn" title="Mode Scroll Berkelanjutan">📜</button>
                    </div>
                </div>
                <div id="pdf-canvas-container" class="pdf-canvas-container">
                    <canvas id="pdf-canvas"></canvas>
                    <div id="pdf-pages-container" class="pdf-pages-container" style="display: none;"></div>
                </div>
            </div>
            
            <!-- Interactive overlay to block right-click and other actions -->
            <div class="interactive-overlay" id="interactiveOverlay"></div>
        @else
            <div class="no-pdf">
                <p>File ini bukan PDF dan tidak dapat ditampilkan dalam viewer ini.</p>
            </div>
        @endif
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // PDF.js configuration
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // PDF viewer variables
        let pdfDoc = null;
        let pageNum = 1;
        let pageRendering = false;
        let pageNumPending = null;
        let scale = 1.0;
        let isScrollMode = false;
        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');
        const pagesContainer = document.getElementById('pdf-pages-container');
        
        // Load PDF
        async function loadPDF() {
            try {
                const loadingTask = pdfjsLib.getDocument('{{ asset('storage/' . $filePath) }}');
                pdfDoc = await loadingTask.promise;
                
                // Update page count
                document.getElementById('page-count').textContent = pdfDoc.numPages;
                document.getElementById('page-num').textContent = pageNum;
                
                // Render first page
                renderPage(pageNum);
                
                // Setup event listeners
                setupEventListeners();
                
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Gagal memuat PDF');
            }
        }
        
        // Render specific page
        async function renderPage(num) {
            pageRendering = true;
            
            try {
                const page = await pdfDoc.getPage(num);
                const viewport = page.getViewport({ scale: scale });
                
                // Set canvas dimensions
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render PDF page to canvas
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                pageRendering = false;
                
                // Update page info
                document.getElementById('page-num').textContent = num;
                
                // If there was a pending page, render it
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
                
            } catch (error) {
                console.error('Error rendering page:', error);
                pageRendering = false;
            }
        }
        
        // Queue rendering of the next page
        function queueRenderPage(num) {
            if (pageRendering) {
                pageNumPending = num;
            } else {
                renderPage(num);
            }
        }
        
        // Go to previous page
        function onPrevPage() {
            if (pageNum <= 1) return;
            pageNum--;
            queueRenderPage(pageNum);
        }
        
        // Go to next page
        function onNextPage() {
            if (pageNum >= pdfDoc.numPages) return;
            pageNum++;
            queueRenderPage(pageNum);
        }
        
        // Zoom in
        function zoomIn() {
            scale *= 1.2;
            if (isScrollMode) {
                renderAllPages();
            } else {
                queueRenderPage(pageNum);
            }
            updateZoomLevel();
        }
        
        // Zoom out
        function zoomOut() {
            scale /= 1.2;
            if (isScrollMode) {
                renderAllPages();
            } else {
                queueRenderPage(pageNum);
            }
            updateZoomLevel();
        }
        
        // Update zoom level display
        function updateZoomLevel() {
            const zoomPercent = Math.round(scale * 100);
            document.getElementById('zoom-level').textContent = zoomPercent + '%';
        }
        
        // Setup event listeners
        function setupEventListeners() {
            // Navigation buttons
            document.getElementById('prev-page').addEventListener('click', onPrevPage);
            document.getElementById('next-page').addEventListener('click', onNextPage);
            
            // Zoom buttons
            document.getElementById('zoom-in').addEventListener('click', zoomIn);
            document.getElementById('zoom-out').addEventListener('click', zoomOut);
            
            // Keyboard navigation
            document.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowLeft') onPrevPage();
                if (e.key === 'ArrowRight') onNextPage();
                if (e.key === '+' || e.key === '=') zoomIn();
                if (e.key === '-') zoomOut();
            });
        }
        
        // Render all pages for scroll mode
        async function renderAllPages() {
            pagesContainer.innerHTML = '';
            
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                try {
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: scale });
                    
                    // Create canvas for this page
                    const pageCanvas = document.createElement('canvas');
                    const pageCtx = pageCanvas.getContext('2d');
                    
                    // Calculate optimal size for portrait layout
                    const containerWidth = 800; // Max width from CSS
                    const padding = 30; // Account for padding
                    const availableWidth = containerWidth - padding;
                    
                    // Calculate scale to fit width while maintaining aspect ratio
                    const scaleFactor = availableWidth / viewport.width;
                    const adjustedViewport = page.getViewport({ scale: scale * scaleFactor });
                    
                    pageCanvas.width = adjustedViewport.width;
                    pageCanvas.height = adjustedViewport.height;
                    
                    // Create page container
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'pdf-page';
                    pageDiv.appendChild(pageCanvas);
                    pagesContainer.appendChild(pageDiv);
                    
                    // Render page to canvas with adjusted viewport
                    const renderContext = {
                        canvasContext: pageCtx,
                        viewport: adjustedViewport
                    };
                    
                    await page.render(renderContext).promise;
                    
                } catch (error) {
                    console.error('Error rendering page', pageNum, ':', error);
                }
            }
        }
        
        // Toggle between single page and scroll mode
        function toggleViewMode(mode) {
            isScrollMode = mode === 'scroll';
            
            // Update button states
            document.getElementById('single-page-mode').classList.toggle('active', !isScrollMode);
            document.getElementById('scroll-mode').classList.toggle('active', isScrollMode);
            
            // Show/hide appropriate containers
            if (isScrollMode) {
                canvas.style.display = 'none';
                pagesContainer.style.display = 'block';
                renderAllPages();
            } else {
                canvas.style.display = 'block';
                pagesContainer.style.display = 'none';
                renderPage(pageNum);
            }
        }
        
        // Initialize PDF viewer when page loads
        document.addEventListener('DOMContentLoaded', function() {
            if (document.getElementById('pdf-viewer')) {
                loadPDF();
                
                // Setup view mode toggles
                document.getElementById('single-page-mode').addEventListener('click', () => toggleViewMode('single'));
                document.getElementById('scroll-mode').addEventListener('click', () => toggleViewMode('scroll'));
                
                // Block right-click and copy on all PDF elements
                const pdfViewer = document.getElementById('pdf-viewer');
                
                // Block right-click
                pdfViewer.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Klik kanan tidak diizinkan');
                    return false;
                });
                
                // Block copy
                pdfViewer.addEventListener('copy', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Copy tidak diizinkan');
                    return false;
                });
                
                // Block cut
                pdfViewer.addEventListener('cut', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Cut tidak diizinkan');
                    return false;
                });
                
                // Block paste
                pdfViewer.addEventListener('paste', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Paste tidak diizinkan');
                    return false;
                });
                
                // Allow selection but block copy
                pdfViewer.addEventListener('copy', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Copy tidak diizinkan');
                    return false;
                });
                
                // Block drag and drop
                pdfViewer.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                
                pdfViewer.addEventListener('drop', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Drag & drop tidak diizinkan');
                });
                
                // Block keyboard shortcuts
                pdfViewer.addEventListener('keydown', function(e) {
                    if ((e.ctrlKey && (e.key === 's' || e.key === 'p' || (e.shiftKey && e.key === 'S') || e.key === 'c' || e.key === 'x' || e.key === 'v')) || 
                        e.key === 'F12' || e.key === 'PrintScreen') {
                        e.preventDefault();
                        e.stopPropagation();
                        alert('Shortcut tidak diizinkan');
                        return false;
                    }
                });
            }
        });
        
        // Disable right-click context menu on main page
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        // Disable keyboard shortcuts for save/print on main page
        document.addEventListener('keydown', function(e) {
            // Ctrl+S, Ctrl+P, Ctrl+Shift+S, F12, Print Screen
            if ((e.ctrlKey && (e.key === 's' || e.key === 'p' || (e.shiftKey && e.key === 'S'))) || 
                e.key === 'F12' || e.key === 'PrintScreen') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
        
        // Disable drag and drop on main page
        document.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Disable print function on main page
        window.addEventListener('beforeprint', function(e) {
            e.preventDefault();
            alert('Print tidak diizinkan');
            return false;
        });
        
        // Disable save function on main page
        window.addEventListener('beforeunload', function(e) {
            // This is just a warning, can't completely prevent
            e.preventDefault();
            e.returnValue = 'File ini tidak dapat disimpan';
        });
        
        // Additional protection: disable common browser functions
        document.addEventListener('DOMContentLoaded', function() {
            // Disable print media query
            const style = document.createElement('style');
            style.textContent = `
                @media print {
                    body { display: none !important; }
                    * { display: none !important; }
                }
                
                /* Disable text selection globally */
                * {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }
                
                /* Allow selection only for specific elements if needed */
                .allow-select {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                }
            `;
            document.head.appendChild(style);
            
            // Disable developer tools (F12)
            document.addEventListener('keydown', function(e) {
                if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Developer tools tidak diizinkan');
                    return false;
                }
            });
            
            // Disable view source
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'u') {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('View source tidak diizinkan');
                    return false;
                }
            });
            
            // Smart overlay system to block right-click while allowing scroll
            const overlay = document.getElementById('interactiveOverlay');
            
            // Detect right-click attempts anywhere on the page
            document.addEventListener('mousedown', function(e) {
                if (e.button === 2) { // Right mouse button
                    // Activate overlay to block iframe right-click
                    if (overlay) {
                        overlay.classList.add('active');
                        // Deactivate after a short delay
                        setTimeout(() => {
                            overlay.classList.remove('active');
                        }, 200);
                    }
                }
            });
            
            // Block right-click on overlay when active
            if (overlay) {
                overlay.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Klik kanan tidak diizinkan');
                    this.classList.remove('active');
                    return false;
                });
                
                // Block right mouse button on overlay when active
                overlay.addEventListener('mousedown', function(e) {
                    if (e.button === 2) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.classList.remove('active');
                        return false;
                    }
                });
            }
            
            // Block keyboard shortcuts globally
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey && (e.key === 's' || e.key === 'p' || (e.shiftKey && e.key === 'S'))) || 
                    e.key === 'F12' || e.key === 'PrintScreen') {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Shortcut tidak diizinkan');
                    return false;
                }
            });
            
            // Also block right-click on PDF container as backup
            const pdfContainer = document.querySelector('.pdf-container');
            if (pdfContainer) {
                pdfContainer.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Klik kanan tidak diizinkan');
                    return false;
                });
            }
        });
    </script>
</body>
</html>
