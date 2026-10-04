"""FaceNet matching adapted with permission from github.com/Benni2013/api-piket."""

import base64
import math
import os

import cv2
import mediapipe as mp
import numpy as np
from keras_facenet import FaceNet


class FaceEngine:
    def __init__(self):
        self.embedder = FaceNet()
        options = mp.tasks.vision.FaceLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=os.environ["FACE_LANDMARKER_MODEL"]),
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            num_faces=2,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
        )
        self.landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(options)
        self.cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")

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

    def face_embedding(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.cascade.detectMultiScale(gray, 1.1, 4)
        if len(faces) != 1:
            return None
        x, y, width, height = faces[0]
        crop = image[y:y + height, x:x + width]
        try:
            found = self.embedder.extract(crop, threshold=0.95)
            if len(found) != 1:
                found = self.embedder.extract(image, threshold=0.95)
            return found[0]["embedding"] if len(found) == 1 else None
        except (ValueError, cv2.error):
            return None

    def signals(self, image):
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        result = self.landmarker.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
        if len(result.face_landmarks) != 1 or len(result.face_blendshapes) != 1 or len(result.facial_transformation_matrixes) != 1:
            return None
        blend = {item.category_name: item.score for item in result.face_blendshapes[0]}
        blink = min(blend.get("eyeBlinkLeft", 0), blend.get("eyeBlinkRight", 0))
        matrix = result.facial_transformation_matrixes[0]
        yaw = math.degrees(math.atan2(float(matrix[0, 2]), float(matrix[2, 2])))
        return (blink, yaw) if math.isfinite(yaw) else None

    def liveness(self, readings, actions):
        if not isinstance(actions, list) or len(actions) != 2 or actions[0] != "blink" or actions[1] not in ("left", "right"):
            return False
        stage = "open"
        closed_count = turn_count = 0
        for blink, yaw in readings:
            if stage == "open" and blink < 0.25:
                stage = "closed"
            elif stage == "closed":
                closed_count = closed_count + 1 if blink >= 0.6 else 0
                if closed_count >= 2:
                    stage = "reopen"
            elif stage == "reopen" and blink < 0.25:
                stage = "turn"
            elif stage == "turn":
                direction_ok = yaw <= -15 if actions[1] == "left" else yaw >= 15
                turn_count = turn_count + 1 if direction_ok else 0
                if turn_count >= 2:
                    return True
        return False

    def analyze(self, frames, actions, references=None, enroll=False):
        if not isinstance(frames, list) or not 12 <= len(frames) <= 48:
            return {"success": False, "reason": "invalid_frames"}
        images = []
        readings = []
        for frame in frames:
            image = self.decode(frame) if isinstance(frame, str) else None
            if image is None:
                return {"success": False, "reason": "invalid_image"}
            signal = self.signals(image)
            if signal is None:
                return {"success": False, "reason": "face_count"}
            images.append(image)
            readings.append(signal)
        if not self.liveness(readings, actions):
            return {"success": False, "reason": "liveness_failed"}

        candidate_indices = [i for i, (blink, yaw) in enumerate(readings) if blink < 0.25 and abs(yaw) < 15]
        embeddings = []
        selected_index = None
        for index in candidate_indices[::max(1, len(candidate_indices) // 10)]:
            embedding = self.face_embedding(images[index])
            if embedding is not None:
                embeddings.append(embedding)
                selected_index = index
            if len(embeddings) >= 10:
                break
        if not embeddings:
            return {"success": False, "reason": "embedding_failed"}

        if enroll:
            if len(embeddings) < 5:
                return {"success": False, "reason": "insufficient_samples"}
            return {"success": True, "embeddings": [vector.tolist() for vector in embeddings], "evidence_index": selected_index}

        if not isinstance(references, list) or not references:
            return {"success": False, "reason": "not_enrolled"}
        try:
            stored = [np.asarray(vector, dtype=np.float32) for vector in references]
            if any(vector.shape != (512,) for vector in stored):
                return {"success": False, "reason": "invalid_reference"}
            norms = [(candidate, float(np.linalg.norm(candidate))) for candidate in embeddings]
            references_with_norms = [(vector, float(np.linalg.norm(vector))) for vector in stored]
            scores = [float(np.dot(candidate, vector) / (candidate_norm * vector_norm))
                      for candidate, candidate_norm in norms for vector, vector_norm in references_with_norms
                      if candidate_norm > 0 and vector_norm > 0]
            score = max((value for value in scores if math.isfinite(value)), default=-1.0)
        except (ValueError, TypeError, ZeroDivisionError):
            return {"success": False, "reason": "invalid_reference"}
        threshold = float(os.getenv("FACE_SIMILARITY_THRESHOLD", "0.70"))
        return {"success": score >= threshold, "reason": "matched" if score >= threshold else "face_mismatch",
                "similarity": round(score, 4), "evidence_index": selected_index}
