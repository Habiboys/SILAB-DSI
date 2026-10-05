import Button from "@/Components/Button";
import axios from "axios";
import { AlertCircle, Info, Loader2, ScanFace } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function RecordGuide({ facing }) {
    const position =
        facing === "left"
            ? "animate-[faceNudgeLeft_1.6s_ease-in-out_infinite]"
            : "animate-[faceNudgeRight_1.6s_ease-in-out_infinite]";
    const arrow = facing === "left" ? "←" : "→";

    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-box bg-base-content/45 text-base-100">
            {facing === "center" ? (
                <>
                    <ScanFace className="h-16 w-16 animate-pulse" aria-hidden="true" />
                    <p className="text-sm font-medium">Posisikan wajah di dalam bingkai</p>
                </>
            ) : (
                <>
                    <span className={`text-5xl font-bold ${position}`} aria-hidden="true">{arrow}</span>
                    <p className="text-sm font-medium">Putar kepala ke {facing === "left" ? "kiri" : "kanan"}</p>
                </>
            )}
        </div>
    );
}

export default function FaceCapture({ purpose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [ready, setReady] = useState(false);
    const [instruction, setInstruction] = useState("");
    const [error, setError] = useState("");
    const [facing, setFacing] = useState("center");

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
        setFacing("center");
        onCapture(null);
        setRecording(true);
        try {
            // Ambil tantangan lebih dulu agar seluruh durasi rekaman bisa menangkap
            // gerakan; frame lama (48 frame) tetap kompatibel dengan batas server.
            const { data: challenge } = await axios.post(route("piket.wajah.challenge"), { purpose });
            const turn = challenge.actions[1] === "left" ? "left" : "right";

            const frames = [];
            const canvas = canvasRef.current;
            canvas.width = 640;
            canvas.height = 480;
            const context = canvas.getContext("2d");

            const captureFor = (ms) => new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (videoRef.current?.videoWidth && frames.length < 48) {
                        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                        frames.push(canvas.toDataURL("image/jpeg", 0.65));
                    }
                }, 100);
                setTimeout(() => { clearInterval(interval); resolve(); }, ms);
            });

            setInstruction("Tatap kamera, lalu kedipkan mata dengan jelas.");
            await captureFor(2600);
            setFacing(turn);
            setInstruction(`Putar kepala Anda ke ${turn === "left" ? "kiri" : "kanan"} dan tahan sebentar.`);
            await captureFor(2600);
            setFacing("center");
            setInstruction("Kembali menatap kamera dan tahan.");
            await captureFor(1600);

            if (frames.length < 12) throw new Error("Rekaman terlalu singkat. Coba lagi.");
            onCapture({ challenge_id: challenge.id, frames });
            setReady(true);
            setInstruction("Rekaman siap. Segera kirim sebelum 90 detik.");
        } catch (err) {
            setFacing("center");
            showError(err.response?.data?.errors?.face?.[0] || err.message);
        } finally {
            setRecording(false);
        }
    };

    return (
        <div className="space-y-3 rounded-box border border-base-300 bg-base-100 p-4">
            <p className="font-medium">Verifikasi wajah</p>
            <p className="text-sm text-base-content/70">Pastikan hanya wajah Anda yang terlihat, lalu ikuti panduan gerakan pada kamera.</p>

            <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-box bg-neutral">
                {cameraOpen ? (
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-content">
                        <ScanFace className="h-12 w-12 opacity-70" aria-hidden="true" />
                        <p className="text-sm">Kamera belum dibuka</p>
                    </div>
                )}

                {cameraOpen && recording && <RecordGuide facing={facing} />}
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
                            Pastikan pencahayaan cukup dan hanya satu wajah terlihat, lalu coba rekam ulang.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
