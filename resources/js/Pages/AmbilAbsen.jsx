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
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition text-sm"
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
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm ${
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
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            ) : hasPermission === false ? (
                <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-red-700 text-sm mb-2">
                        Akses kamera ditolak.
                    </p>
                    <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : (
                <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-gray-400 mb-2"
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
                    <p className="text-gray-500 text-sm mb-3">{label}</p>
                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={isStarting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm disabled:opacity-50"
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
    // Live clock
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Check-in form
    const [checkinPhoto, setCheckinPhoto] = useState(null);
    const checkinForm = useForm({
        kegiatan: "",
        periode_piket_id: periode?.id || "",
        jadwal_piket: jadwal?.id || "",
        foto_checkin: "",
    });

    // Checkout form
    const [checkoutPhoto, setCheckoutPhoto] = useState(null);
    const checkoutForm = useForm({
        absensi_id: checkedIn?.id || "",
        foto: "",
        kegiatan: checkedIn?.kegiatan || "",
    });

    // Duration helpers
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
                sisaMenit: 120,
            };
        const totalMenit = Math.floor(diffMs / 60000);
        return {
            totalMenit,
            jam: Math.floor(totalMenit / 60),
            menit: totalMenit % 60,
            valid: totalMenit >= 120,
            sisaMenit: Math.max(0, 120 - totalMenit),
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

    // Flash messages
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
        checkinForm.post(route("piket.absensi.store"), {
            onSuccess: () => toast.success("Check-in berhasil!"),
            onError: (errors) =>
                toast.error(
                    errors.message || errors.kegiatan || "Gagal check-in.",
                ),
        });
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        if (!checkoutPhoto) {
            toast.warning("Harap ambil foto terlebih dahulu!");
            return;
        }
        if (!duration?.valid) {
            const sisa = duration?.sisaMenit ?? 120;
            toast.error(
                `Minimal piket 2 jam. Masih kurang ${Math.floor(sisa / 60)} jam ${sisa % 60} menit.`,
            );
            return;
        }
        checkoutForm.post(route("piket.absensi.checkout"), {
            onSuccess: () => toast.success("Checkout berhasil!"),
            onError: (errors) =>
                toast.error(errors.message || errors.foto || "Gagal checkout."),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Ambil Absen" />

            <div className="flex flex-col space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="p-6 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Ambil Absen
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Tanggal:{" "}
                                {new Date(today).toLocaleDateString("id-ID", {
                                    dateStyle: "full",
                                })}
                            </p>
                        </div>
                        {periode && (
                            <div className="text-right space-y-1">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    Periode: {periode.nama}
                                </span>
                                {jadwal?.is_override && (
                                    <div>
                                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                            âš ï¸ Override:{" "}
                                            {jadwal.original_day} â†’{" "}
                                            {jadwal.override_day}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Alasan: {jadwal.override_reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 1. No active period */}
                    {!periode && (
                        <div className="p-12 text-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto text-yellow-500 mb-4"
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Tidak Ada Periode Piket Aktif
                            </h3>
                            <p className="text-gray-600">
                                Tidak dapat mengambil absen karena tidak ada
                                periode piket yang aktif saat ini. Silakan
                                hubungi administrator sistem.
                            </p>
                        </div>
                    )}

                    {/* 2. Not their scheduled day */}
                    {periode && !isTodayScheduled && (
                        <div className="p-12 text-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto text-blue-400 mb-4"
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Bukan Jadwal Piket Anda
                            </h3>
                            <p className="text-gray-600">
                                Anda tidak memiliki jadwal piket untuk hari ini.
                                Silakan periksa jadwal piket Anda.
                            </p>
                        </div>
                    )}

                    {/* 3. Fully done (checked out) */}
                    {periode && isTodayScheduled && alreadySubmitted && (
                        <div className="p-12 text-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto text-green-500 mb-4"
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Piket Selesai
                            </h3>
                            <p className="text-gray-600">
                                Anda sudah check-in dan checkout untuk hari ini.
                                Terima kasih!
                            </p>
                        </div>
                    )}

                    {/* 4. Checked in â†’ show checkout form */}
                    {periode &&
                        isTodayScheduled &&
                        !alreadySubmitted &&
                        checkedIn && (
                            <form
                                onSubmit={handleCheckout}
                                className="p-6 space-y-6"
                            >
                                {/* Status bar */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-semibold text-green-800">
                                                Sedang Piket
                                            </p>
                                            <p className="text-sm text-green-700">
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
                                        <p className="text-xs text-gray-500">
                                            Sekarang
                                        </p>
                                        <p className="font-mono text-lg font-bold text-gray-800">
                                            {formatTime(currentTime)}
                                        </p>
                                    </div>
                                </div>

                                {/* Duration indicator */}
                                <div
                                    className={`rounded-lg p-4 border ${duration?.valid ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p
                                                className={`text-sm font-medium ${duration?.valid ? "text-blue-700" : "text-amber-700"}`}
                                            >
                                                Durasi Piket
                                            </p>
                                            <p
                                                className={`text-2xl font-bold font-mono ${duration?.valid ? "text-blue-800" : "text-amber-800"}`}
                                            >
                                                {duration
                                                    ? `${duration.jam}j ${String(duration.menit).padStart(2, "0")}m`
                                                    : "--"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {duration?.valid ? (
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                    Boleh Checkout
                                                </span>
                                            ) : (
                                                <div>
                                                    <p className="text-xs text-amber-600">
                                                        Minimal 2 jam
                                                    </p>
                                                    <p className="text-sm font-semibold text-amber-700">
                                                        Kurang{" "}
                                                        {Math.floor(
                                                            (duration?.sisaMenit ??
                                                                120) / 60,
                                                        )}
                                                        j{" "}
                                                        {(duration?.sisaMenit ??
                                                            120) % 60}
                                                        m lagi
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${duration?.valid ? "bg-blue-500" : "bg-amber-400"}`}
                                            style={{
                                                width: `${Math.min(100, ((duration?.totalMenit ?? 0) / 120) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 text-right">
                                        {Math.min(
                                            100,
                                            Math.round(
                                                ((duration?.totalMenit ?? 0) /
                                                    120) *
                                                    100,
                                            ),
                                        )}
                                        % dari 2 jam
                                    </p>
                                </div>

                                {/* Kegiatan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        required
                                    />
                                    {checkoutForm.errors.kegiatan && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {checkoutForm.errors.kegiatan}
                                        </p>
                                    )}
                                </div>

                                {/* Photo — only unlocked after 2-hour minimum */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Foto Checkout{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    {duration?.valid ? (
                                        <>
                                            <CameraCapture
                                                onCapture={(img) => {
                                                    setCheckoutPhoto(img);
                                                    checkoutForm.setData(
                                                        "foto",
                                                        img || "",
                                                    );
                                                }}
                                            />
                                            {checkoutForm.errors.foto && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {checkoutForm.errors.foto}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="p-5 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex flex-col items-center gap-2 text-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-10 w-10 text-gray-400"
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
                                            <p className="text-sm font-medium text-gray-600">
                                                Foto belum bisa diambil
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Foto checkout tersedia setelah
                                                shift selesai (minimal 2 jam).{" "}
                                                Masih kurang{" "}
                                                <span className="font-semibold text-amber-700">
                                                    {Math.floor(
                                                        (duration?.sisaMenit ??
                                                            120) / 60,
                                                    )}
                                                    j{" "}
                                                    {(duration?.sisaMenit ??
                                                        120) % 60}
                                                    m
                                                </span>{" "}
                                                lagi.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
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
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-red-600 hover:bg-red-700"
                                        }`}
                                    >
                                        {checkoutForm.processing
                                            ? "Menyimpanâ€¦"
                                            : !duration?.valid
                                              ? `Checkout (tunggu ${Math.floor((duration?.sisaMenit ?? 120) / 60)}j ${(duration?.sisaMenit ?? 120) % 60}m)`
                                              : "Checkout Sekarang"}
                                    </button>
                                </div>
                            </form>
                        )}

                    {/* 5. Not checked in yet â†’ show check-in form */}
                    {periode &&
                        isTodayScheduled &&
                        !alreadySubmitted &&
                        !checkedIn && (
                            <form
                                onSubmit={handleCheckin}
                                className="p-6 space-y-6"
                            >
                                {/* Info card */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-blue-500 shrink-0 mt-0.5"
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
                                            <p className="text-sm font-medium text-blue-800">
                                                Alur Absensi Piket
                                            </p>
                                            <ol className="text-sm text-blue-700 mt-1 list-decimal ml-4 space-y-0.5">
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
                                                    <strong>2 jam</strong>
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

                                {/* Jam masuk display (auto) */}
                                <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Jam Masuk (otomatis)
                                        </p>
                                        <p className="font-mono text-2xl font-bold text-gray-800">
                                            {formatTime(currentTime)}
                                        </p>
                                    </div>
                                    <div className="ml-auto text-right text-xs text-gray-400">
                                        Dicatat saat submit
                                    </div>
                                </div>

                                {/* Foto Check-in */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Foto Check-in{" "}
                                        <span className="text-red-500">*</span>
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
                                        <p className="text-red-500 text-sm mt-1">
                                            {checkinForm.errors.foto_checkin}
                                        </p>
                                    )}
                                </div>

                                {/* Kegiatan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        required
                                    />
                                    {checkinForm.errors.kegiatan && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {checkinForm.errors.kegiatan}
                                        </p>
                                    )}
                                </div>

                                {/* Submit */}
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
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-green-600 hover:bg-green-700"
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
