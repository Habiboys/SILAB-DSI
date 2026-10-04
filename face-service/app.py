import hmac
import os

from flask import Flask, jsonify, request

from recognition import FaceEngine


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024
engine = FaceEngine()


@app.before_request
def authenticate():
    if request.path == "/health":
        return None
    supplied = request.headers.get("Authorization", "")
    expected = "Bearer " + os.environ.get("FACE_SERVICE_TOKEN", "")
    if not os.environ.get("FACE_SERVICE_TOKEN") or not hmac.compare_digest(supplied, expected):
        return jsonify({"success": False, "reason": "unauthorized"}), 401
    return None


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/v1/enroll")
def enroll():
    data = request.get_json(silent=True) or {}
    result = engine.analyze(data.get("frames"), data.get("actions"), enroll=True)
    return jsonify(result), 200 if result["success"] else 422


@app.post("/v1/verify")
def verify():
    data = request.get_json(silent=True) or {}
    result = engine.analyze(data.get("frames"), data.get("actions"), references=data.get("embeddings"))
    return jsonify(result), 200 if result["success"] else 422
