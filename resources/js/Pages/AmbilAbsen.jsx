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
  
  const { data, setData, post, processing, errors, reset } = useForm({
    jam_masuk: new Date().toTimeString().slice(0, 5),
    jam_keluar: '',
    foto: '',
    kegiatan: '',
    periode_piket_id: periode?.id || '',
    jadwal_piket: jadwal?.id || '',
  });

  // Function to start camera with selected facing mode
  const startCamera = async (facingMode = 'user') => {
    try {
      // Stop any existing stream first
      if (stream) {
        stopCamera();
      }
      
      setCameraFacing(facingMode);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode },
        audio: false
      });
      
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing the camera: ", err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        toast.error("Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
      } else if (err.name === 'NotFoundError') {
        toast.error("Tidak ada kamera ditemukan pada perangkat ini.");
      } else {
        toast.error("Gagal mengakses kamera: " + err.message);
      }
    }
  };

  // Function to toggle between front and rear camera
  const toggleCamera = () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startCamera(newFacing);
  };

  // Function to stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  // Take a photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match the video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to base64 image
      const imgData = canvas.toDataURL('image/png');
      setPhoto(imgData);
      setData('foto', imgData);
      
      // Stop the camera
      stopCamera();
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!data.foto) {
      toast.warning("Harap ambil foto terlebih dahulu!");
      return;
    }
    
    post(route('piket.absensi.store'), {
      onSuccess: () => {
        toast.success('Absensi berhasil disimpan');
        reset();
        setPhoto(null);
      },
      onError: (errors) => {
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
  }, [flash, message]);

  // Check if today is the user's schedule day
  const isTodayScheduled = jadwal ? true : false;

  return (
    <DashboardLayout>
      <Head title="Ambil Absen" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex flex-col space-y-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
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
                      onClick={() => startCamera('user')}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                    >
                      Kamera depan
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                    >
                      Kamera belakang
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
                          autoPlay
                          playsInline
                          className="w-full rounded-lg border"
                        ></video>
                        <div className="absolute top-4 right-4">
                          <button
                            type="button"
                            onClick={toggleCamera}
                            className="p-2 bg-gray-800 bg-opacity-50 text-white rounded-full hover:bg-opacity-70 focus:outline-none"
                            title="Toggle Camera"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                          Ambil Foto
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
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