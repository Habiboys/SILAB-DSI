FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    HOME=/opt/model-home \
    FACE_LANDMARKER_MODEL=/opt/models/face_landmarker.task

RUN apt-get update && apt-get install -y --no-install-recommends curl libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home face \
    && mkdir -p /opt/models /opt/model-home \
    && chown -R face:face /app /opt/models /opt/model-home

USER face
RUN curl -fL --retry 3 -o /opt/models/face_landmarker.task \
       https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task \
    && python -c "from keras_facenet import FaceNet; FaceNet()"

COPY --chown=face:face app.py recognition.py ./

EXPOSE 5000
CMD ["gunicorn", "--workers", "1", "--threads", "1", "--timeout", "45", "--bind", "0.0.0.0:5000", "app:app"]
