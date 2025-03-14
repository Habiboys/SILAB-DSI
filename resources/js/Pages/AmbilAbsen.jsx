import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

const AmbilAbsen = ({ jadwal, periode, today }) => {
  const [photo, setPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  
  const { data, setData, post, processing, errors } = useForm({
    jam_masuk: new Date().toTimeString().slice(0, 5),
    jam_keluar: '',
    foto: '',
    kegiatan: '',
    periode_piket_id: periode?.id || '',
    jadwal_piket: jadwal?.id || '',
  });

  // Function to start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing the camera: ", err);
      alert("Could not access the camera. Please ensure camera access is allowed.");
    }
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
    post(route('absensi.store'), {
      onSuccess: () => {
        alert('Absensi berhasil disimpan');
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

  return (
    <DashboardLayout>
      <Head title="Ambil Absen" />
      
      <div className="flex flex-col space-y-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Ambil Absen</h2>
          </div>
          
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
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                  >
                    Kamera depan
                  </button>
                </div>
                {errors.foto && (
                  <div className="text-red-500 text-sm mt-1">{errors.foto}</div>
                )}
              </div>
              
              <div className="md:col-span-2">
                {isCameraOpen ? (
                  <div className="flex flex-col items-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-lg rounded-lg border"
                    ></video>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      Ambil Foto
                    </button>
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
                        startCamera();
                      }}
                      className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                    >
                      Ambil Ulang
                    </button>
                  </div>
                ) : null}
                
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
                Ambil Absen
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AmbilAbsen;