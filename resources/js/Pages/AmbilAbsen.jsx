import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function CameraCapture({ onCapture, label = "Foto diperlukan" }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [photo, setPhoto] = useState(null);

    const startCamera = () => {
        setIsStarting(true);
        setIsCameraOpen(true);
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then((mediaStream) => {
                setStream(mediaStream);
                setHasPermission(true);
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                        videoRef.current.onloadeddata = () => {
                            setIsCameraReady(true);
                            setIsStarting(false);
                        };
                        videoRef.current.play().catch(() => {});
                    } else {
                        setIsCameraOpen(false);
                        setIsStarting(false);
                    }
                }, 100);
            })
            .catch((err) => {
                setIsStarting(false);
                setHasPermission(false);
                setIsCameraOpen(false);
                if (err.name === "NotAllowedError") {
                    toast.error(
                        "Akses kamera ditolak. Izinkan kamera di pengaturan browser.",
                    );
                } else {
                    toast.error("Gagal mengakses kamera: " + err.message);
                }
            });
    };

    const stopCamera = () => {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setStream(null);
        setIsCameraOpen(false);
        setIsCameraReady(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -w, 0, w, h);
        ctx.restore();
        const imageData = canvas.toDataURL("image/jpeg", 0.85);
        setPhoto(imageData);
        onCapture(imageData);
        stopCamera();
    };

    const retake = () => {
        setPhoto(null);
        onCapture(null);
        startCamera();
    };

    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [stream]);

    return (
        <div>
            {photo ? (
                <div className="flex flex-col items-center gap-3">
                    <img
                        src={photo}
                        alt="Foto checkout"
                        className="max-w-sm w-full rounded-lg border shadow"
                    />
                    <button
                        type="button"
                        onClick={retake}
                        className="px-4 py-2 bg-warning/100 text-white rounded-md hover:bg-warning transition text-sm"
                    >
                        Ambil Ulang
                    </button>
                </div>
            ) : isCameraOpen ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-full max-w-sm">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full rounded-lg border bg-black"
                            style={{
                                maxHeight: "45vh",
                                minHeight: "260px",
                                objectFit: "contain",
                                transform: "scaleX(-1)",
                            }}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={!isCameraReady}
                            className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary transition text-sm ${
                                !isCameraReady
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {isCameraReady ? "Ambil Foto" : "Memuat kamera"}
                        </button>
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-2 bg-base-300 text-base-content rounded-md hover:bg-base-300 transition text-sm"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            ) : hasPermission === false ? (
                <div className="p-4 bg-error/10 rounded-lg text-center">
                    <p className="text-error text-sm mb-2">
                        Akses kamera ditolak.
                    </p>
                    <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-error text-white rounded text-sm hover:bg-error"
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : (
                <div className="p-6 bg-base-200 border border-dashed border-base-300 rounded-lg text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-base-content/50 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    <p className="text-base-content/60 text-sm mb-3">{label}</p>
                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={isStarting}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary transition text-sm disabled:opacity-50"
                    >
                        {isStarting ? "Memulai kameraâ€¦" : "Buka Kamera"}
                    </button>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

const AmbilAbsen = ({
    jadwal,
    periode,
    today,
    alreadySubmitted,
    checkedIn,
    message,
    flash,
}) => {
    const minDurasiMenit = Number(periode?.lama_piket) || 120;

    const formatDurasiLabel = (menit) => {
        const jam = Math.floor(menit / 60);
        const sisaMenit = menit % 60;

        if (jam > 0 && sisaMenit > 0) return `${jam} jam ${sisaMenit} menit`;
        if (jam > 0) return `${jam} jam`;
        return `${sisaMenit} menit`;
    };

    const minDurasiLabel = formatDurasiLabel(minDurasiMenit);

    
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    
    const [location, setLocation] = useState(null);
    const [locationSamples, setLocationSamples] = useState({ inside: 0, outside: 0 });

    useEffect(() => {
        if (!navigator.geolocation) return undefined;
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                setLocation(next);
                if (periode?.geolocation_enabled && periode.location_latitude && periode.location_longitude) {
                    const toRad = (value) => (value * Math.PI) / 180;
                    const dLat = toRad(next.latitude - Number(periode.location_latitude));
                    const dLon = toRad(next.longitude - Number(periode.location_longitude));
                    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(next.latitude)) * Math.cos(toRad(Number(periode.location_latitude))) * Math.sin(dLon / 2) ** 2;
                    const distance = 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
                    setLocationSamples((current) => distance <= Number(periode.location_radius_meters || 100)
                        ? { ...current, inside: current.inside + 1 }
                        : { ...current, outside: current.outside + 1 });
                }
            },
            () => setLocation(null),
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const [checkinPhoto, setCheckinPhoto] = useState(null);
    const checkinForm = useForm({
        kegiatan: "",
        periode_piket_id: periode?.id || "",
        jadwal_piket_id: jadwal?.id || "",
        foto_checkin: "",
        latitude: "",
        longitude: "",
    });

    
    const [checkoutPhoto, setCheckoutPhoto] = useState(null);
    const checkoutForm = useForm({
        absensi_id: checkedIn?.id || "",
        foto_checkout: "",
        kegiatan: checkedIn?.kegiatan || "",
        latitude: "",
        longitude: "",
        location_samples_inside: 0,
        location_samples_outside: 0,
    });

    
    const getDuration = () => {
        if (!checkedIn?.jam_masuk) return null;
        const [h, m, s] = checkedIn.jam_masuk.split(":").map(Number);
        const masuk = new Date(currentTime);
        masuk.setHours(h, m, s || 0, 0);
        const diffMs = currentTime - masuk;
        if (diffMs < 0)
            return {
                totalMenit: 0,
                jam: 0,
                menit: 0,
                valid: false,
                sisaMenit: minDurasiMenit,
            };
        const totalMenit = Math.floor(diffMs / 60000);
        return {
            totalMenit,
            jam: Math.floor(totalMenit / 60),
            menit: totalMenit % 60,
            valid: totalMenit >= minDurasiMenit,
            sisaMenit: Math.max(0, minDurasiMenit - totalMenit),
        };
    };

    const formatTime = (date) =>
        date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

    const formatJamMasuk = (jamStr) => {
        if (!jamStr) return "-";
        const [h, m] = jamStr.split(":");
        return `${h}:${m}`;
    };

    
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (message) toast.info(message);
        if (!periode)
            toast.warning(
                "Tidak ada periode piket aktif. Silakan hubungi admin.",
            );
    }, [flash, message, periode]);

    const isTodayScheduled = !!jadwal;
    const duration = getDuration();

    const handleCheckin = (e) => {
        e.preventDefault();
        if (!checkinPhoto) {
            toast.warning("Harap ambil foto check-in terlebih dahulu!");
            return;
        }
        checkinForm.transform((data) => ({ ...data, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null })).post(route("piket.absensi.store"));
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        if (!checkoutPhoto) {
            toast.warning("Harap ambil foto terlebih dahulu!");
            return;
        }
        if (!duration?.valid) {
            const sisa = duration?.sisaMenit ?? minDurasiMenit;
            toast.error(
                `Minimal piket ${minDurasiLabel}. Masih kurang ${Math.floor(sisa / 60)} jam ${sisa % 60} menit.`,
            );
            return;
        }
        checkoutForm.transform((data) => ({ ...data, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null, location_samples_inside: locationSamples.inside, location_samples_outside: locationSamples.outside })).post(route("piket.absensi.checkout"), {
            onSuccess: () => toast.success("Checkout berhasil!"),
            onError: (errors) =>
                toast.error(
                    errors.message || errors.foto_checkout || "Gagal checkout.",
                ),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Ambil Absen" />

            <div className="flex flex-col space-y-6">
                <div className="bg-base-100 rounded-lg shadow-sm">
                    
                    <div className="p-6 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-base-content">
                                Ambil Absen
                            </h2>
                            <p className="text-sm text-base-content/60 mt-1">
                                Tanggal:{" "}
                                {new Date(today).toLocaleDateString("id-ID", {
                                    dateStyle: "full",
                                })}
                            </p>
                        </div>
                        {periode && (
                            <div className="text-right space-y-1">
                                <span className="inline-block px-3 py-1 bg-primary/15 text-primary rounded-full text-sm">
                                    Periode: {periode.nama}
                                </span>
                                {jadwal?.is_override && (
                                    <div>
                                        <span className="inline-block px-3 py-1 bg-warning/20 text-warning rounded-full text-sm">
                                            âš ï¸ Override:{" "}
                                            {jadwal.original_day} â†’{" "}
                                            {jadwal.override_day}
                                        </span>
                                        <p className="text-xs text-base-content/60 mt-0.5">
                                            Alasan: {jadwal.override_reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    
                    {!periode && (
                        <div className="p-12 text-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto text-warning mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <h3 className="text-lg font-medium text-base-content mb-2">
                                Tidak Ada Periode Piket Aktif
                            </h3>
                            <p className="text-base-content/70">
                                Tidak dapat mengambil absen karena tidak ada
                                periode piket yang aktif saat ini. Silakan
                                hubungi administrator sistem.
                            </p>
                        </div>
                    )}

                    
                    {periode && !isTodayScheduled && (
                        <div className="p-12 text-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto text-info mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <h3 className="text-lg font-medium text-base-content mb-2">
                                Bukan Jadwal Piket Anda
                            </h3>
                            <p className="text-base-content/70">
                                Anda tidak memiliki jadwal piket untuk hari ini.
                                Silakan periksa jadwal piket Anda.
                            </p>
                        </div>
                    )}

                    
                    {periode && isTodayScheduled && alreadySubmitted && (
                        <div className="p-12 text-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto text-success mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <h3 className="text-lg font-medium text-base-content mb-2">
                                Piket Selesai
                            </h3>
                            <p className="text-base-content/70">
                                Anda sudah check-in dan checkout untuk hari ini.
                                Terima kasih!
                            </p>
                        </div>
                    )}

                    
                    {periode &&
                        isTodayScheduled &&
                        !alreadySubmitted &&
                        checkedIn && (
                            <form
                                onSubmit={handleCheckout}
                                className="p-6 space-y-6"
                            >
                                
                                <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-semibold text-success">
                                                Sedang Piket
                                            </p>
                                            <p className="text-sm text-success">
                                                Check-in pukul{" "}
                                                <span className="font-mono font-bold">
                                                    {formatJamMasuk(
                                                        checkedIn.jam_masuk,
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-base-content/60">
                                            Sekarang
                                        </p>
                                        <p className="font-mono text-lg font-bold text-base-content">
                                            {formatTime(currentTime)}
                                        </p>
                                    </div>
                                </div>

                                
                                <div
                                    className={`rounded-lg p-4 border ${duration?.valid ? "bg-primary/10 border-primary/30" : "bg-warning/10 border-warning/30"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p
                                                className={`text-sm font-medium ${duration?.valid ? "text-primary" : "text-warning"}`}
                                            >
                                                Durasi Piket
                                            </p>
                                            <p
                                                className={`text-2xl font-bold font-mono ${duration?.valid ? "text-primary" : "text-warning"}`}
                                            >
                                                {duration
                                                    ? `${duration.jam}j ${String(duration.menit).padStart(2, "0")}m`
                                                    : "--"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {duration?.valid ? (
                                                <span className="inline-block px-3 py-1 bg-primary/15 text-primary rounded-full text-sm font-medium">
                                                    Boleh Checkout
                                                </span>
                                            ) : (
                                                <div>
                                                    <p className="text-xs text-warning">
                                                        Minimal {minDurasiLabel}
                                                    </p>
                                                    <p className="text-sm font-semibold text-warning">
                                                        Kurang{" "}
                                                        {Math.floor(
                                                            (duration?.sisaMenit ??
                                                                minDurasiMenit) /
                                                                60,
                                                        )}
                                                        j{" "}
                                                        {(duration?.sisaMenit ??
                                                            minDurasiMenit) %
                                                            60}
                                                        m lagi
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 h-2 bg-base-300 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${duration?.valid ? "bg-primary" : "bg-warning"}`}
                                            style={{
                                                width: `${Math.min(100, ((duration?.totalMenit ?? 0) / minDurasiMenit) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-base-content/60 mt-1 text-right">
                                        {Math.min(
                                            100,
                                            Math.round(
                                                ((duration?.totalMenit ?? 0) /
                                                    minDurasiMenit) *
                                                    100,
                                            ),
                                        )}
                                        % dari {minDurasiLabel}
                                    </p>
                                </div>

                                
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-1">
                                        Kegiatan yang Dilakukan
                                    </label>
                                    <textarea
                                        value={checkoutForm.data.kegiatan}
                                        onChange={(e) =>
                                            checkoutForm.setData(
                                                "kegiatan",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Deskripsi kegiatan piket hari ini"
                                        className="w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows="3"
                                        required
                                    />
                                    {checkoutForm.errors.kegiatan && (
                                        <p className="text-error text-sm mt-1">
                                            {checkoutForm.errors.kegiatan}
                                        </p>
                                    )}
                                </div>

                                
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-2">
                                        Foto Checkout{" "}
                                        <span className="text-error">*</span>
                                    </label>
                                    {duration?.valid ? (
                                        <>
                                            <CameraCapture
                                                onCapture={(img) => {
                                                    setCheckoutPhoto(img);
                                                    checkoutForm.setData(
                                                        "foto_checkout",
                                                        img || "",
                                                    );
                                                }}
                                            />
                                            {checkoutForm.errors
                                                .foto_checkout && (
                                                <p className="text-error text-sm mt-1">
                                                    {
                                                        checkoutForm.errors
                                                            .foto_checkout
                                                    }
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="p-5 bg-base-200 border border-dashed border-base-300 rounded-lg flex flex-col items-center gap-2 text-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-10 w-10 text-base-content/50"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                            <p className="text-sm font-medium text-base-content/70">
                                                Foto belum bisa diambil
                                            </p>
                                            <p className="text-xs text-base-content/60">
                                                Foto checkout tersedia setelah
                                                shift selesai (minimal{" "}
                                                {minDurasiLabel}). Masih kurang{" "}
                                                <span className="font-semibold text-warning">
                                                    {Math.floor(
                                                        (duration?.sisaMenit ??
                                                            minDurasiMenit) /
                                                            60,
                                                    )}
                                                    j{" "}
                                                    {(duration?.sisaMenit ??
                                                        minDurasiMenit) % 60}
                                                    m
                                                </span>{" "}
                                                lagi.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={
                                            checkoutForm.processing ||
                                            !checkoutPhoto ||
                                            !duration?.valid
                                        }
                                        className={`px-6 py-2.5 rounded-md text-white font-medium transition ${
                                            checkoutForm.processing ||
                                            !checkoutPhoto ||
                                            !duration?.valid
                                                ? "bg-base-content/30 cursor-not-allowed"
                                                : "bg-error hover:bg-error"
                                        }`}
                                    >
                                        {checkoutForm.processing
                                            ? "Menyimpan"
                                            : !duration?.valid
                                              ? `Checkout (tunggu ${Math.floor((duration?.sisaMenit ?? minDurasiMenit) / 60)}j ${(duration?.sisaMenit ?? minDurasiMenit) % 60}m)`
                                              : "Checkout Sekarang"}
                                    </button>
                                </div>
                            </form>
                        )}

                    
                    {periode &&
                        isTodayScheduled &&
                        !alreadySubmitted &&
                        !checkedIn && (
                            <form
                                onSubmit={handleCheckin}
                                className="p-6 space-y-6"
                            >
                                
                                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-primary shrink-0 mt-0.5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-primary">
                                                Alur Absensi Piket
                                            </p>
                                            <ol className="text-sm text-primary mt-1 list-decimal ml-4 space-y-0.5">
                                                <li>
                                                    Ambil{" "}
                                                    <strong>
                                                        foto check-in
                                                    </strong>{" "}
                                                    sebagai bukti kehadiran
                                                </li>
                                                <li>
                                                    Klik{" "}
                                                    <strong>Check In</strong> —
                                                    jam masuk dicatat otomatis
                                                </li>
                                                <li>
                                                    Minimal piket{" "}
                                                    <strong>
                                                        {minDurasiLabel}
                                                    </strong>
                                                </li>
                                                <li>
                                                    Saat selesai, ambil{" "}
                                                    <strong>
                                                        foto checkout
                                                    </strong>{" "}
                                                    lalu klik{" "}
                                                    <strong>Checkout</strong>
                                                </li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                
                                <div className="flex items-center gap-4 bg-base-200 border border-base-300 rounded-lg px-4 py-3">
                                    <div>
                                        <p className="text-xs text-base-content/60">
                                            Jam Masuk (otomatis)
                                        </p>
                                        <p className="font-mono text-2xl font-bold text-base-content">
                                            {formatTime(currentTime)}
                                        </p>
                                    </div>
                                    <div className="ml-auto text-right text-xs text-base-content/50">
                                        Dicatat saat submit
                                    </div>
                                </div>

                                
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-2">
                                        Foto Check-in{" "}
                                        <span className="text-error">*</span>
                                    </label>
                                    <CameraCapture
                                        label="Ambil foto sebagai bukti kehadiran check-in"
                                        onCapture={(img) => {
                                            setCheckinPhoto(img);
                                            checkinForm.setData(
                                                "foto_checkin",
                                                img || "",
                                            );
                                        }}
                                    />
                                    {checkinForm.errors.foto_checkin && (
                                        <p className="text-error text-sm mt-1">
                                            {checkinForm.errors.foto_checkin}
                                        </p>
                                    )}
                                </div>

                                
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-1">
                                        Rencana Kegiatan
                                    </label>
                                    <textarea
                                        value={checkinForm.data.kegiatan}
                                        onChange={(e) =>
                                            checkinForm.setData(
                                                "kegiatan",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Isi rencana kegiatan piket hari ini"
                                        className="w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows="3"
                                        required
                                    />
                                    {checkinForm.errors.kegiatan && (
                                        <p className="text-error text-sm mt-1">
                                            {checkinForm.errors.kegiatan}
                                        </p>
                                    )}
                                </div>

                                
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={
                                            checkinForm.processing ||
                                            !checkinPhoto
                                        }
                                        className={`px-6 py-2.5 rounded-md text-white font-medium transition ${
                                            checkinForm.processing ||
                                            !checkinPhoto
                                                ? "bg-base-content/30 cursor-not-allowed"
                                                : "bg-success hover:bg-success"
                                        }`}
                                    >
                                        {checkinForm.processing
                                            ? "Menyimpan…"
                                            : "Check In Sekarang"}
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
