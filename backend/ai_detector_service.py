import io
import os
import threading
import time
from typing import Any, Dict, Optional

from PIL import Image

# Model weights download over HTTPS; trust the OS store (antivirus / proxy TLS inspection)
try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass

# Local neural AI-image detector (Hugging Face image-classification model).
# Optional: if torch/transformers are not installed or the model fails to load,
# detect() returns None and the rest of the pipeline works without it.
DEFAULT_MODEL = "haywoodsloan/ai-image-detector-deploy"
MODEL_NAME = os.getenv("AI_DETECTOR_MODEL", DEFAULT_MODEL)
ENABLED = os.getenv("AI_DETECTOR_ENABLED", "true").lower() not in ("0", "false", "no")

AI_LABEL_HINTS = ("artificial", "fake", "ai", "synthetic", "generated")

_classifier = None
_load_error: Optional[str] = None
_lock = threading.Lock()


def _load():
    global _classifier, _load_error
    with _lock:
        if _classifier is not None or _load_error is not None:
            return
        try:
            from transformers import pipeline
            started = time.time()
            _classifier = pipeline("image-classification", model=MODEL_NAME, device=-1)
            print(f"AI detector '{MODEL_NAME}' loaded in {time.time() - started:.1f}s")
        except Exception as e:
            _load_error = str(e)
            print(f"AI detector unavailable ({MODEL_NAME}): {e}")


def preload_in_background():
    """Start loading the model at server startup so the first upload doesn't wait for it."""
    if ENABLED:
        threading.Thread(target=_load, daemon=True).start()


def status() -> Dict[str, Any]:
    return {
        "enabled": ENABLED,
        "model": MODEL_NAME,
        "loaded": _classifier is not None,
        "error": _load_error,
    }


def _ai_score(predictions) -> float:
    for p in predictions:
        label = p["label"].lower()
        if label in AI_LABEL_HINTS or any(h in label for h in ("artificial", "fake", "synthetic", "generated")):
            return float(p["score"])
    # Binary model whose AI label wasn't recognised: treat the top non-real label as AI
    real = next((p for p in predictions if p["label"].lower() in ("real", "human", "hum", "authentic")), None)
    return 1.0 - float(real["score"]) if real else 0.5


def detect(image_bytes: bytes) -> Optional[Dict[str, Any]]:
    """Returns {"ai_score": 0-1, "model": ..., "labels": {...}, "seconds": ...} or None."""
    if not ENABLED:
        return None
    _load()
    if _classifier is None:
        return None
    try:
        started = time.time()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        predictions = _classifier(image, top_k=None)
        return {
            "ai_score": round(_ai_score(predictions), 4),
            "model": MODEL_NAME,
            "labels": {p["label"]: round(float(p["score"]), 4) for p in predictions},
            "seconds": round(time.time() - started, 2),
        }
    except Exception as e:
        print(f"AI detector inference failed: {e}")
        return None
