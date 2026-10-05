import Button from "@/Components/Button";
import axios from "axios";
import { AlertCircle, Info, Loader2, ScanFace } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_FRAMES = 24;

export default function FaceCapture({ purpose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [ready, setReady] = useState(false);
    const [instruction, setInstruction] = useState("");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        if (cameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => showError("Kamera tidak dapat diputar."));
        }
    }, [cameraOpen]);

    useEffect(() => () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
    }, []);

    const showError = (message) => {
        setError(message || "Perekaman wajah gagal.");
        toast.error(message || "Perekaman wajah gagal.");
    };

    const openCamera = async () => {
        setError("");
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
            setCameraOpen(true);
        } catch {
            showError("Kamera tidak tersedia. Periksa izin kamera browser.");
        }
    };

    const record = async () => {
        if (!videoRef.current?.videoWidth) {
            showError("Tunggu hingga kamera siap.");
            return;
        }
        setError("");
        setReady(false);
        setProgress(0);
        onCapture(null);
        setRecording(true);
        try {
            const { data: challenge } = await axios.post(route("piket.wajah.challenge"), { purpose });
            setInstruction("Tatap kamera dan tahan posisi wajah Anda.");
            const frames = [];
            const canvas = canvasRef.current;
            canvas.width = 640;
            canvas.height = 480;
            const context = canvas.getContext("2d");
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (videoRef.current?.videoWidth && frames.length < MAX_FRAMES) {
                        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                        frames.push(canvas.toDataURL("image/jpeg", 0.6));
                        setProgress(Math.round((frames.length / MAX_FRAMES) * 100));
                    }
                    if (frames.length >= MAX_FRAMES) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
                setTimeout(() => { clearInterval(interval); resolve(); }, 3500);
            });
            if (frames.length < 12) throw new Error("Rekaman terlalu singkat. Coba lagi.");
            onCapture({ challenge_id: challenge.id, frames });
            setReady(true);
            setInstruction("Rekaman siap. Segera kirim sebelum 90 detik.");
        } catch (err) {
            showError(err.response?.data?.errors?.face?.[0] || err.message);
        } finally {
            setRecording(false);
        }
    };

    return (
        <div className="space-y-3 rounded-box border border-base-300 bg-base-100 p-4">
            <p className="font-medium">Verifikasi wajah</p>
            <p className="text-sm text-base-content/70">Pastikan wajah Anda terlihat jelas di kamera, lalu rekam.</p>

            <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-box bg-neutral">
                {cameraOpen ? (
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
                ) : (
                    <div className="absolute inset-0 grid place-content-center place-items-center gap-2 text-center text-neutral-content">
                        <ScanFace className="h-12 w-12 opacity-70" aria-hidden="true" />
                        <p className="text-sm">Kamera belum dibuka</p>
                    </div>
                )}

                {cameraOpen && recording && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-box bg-base-content/55 p-3">
                        <div className="flex flex-col items-center gap-2 text-center text-base-100">
                            <ScanFace className="h-14 w-14 animate-pulse" aria-hidden="true" />
                            <p className="text-sm font-semibold">Tatap kamera, jangan bergerak</p>
                            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-base-100/40">
                                <div className="h-full rounded-full bg-success transition-all duration-100" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs opacity-80">{progress}%</p>
                        </div>
                    </div>
                )}
                {cameraOpen && ready && (
                    <div className="absolute right-2 top-2 z-10 rounded-full bg-success px-2.5 py-1 text-xs font-medium text-success-content">
                        Siap dikirim
                    </div>
                )}
                {cameraOpen && !recording && !ready && (
                    <div
                        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[72%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 border-dashed border-base-100/70"
                        aria-hidden="true"
                    />
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-wrap gap-2">
                {!cameraOpen && <Button type="button" variant="outline" onClick={openCamera}>Buka kamera</Button>}
                {cameraOpen && <Button type="button" variant="outline" onClick={record} loading={recording}>Rekam verifikasi</Button>}
            </div>

            {instruction && !error && (
                <p role="status" className="flex items-center gap-2 text-sm text-base-content">
                    {recording && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
                    {instruction}
                </p>
            )}
            {ready && !error && <p className="text-sm text-success">Rekaman siap untuk dikirim.</p>}

            {error && (
                <div role="alert" className="flex items-start gap-2 rounded-box border border-error/30 bg-error/10 p-3 text-sm text-error">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <div>
                        <p className="font-medium">{error}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-error/80">
                            <Info className="h-3.5 w-3.5" aria-hidden="true" />
                            Pastikan pencahayaan cukup dan wajah menghadap kamera, lalu coba rekam ulang.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
