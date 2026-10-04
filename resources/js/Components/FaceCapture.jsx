import Button from "@/Components/Button";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function FaceCapture({ purpose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [ready, setReady] = useState(false);
    const [instruction, setInstruction] = useState("");

    useEffect(() => {
        if (cameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => toast.error("Kamera tidak dapat diputar."));
        }
    }, [cameraOpen]);

    useEffect(() => () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
    }, []);

    const openCamera = async () => {
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
            setCameraOpen(true);
        } catch {
            toast.error("Kamera tidak tersedia. Periksa izin kamera browser.");
        }
    };

    const record = async () => {
        if (!videoRef.current?.videoWidth) {
            toast.error("Tunggu hingga kamera siap.");
            return;
        }
        setReady(false);
        onCapture(null);
        setRecording(true);
        try {
            const { data: challenge } = await axios.post(route("piket.wajah.challenge"), { purpose });
            setInstruction(`Kedip, lalu putar kepala ke ${challenge.actions[1] === "left" ? "kiri" : "kanan"} Anda.`);
            await new Promise((resolve) => setTimeout(resolve, 1200));
            const frames = [];
            const canvas = canvasRef.current;
            canvas.width = 640;
            canvas.height = 480;
            const context = canvas.getContext("2d");
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (videoRef.current?.videoWidth && frames.length < 48) {
                        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                        frames.push(canvas.toDataURL("image/jpeg", 0.65));
                    }
                }, 100);
                setTimeout(() => { clearInterval(interval); resolve(); }, 4200);
            });
            if (frames.length < 12) throw new Error("Rekaman terlalu singkat. Coba lagi.");
            onCapture({ challenge_id: challenge.id, frames });
            setReady(true);
            setInstruction("Rekaman siap. Segera kirim sebelum 90 detik.");
        } catch (error) {
            toast.error(error.response?.data?.errors?.face?.[0] || error.message || "Perekaman wajah gagal.");
        } finally {
            setRecording(false);
        }
    };

    return (
        <div className="space-y-3 rounded-box border border-base-300 bg-base-100 p-4">
            <p className="font-medium">Verifikasi wajah</p>
            <p className="text-sm text-base-content/70">Pastikan hanya wajah Anda terlihat, lalu ikuti instruksi gerakan yang muncul.</p>
            {cameraOpen && <video ref={videoRef} autoPlay playsInline muted className="aspect-[4/3] w-full max-w-md rounded-box bg-neutral object-cover" />}
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex flex-wrap gap-2">
                {!cameraOpen && <Button type="button" variant="outline" onClick={openCamera}>Buka kamera</Button>}
                {cameraOpen && <Button type="button" variant="outline" onClick={record} loading={recording}>Rekam verifikasi</Button>}
            </div>
            {instruction && <p role="status" className="text-sm text-base-content">{instruction}</p>}
            {ready && <p className="text-sm text-success">Rekaman siap untuk dikirim.</p>}
        </div>
    );
}
