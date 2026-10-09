import Button from "@/Components/Button";
import EmptyState from "@/Components/EmptyState";
import FaceCapture from "@/Components/FaceCapture";
import Modal from "@/Components/Modal";
import { useKepengurusanAccess } from "@/Hooks/useKepengurusanAccess";
import DashboardLayout from "@/Layouts/DashboardLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, useForm } from "@inertiajs/react";
import { AlertCircle, CalendarDays, CalendarX, CheckCircle2, Clock, Info, MapPin, Play, ScanFace, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import GeofenceStatus from "./AmbilAbsen/Partials/GeofenceStatus";

function FaceNotEnrolledNotice() {
    return (
        <div className="rounded-box border border-warning/40 bg-warning/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Wajah Anda belum terdaftar
            </p>
            <p className="mt-1 text-sm text-base-content/80">
                Periode piket ini mewajibkan verifikasi wajah. Daftarkan wajah Anda dulu dan tunggu persetujuan admin sebelum bisa check-in atau checkout.
            </p>
            <a
                href={route("piket.wajah.index")}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-content transition hover:opacity-90"
            >
                <ScanFace className="h-4 w-4" aria-hidden="true" />
                Daftarkan wajah sekarang
            </a>
        </div>
    );
}

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
                    toast.error("Akses kamera ditolak. Izinkan kamera di pengaturan browser.");
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

    useEffect(() => () => {
        if (stream) stream.getTracks().forEach((t) => t.stop());
    }, [stream]);

    return (
        <div className="space-y-3">
            {photo ? (
                <div className="flex flex-col items-center gap-3">
                    <img src={photo} alt="Foto absensi" className="w-full max-w-sm rounded-box border border-base-300" />
                    <Button type="button" variant="warning" onClick={retake}>Ambil Ulang</Button>
                </div>
            ) : isCameraOpen ? (
                <div className="flex flex-col items-center gap-3">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="aspect-[4/3] w-full max-w-sm rounded-box border border-base-300 bg-black object-cover [transform:scaleX(-1)]"
                    />
                    <div className="flex gap-2">
                        <Button type="button" onClick={capturePhoto} loading={!isCameraReady}>Ambil Foto</Button>
                        <Button type="button" variant="ghost" onClick={stopCamera} className="border border-base-300">Batal</Button>
                    </div>
                </div>
            ) : hasPermission === false ? (
                <div className="rounded-box border border-error/30 bg-error/10 p-4 text-center">
                    <p className="mb-2 text-sm text-error">Akses kamera ditolak.</p>
                    <Button type="button" variant="danger" size="sm" onClick={startCamera}>Coba Lagi</Button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 bg-base-200 p-6 text-center">
                    <ScanFace className="h-10 w-10 text-base-content/40" aria-hidden="true" />
                    <p className="text-sm text-base-content/60">{label}</p>
                    <Button type="button" onClick={startCamera} loading={isStarting}>Buka Kamera</Button>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

function SessionProgress({ valid, totalMenit, sisaMenit, minDurasiLabel, minDurasiMenit }) {
    const percent = Math.min(100, Math.round(((totalMenit ?? 0) / minDurasiMenit) * 100));
    const sisaJam = Math.floor((sisaMenit ?? minDurasiMenit) / 60);
    const sisaMin = (sisaMenit ?? minDurasiMenit) % 60;
    const sisaLabel = `${sisaJam > 0 ? `${sisaJam}j ` : ""}${sisaMin}m`;

    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm text-base-content/60">Durasi piket</p>
                <p className={`font-mono text-lg font-bold ${valid ? "text-success" : "text-warning"}`}>
                    {totalMenit != null ? `${Math.floor(totalMenit / 60)}j ${String(totalMenit % 60).padStart(2, "0")}m` : "--"}
                </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-base-300">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${valid ? "bg-success" : "bg-warning"}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="text-xs text-base-content/60">
                {valid ? "Sudah bisa checkout." : `Kurang ${sisaLabel} lagi dari minimal ${minDurasiLabel}.`}
            </p>
        </div>
    );
}

const AmbilAbsen = ({
    jadwal,
    periode,
    today,
    alreadySubmitted,
    checkedIn,
    faceEnrolled = true,
    message,
    flash,
}) => {
    const { canMutate } = useKepengurusanAccess();
    const geofenceEnabled = !!periode?.geolocation_enabled;
    const faceRequired = !!periode?.face_recognition_enabled;
    const faceMissing = faceRequired && !faceEnrolled;
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

    const [locationDistance, setLocationDistance] = useState(null);
    const [locationSamples, setLocationSamples] = useState({ inside: 0, outside: 0 });
    const lastPositionRef = useRef(null);
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        if (!canMutate || !geofenceEnabled || !navigator.geolocation) return undefined;
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                lastPositionRef.current = next;
                if (periode.location_latitude != null && periode.location_longitude != null) {
                    const toRad = (value) => (value * Math.PI) / 180;
                    const dLat = toRad(next.latitude - Number(periode.location_latitude));
                    const dLon = toRad(next.longitude - Number(periode.location_longitude));
                    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(next.latitude)) * Math.cos(toRad(Number(periode.location_latitude))) * Math.sin(dLon / 2) ** 2;
                    const distance = 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
                    setLocationDistance(distance);
                    setLocationSamples((current) => distance <= Number(periode.location_radius_meters || 100)
                        ? { ...current, inside: current.inside + 1 }
                        : { ...current, outside: current.outside + 1 });
                }
            },
            () => setLocationDistance(null),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [canMutate, geofenceEnabled, periode?.id, periode?.location_latitude, periode?.location_longitude, periode?.location_radius_meters]);

    const [checkinPhoto, setCheckinPhoto] = useState(null);
    const [checkinFaceProof, setCheckinFaceProof] = useState(null);
    const checkinForm = useForm({
        kegiatan: "",
        periode_piket_id: periode?.id || "",
        jadwal_piket_id: jadwal?.id || "",
        foto_checkin: "",
        latitude: "",
        longitude: "",
    });

    const [checkoutPhoto, setCheckoutPhoto] = useState(null);
    const [checkoutFaceProof, setCheckoutFaceProof] = useState(null);
    const checkoutForm = useForm({
        absensi_id: checkedIn?.id || "",
        foto_checkout: "",
        kegiatan: checkedIn?.kegiatan || "",
        latitude: "",
        longitude: "",
        location_samples_inside: 0,
        location_samples_outside: 0,
    });

    const [activityOpen, setActivityOpen] = useState(false);

    const getDuration = () => {
        if (!checkedIn?.jam_masuk) return null;
        const [h, m, s] = checkedIn.jam_masuk.split(":").map(Number);
        const masuk = new Date(currentTime);
        masuk.setHours(h, m, s || 0, 0);
        const diffMs = currentTime - masuk;
        if (diffMs < 0) return { totalMenit: 0, valid: false, sisaMenit: minDurasiMenit };
        const totalMenit = Math.floor(diffMs / 60000);
        return { totalMenit, valid: totalMenit >= minDurasiMenit, sisaMenit: Math.max(0, minDurasiMenit - totalMenit) };
    };

    const formatTime = (date) =>
        date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const formatJamMasuk = (jamStr) => {
        if (!jamStr) return "-";
        const [h, m] = jamStr.split(":");
        return `${h}:${m}`;
    };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (message) toast.info(message);
        if (!periode) toast.warning("Tidak ada periode piket aktif. Silakan hubungi admin.");
    }, [flash, message, periode]);

    const isTodayScheduled = !!jadwal;
    const duration = getDuration();
    const canSubmitCheckout = !!duration?.valid;

    const getSubmitLocation = () => {
        if (!geofenceEnabled) return Promise.resolve(null);
        if (!navigator.geolocation) return Promise.reject(new Error("Perangkat tidak mendukung lokasi."));

        const getCurrent = (options) => new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
                reject,
                options,
            );
        });

        return getCurrent({ enableHighAccuracy: true, maximumAge: 5000, timeout: 6000 }).catch((err) => {
            if (lastPositionRef.current) return lastPositionRef.current;
            if (err?.code === 1) throw new Error("Izin lokasi ditolak. Aktifkan izin lokasi pada browser lalu coba lagi.");
            throw new Error("Lokasi tidak tersedia. Pastikan GPS aktif dan berada dekat jendela, lalu coba lagi.");
        });
    };

    const openCheckin = () => {
        if (faceMissing) {
            toast.error("Wajah Anda belum terdaftar dan disetujui admin.");
            return;
        }
        setActivityOpen(true);
    };

    const handleCheckin = async (e) => {
        e.preventDefault();
        if (!canMutate) return;
        if (faceMissing) {
            toast.error("Wajah Anda belum terdaftar dan disetujui admin.");
            return;
        }
        if (!checkinForm.data.kegiatan.trim()) {
            toast.warning("Isi rencana kegiatan terlebih dahulu.");
            return;
        }
        if (faceRequired ? !checkinFaceProof : !checkinPhoto) {
            toast.warning(faceRequired ? "Rekam verifikasi wajah terlebih dahulu." : "Harap ambil foto check-in terlebih dahulu!");
            return;
        }
        setLocating(true);
        try {
            const position = await getSubmitLocation();
            // Inertia v2: transform() tidak chainable, set lalu panggil post terpisah.
            checkinForm.transform((data) => ({ ...data, ...checkinFaceProof, latitude: position?.latitude ?? null, longitude: position?.longitude ?? null }));
            checkinForm.post(route("piket.absensi.store"), {
                onSuccess: () => setActivityOpen(false),
                onError: (errors) => toast.error(errors.face || errors.location || "Gagal check-in."),
            });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLocating(false);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!canMutate) return;
        if (faceMissing) {
            toast.error("Wajah Anda belum terdaftar dan disetujui admin.");
            return;
        }
        if (!checkoutForm.data.kegiatan.trim()) {
            toast.warning("Isi kegiatan yang dilakukan terlebih dahulu.");
            return;
        }
        if (faceRequired ? !checkoutFaceProof : !checkoutPhoto) {
            toast.warning(faceRequired ? "Rekam verifikasi wajah terlebih dahulu." : "Harap ambil foto terlebih dahulu!");
            return;
        }
        if (!canSubmitCheckout) {
            const sisa = duration?.sisaMenit ?? minDurasiMenit;
            toast.error(`Minimal piket ${minDurasiLabel}. Masih kurang ${Math.floor(sisa / 60)} jam ${sisa % 60} menit.`);
            return;
        }
        setLocating(true);
        try {
            const position = await getSubmitLocation();
            checkoutForm.transform((data) => ({ ...data, ...checkoutFaceProof, latitude: position?.latitude ?? null, longitude: position?.longitude ?? null, location_samples_inside: locationSamples.inside, location_samples_outside: locationSamples.outside }));
            checkoutForm.post(route("piket.absensi.checkout"), {
                onSuccess: () => setActivityOpen(false),
                onError: (errors) => toast.error(errors.face || errors.location || errors.foto_checkout || "Gagal checkout."),
            });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLocating(false);
        }
    };

    const metaItem = (Icon, label, value) => (
        <div className="rounded-box border border-base-300 bg-base-100 p-3">
            <dt className="flex items-center gap-1.5 text-xs text-base-content/55">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-base-content">{value}</dd>
        </div>
    );

    const notice = !periode
        ? { icon: CalendarX, title: "Tidak ada periode piket aktif", description: "Hubungi administrator sistem untuk mengaktifkan periode." }
        : !isTodayScheduled
          ? { icon: CalendarDays, title: "Bukan jadwal piket Anda", description: "Anda tidak memiliki jadwal piket untuk hari ini." }
          : alreadySubmitted
            ? { icon: CheckCircle2, className: "text-success", title: "Piket selesai", description: "Anda sudah check-in dan checkout hari ini. Terima kasih!" }
            : null;

    return (
        <DashboardLayout breadcrumbs={[{ label: "Ambil Absen", href: null }]}>
            <Head title="Ambil Absen" />

            <PageHeader title="Ambil Absen" description={`Jadwal: ${jadwal?.hari ? jadwal.hari.charAt(0).toUpperCase() + jadwal.hari.slice(1) : "—"}`} />

            <div className="space-y-4">
                {periode && (
                    <div className="card bg-base-100 shadow-xs">
                        <div className="card-body gap-3 p-3.5 sm:p-4">
                            <dl className="grid grid-cols-2 gap-3">
                                {metaItem(CalendarDays, "Tanggal", new Date(today).toLocaleDateString("id-ID", { dateStyle: "medium" }))}
                                {metaItem(Clock, "Periode", periode.nama)}
                            </dl>
                            {jadwal?.is_override && (
                                <p className="flex items-start gap-2 rounded-box bg-warning/10 p-3 text-xs text-warning">
                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    Override: {jadwal.original_day} → {jadwal.override_day}. {jadwal.override_reason}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {isTodayScheduled && !alreadySubmitted && (
                    <GeofenceStatus periode={periode} distance={locationDistance} error={checkinForm.errors.location || checkoutForm.errors.location} />
                )}

                {notice && (
                    <div className="card bg-base-100 shadow-xs">
                        <div className="card-body p-3.5 sm:p-4">
                            <EmptyState icon={notice.icon} className={`min-h-24 ${notice.className ?? ""}`} title={notice.title} description={notice.description} />
                        </div>
                    </div>
                )}

                {/* Sesi berjalan: status + jam + durasi dalam satu kartu */}
                {!notice && checkedIn && (
                    <div className="card bg-base-100 shadow-xs">
                        <div className="card-body space-y-4 p-3.5 sm:p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="inline-flex items-center gap-2 self-start rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden="true" />
                                    Sedang piket sejak {formatJamMasuk(checkedIn.jam_masuk)}
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-xs text-base-content/50">Sekarang</p>
                                    <p className="font-mono text-lg font-bold text-base-content">{formatTime(currentTime)}</p>
                                </div>
                            </div>

                            <SessionProgress
                                valid={canSubmitCheckout}
                                totalMenit={duration?.totalMenit}
                                sisaMenit={duration?.sisaMenit}
                                minDurasiLabel={minDurasiLabel}
                                minDurasiMenit={minDurasiMenit}
                            />

                            {canMutate && (faceMissing ? (
                                <FaceNotEnrolledNotice />
                            ) : (
                                <div className="space-y-3 border-t border-base-200 pt-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-medium">Foto & kegiatan checkout</p>
                                        {faceRequired && (
                                            <Button href={route("piket.wajah.index")} variant="outline" size="sm">
                                                <ScanFace className="h-4 w-4" aria-hidden="true" />
                                                Kelola wajah
                                            </Button>
                                        )}
                                    </div>
                                    {faceRequired ? (
                                        <FaceCapture purpose="checkout" onCapture={setCheckoutFaceProof} />
                                    ) : (
                                        <CameraCapture label="Ambil foto sebagai bukti checkout" onCapture={(img) => { setCheckoutPhoto(img); checkoutForm.setData("foto_checkout", img || ""); }} />
                                    )}
                                    <Button type="button" variant="secondary" onClick={() => setActivityOpen(true)} disabled={!canSubmitCheckout || (faceRequired ? !checkoutFaceProof : !checkoutPhoto)}>
                                        <Square className="h-4 w-4" aria-hidden="true" />
                                        Isi kegiatan &amp; checkout
                                    </Button>
                                    {!canSubmitCheckout && (
                                        <p className="text-xs text-warning">
                                            Checkout terbuka setelah minimal {minDurasiLabel}. Masih kurang {Math.floor((duration?.sisaMenit ?? minDurasiMenit) / 60)}j {(duration?.sisaMenit ?? minDurasiMenit) % 60}m.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Belum check-in: aksi utama langsung di halaman */}
                {!notice && !checkedIn && (
                    <div className="card bg-base-100 shadow-xs">
                        <div className="card-body space-y-4 p-3.5 sm:p-4">
                            <div className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                                <Clock className="h-5 w-5 shrink-0 text-base-content/50" aria-hidden="true" />
                                <div>
                                    <p className="text-xs text-base-content/55">Jam masuk (otomatis saat check-in)</p>
                                    <p className="font-mono text-xl font-bold text-base-content">{formatTime(currentTime)}</p>
                                </div>
                            </div>

                            {canMutate && (faceMissing ? (
                                <FaceNotEnrolledNotice />
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-medium">Foto check-in</p>
                                        {faceRequired && (
                                            <Button href={route("piket.wajah.index")} variant="outline" size="sm">
                                                <ScanFace className="h-4 w-4" aria-hidden="true" />
                                                Kelola wajah
                                            </Button>
                                        )}
                                    </div>
                                    {faceRequired ? (
                                        <FaceCapture purpose="checkin" onCapture={setCheckinFaceProof} />
                                    ) : (
                                        <CameraCapture label="Ambil foto sebagai bukti kehadiran check-in" onCapture={(img) => { setCheckinPhoto(img); checkinForm.setData("foto_checkin", img || ""); }} />
                                    )}
                                    <Button type="button" variant="success" onClick={openCheckin} disabled={faceRequired ? !checkinFaceProof : !checkinPhoto}>
                                        <Play className="h-4 w-4" aria-hidden="true" />
                                        Check In Sekarang
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal kegiatan: dipakai check-in maupun checkout */}
            <Modal show={canMutate && activityOpen} onClose={() => setActivityOpen(false)} maxWidth="md">
                <form onSubmit={checkedIn ? handleCheckout : handleCheckin}>
                    <div className="flex items-start gap-3 border-b border-base-200 p-4 sm:p-5">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        <div>
                            <h2 className="text-lg font-semibold">{checkedIn ? "Kegiatan & Checkout" : "Rencana Kegiatan"}</h2>
                            <p className="text-sm text-base-content/60">
                                {checkedIn ? "Isi kegiatan yang sudah dilakukan sebelum checkout." : "Isi rencana kegiatan piket hari ini."}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3 p-4 sm:p-5">
                        <label htmlFor="kegiatan" className="text-sm font-medium">
                            {checkedIn ? "Kegiatan yang dilakukan" : "Rencana kegiatan"}
                        </label>
                        <textarea
                            id="kegiatan"
                            rows={4}
                            value={checkedIn ? checkoutForm.data.kegiatan : checkinForm.data.kegiatan}
                            onChange={(e) => (checkedIn ? checkoutForm.setData("kegiatan", e.target.value) : checkinForm.setData("kegiatan", e.target.value))}
                            placeholder={checkedIn ? "Contoh: membersihkan lab, mengecek alat..." : "Contoh: menyiapkan alat praktikum..."}
                            className="textarea min-h-28 w-full"
                            required
                        />
                        {(checkedIn ? checkoutForm.errors.kegiatan : checkinForm.errors.kegiatan) && (
                            <p className="text-sm text-error">{(checkedIn ? checkoutForm.errors.kegiatan : checkinForm.errors.kegiatan)}</p>
                        )}
                        <div className="flex flex-col-reverse gap-2 border-t border-base-200 pt-4 sm:flex-row sm:justify-end">
                            <Button type="button" variant="ghost" onClick={() => setActivityOpen(false)}>Batal</Button>
                            <Button
                                type="submit"
                                variant={checkedIn ? "danger" : "success"}
                                loading={(checkedIn ? checkoutForm.processing : checkinForm.processing) || locating}
                            >
                                {locating
                                    ? "Mengambil lokasi..."
                                    : (checkedIn ? checkoutForm.processing : checkinForm.processing)
                                      ? (faceRequired ? "Menganalisis wajah..." : "Menyimpan...")
                                      : checkedIn
                                        ? "Checkout Sekarang"
                                        : "Check In Sekarang"}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default AmbilAbsen;
