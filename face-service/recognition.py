"""FaceNet matching — sama dengan github.com/Benni2013/api-piket.

Tanpa liveness. Deteksi wajah pakai Haar cascade (bukan MTCNN agar hemat memori
dan cepat), lalu ekstrak embedding FaceNet 512-dimensi secara BATCH, dan
cocokkan dengan cosine similarity.
"""

import base64
import math
import os

import cv2
import numpy as np
from keras_facenet import FaceNet


class FaceEngine:
    def __init__(self):
        self.embedder = FaceNet()
        self.cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
        # Warm-up: trace graph TensorFlow/XNNPACK sekali saat boot, supaya request
        # pertama tidak kena penalti ~6-7 detik.
        try:
            dummy = np.zeros((160, 160, 3), dtype=np.uint8)
            self.embedder.embeddings([dummy])
        except Exception:
            pass

    def decode(self, value):
        try:
            payload = value.split(",", 1)[-1]
            raw = base64.b64decode(payload, validate=True)
            if len(raw) > 400_000:
                return None
            image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
            if image is None or max(image.shape[:2]) > 1280:
                return None
            return image
        except (ValueError, base64.binascii.Error, cv2.error):
            return None

    def detect_face(self, image):
        """Kembalikan crop wajah terbesar (RGB), atau None jika tak ada wajah."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.cascade.detectMultiScale(gray, 1.1, 4)
        if len(faces) == 0:
            return None
        x, y, width, height = max(faces, key=lambda rect: rect[2] * rect[3])
        crop = image[y:y + height, x:x + width]
        return cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)

    def analyze(self, frames, actions=None, references=None, enroll=False):
        if not isinstance(frames, list) or not 12 <= len(frames) <= 48:
            return {"success": False, "reason": "invalid_frames"}

        crops = []
        selected_index = None
        for index, frame in enumerate(frames):
            image = self.decode(frame) if isinstance(frame, str) else None
            if image is None:
                continue
            crop = self.detect_face(image)
            if crop is None:
                continue
            if selected_index is None:
                selected_index = index
            crops.append(crop)
            if len(crops) >= 10:
                break

        if not crops:
            return {"success": False, "reason": "embedding_failed"}

        # Satu kali model.predict untuk semua crop (lebih cepat daripada per-frame).
        try:
            vectors = self.embedder.embeddings(crops)
        except (ValueError, cv2.error):
            return {"success": False, "reason": "embedding_failed"}

        vectors = [np.asarray(v, dtype=np.float32) for v in vectors]

        if enroll:
            if len(vectors) < 5:
                return {"success": False, "reason": "insufficient_samples"}
            return {"success": True, "embeddings": [v.tolist() for v in vectors], "evidence_index": selected_index}

        if not isinstance(references, list) or not references:
            return {"success": False, "reason": "not_enrolled"}

        try:
            stored = [np.asarray(v, dtype=np.float32) for v in references]
            if any(v.shape != (512,) for v in stored):
                return {"success": False, "reason": "invalid_reference"}
            norms = [(c, float(np.linalg.norm(c))) for c in vectors]
            references_with_norms = [(v, float(np.linalg.norm(v))) for v in stored]
            scores = [float(np.dot(c, v) / (cn * vn))
                      for c, cn in norms for v, vn in references_with_norms
                      if cn > 0 and vn > 0]
            score = max((value for value in scores if math.isfinite(value)), default=-1.0)
        except (ValueError, TypeError, ZeroDivisionError):
            return {"success": False, "reason": "invalid_reference"}

        threshold = float(os.getenv("FACE_SIMILARITY_THRESHOLD", "0.70"))
        return {"success": score >= threshold, "reason": "matched" if score >= threshold else "face_mismatch",
                "similarity": round(score, 4), "evidence_index": selected_index}
