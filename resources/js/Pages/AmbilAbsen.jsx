import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AmbilAbsen = ({ jadwal, periode, today, alreadySubmitted, message, flash }) => {
  const [photo, setPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' for front, 'environment' for rear
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false); // Add new state to track if the camera is ready to capture
  const [isAttemptingCameraStart, setIsAttemptingCameraStart] = useState(false);
  
  const { data, setData, post, processing, errors, reset } = useForm({
    jam_masuk: new Date().toTimeString().slice(0, 5),
    jam_keluar: '',
    foto: '',
    kegiatan: '',
    periode_piket_id: periode?.id || '',
    jadwal_piket: jadwal?.id || '',
  });

  // Use a ref to track component mounting
  const isMounted = useRef(false);

  // Set mounted ref on component mount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to create a video element if needed
  const ensureVideoElement = () => {
    // Make sure we're running in the browser
    if (typeof document === 'undefined') return false;
    
    // Create a simple video element
    const tempVideo = document.createElement('video');
    const hasVideoSupport = !!tempVideo.canPlayType;
    
    if (!hasVideoSupport) {
      toast.error("Browser Anda tidak mendukung tag video HTML5");
      return false;
    }
    
    return true;
  };

  // Simplify the startCamera function
  const startCamera = () => {
    try {
      setIsAttemptingCameraStart(true);
      
      // Check browser compatibility first
      if (!ensureVideoElement()) {
        setIsAttemptingCameraStart(false);
        return;
      }
      
      // Stop any previous streams
      if (stream) {
        stopCamera();
      }
      
      // Set camera to open right away (we'll show a loading state)
      setIsCameraOpen(true);
      
      console.log("Requesting camera access...");
      navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      })
      .then((mediaStream) => {
        console.log("Camera access granted");
        
        // Store stream reference
        setStream(mediaStream);
        
        // Set permissions state
        setHasPermission(true);
        
        // Use a timeout to ensure the DOM has updated with the video element
        setTimeout(() => {
          if (videoRef.current) {
            console.log("Setting video source");
            videoRef.current.srcObject = mediaStream;
            
            videoRef.current.onloadeddata = () => {
              console.log("Video data loaded");
              setIsCameraReady(true);
              setIsAttemptingCameraStart(false);
            };
            
            // Handle errors
            videoRef.current.onerror = (err) => {
              console.error("Video error:", err);
              toast.error("Error pada elemen video");
              setIsAttemptingCameraStart(false);
            };
            
            // Start playing
            videoRef.current.play().catch(err => {
              console.error("Play error:", err);
              // Some browsers require user interaction
              toast.info("Klik pada video untuk mulai streaming");
              setIsAttemptingCameraStart(false);
            });
          } else {
            console.error("Video element not available after timeout");
            toast.error("Video element not found. Try clicking the camera button again.");
            setIsCameraOpen(false);
            setIsAttemptingCameraStart(false);
          }
        }, 100); // Small delay to ensure React has rendered the video element
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setIsAttemptingCameraStart(false);
        setHasPermission(false);
        setIsCameraOpen(false);
        
        if (err.name === 'NotAllowedError') {
          toast.error("Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
        } else if (err.name === 'NotFoundError') {
          toast.error("Tidak ada kamera ditemukan pada perangkat ini.");
        } else {
          toast.error(`Gagal mengakses kamera: ${err.message}`);
        }
      });
    } catch (err) {
      console.error("Error in startCamera:", err);
      setIsAttemptingCameraStart(false);
      setIsCameraOpen(false);
      toast.error("Error sistem: " + err.message);
    }
  };

  // Replace the toggle camera function - this might not work on all devices
  const toggleCamera = () => {
    // Just restart the camera - toggle functionality not reliable across browsers
    if (isCameraOpen) {
      stopCamera();
      // Small delay to ensure camera fully stops
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

  // Keep the stopCamera function simple
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStream(null);
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  // Simplified photo capture function
  const capturePhoto = () => {
    if (!isCameraReady) {
      toast.error("Kamera belum siap. Tunggu sebentar.");
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        toast.error("Komponen video atau canvas tidak tersedia");
        return;
      }
      
      // Get video dimensions
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      
      // Set canvas size
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data as base64 with better compression for JPEG
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Verify image data
      if (!imageData || imageData.length < 100) {
        toast.error("Gagal mengambil gambar dari kamera");
        return;
      }
      
      console.log("Photo captured successfully. Data length:", imageData.length);
      
      // Set photo state and form data
      setPhoto(imageData);
      setData('foto', imageData);
      
      // Stop camera
      stopCamera();
    } catch (err) {
      console.error("Error capturing photo:", err);
      toast.error("Gagal mengambil foto: " + err.message);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!data.foto) {
      toast.warning("Harap ambil foto terlebih dahulu!");
      return;
    }
    
    // Tambahkan logging untuk melihat data yang dikirim
    console.log("Submitting data:", {
      jam_masuk: data.jam_masuk,
      jam_keluar: data.jam_keluar,
      kegiatan: data.kegiatan,
      periode_piket_id: data.periode_piket_id,
      jadwal_piket: data.jadwal_piket,
      foto_length: data.foto ? data.foto.length : 0
    });
    
    post(route('piket.absensi.store'), {
      onSuccess: (response) => {
        console.log("Success response:", response);
        toast.success('Absensi berhasil disimpan');
        reset();
        setPhoto(null);
      },
      onError: (errors) => {
        console.error("Error response:", errors);
        if (errors.message) {
          toast.error(errors.message);
        } else if (errors.foto) {
          toast.error(errors.foto);
        } else if (errors.kegiatan) {
          toast.error(errors.kegiatan);
        } else {
          toast.error('Gagal menyimpan absensi. Silakan coba lagi.');
        }
      }
    });
  };

  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (message) {
      toast.info(message);
    }
    
    // Add check for active period
    if (!periode) {
      toast.warning("Tidak ada periode piket aktif. Silakan hubungi admin.");
    }
  }, [flash, message, periode]);

  // Check if today is the user's schedule day
  const isTodayScheduled = jadwal ? true : false;

  return (
    <DashboardLayout>
      <Head title="Ambil Absen" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex flex-col space-y-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Ambil Absen</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tanggal: {new Date(today).toLocaleDateString('id-ID', { dateStyle: 'full' })}
              </p>
            </div>
            
            {periode && (
              <div className="text-right">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Periode: {periode.nama}
                </span>
              </div>
            )}
          </div>
          
          {!periode ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Periode Piket Aktif</h3>
              <p className="text-gray-600">
                Tidak dapat mengambil absen karena tidak ada periode piket yang aktif saat ini.
                Silakan hubungi administrator sistem.
              </p>
            </div>
          ) : !isTodayScheduled ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bukan Jadwal Piket Anda</h3>
              <p className="text-gray-600">
                Anda tidak memiliki jadwal piket untuk hari ini. Silakan periksa jadwal piket Anda.
              </p>
            </div>
          ) : alreadySubmitted ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Absensi Sudah Direkam</h3>
              <p className="text-gray-600">
                Anda sudah mengisi absensi untuk hari ini.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={data.jam_masuk}
                    onChange={e => setData('jam_masuk', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.jam_masuk && (
                    <div className="text-red-500 text-sm mt-1">{errors.jam_masuk}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={data.jam_keluar}
                    onChange={e => setData('jam_keluar', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.jam_keluar && (
                    <div className="text-red-500 text-sm mt-1">{errors.jam_keluar}</div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kegiatan
                  </label>
                  <textarea
                    value={data.kegiatan}
                    onChange={e => setData('kegiatan', e.target.value)}
                    placeholder="Isi Kegiatan yang dilakukan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  ></textarea>
                  {errors.kegiatan && (
                    <div className="text-red-500 text-sm mt-1">{errors.kegiatan}</div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Kamera
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={isAttemptingCameraStart}
                      className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition ${
                        isAttemptingCameraStart ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isAttemptingCameraStart ? 'Memulai...' : 'Buka Kamera'}
                    </button>
                  </div>
                  {errors.foto && (
                    <div className="text-red-500 text-sm mt-1">{errors.foto}</div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  {isCameraOpen ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-full max-w-lg">
                        <video
                          ref={videoRef}
                          id="camera-video"
                          autoPlay
                          playsInline
                          muted
                          className="w-full rounded-lg border bg-black"
                          style={{ 
                            maxHeight: '50vh',
                            minHeight: '300px',
                            objectFit: 'contain'
                          }}
                          onClick={() => {
                            // Force play on click to handle browsers that require user interaction
                            if (videoRef.current) {
                              videoRef.current.play().catch(e => console.error("Play error:", e));
                            }
                          }}
                        ></video>
                        {isCameraReady && (
                          <div className="absolute top-4 right-4">
                            <button
                              type="button"
                              onClick={toggleCamera}
                              className="p-2 bg-blue-600 bg-opacity-50 text-white rounded-full hover:bg-opacity-70 focus:outline-none"
                              title="Toggle Camera"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex space-x-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          disabled={!isCameraReady}
                          className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
                            !isCameraReady ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {!isCameraReady ? 'Kamera sedang dimuat...' : 'Ambil Foto'}
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : photo ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={photo}
                        alt="Captured"
                        className="max-w-lg rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setData('foto', '');
                          startCamera(cameraFacing);
                        }}
                        className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                      >
                        Ambil Ulang
                      </button>
                    </div>
                  ) : hasPermission === false ? (
                    <div className="p-6 text-center bg-red-50 rounded-lg">
                      <div className="text-red-500 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">Akses Kamera Ditolak</h4>
                      <p className="text-gray-600 mb-4">
                        Izinkan akses kamera di pengaturan browser Anda untuk mengambil foto absensi.
                      </p>
                      <button
                        type="button"
                        onClick={() => startCamera(cameraFacing)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <div className="text-gray-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Silakan pilih kamera untuk mengambil foto absensi
                      </p>
                      {isAttemptingCameraStart && (
                        <div className="text-blue-600 animate-pulse">
                          Memulai kamera, harap tunggu...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Hidden canvas for capturing photos */}
                  <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={processing || !photo}
                  className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition ${
                    (processing || !photo) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {processing ? 'Menyimpan...' : 'Ambil Absen'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AmbilAbsen;