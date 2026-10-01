import base64
import hashlib
import io
import json
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional

import av
from PIL import Image

import ai_detector_service
from edit_service import combine_edit_analysis
from gemini_service import (
    GEMINI_THINKING_BUDGET, HAS_GENAI, MEDIA_DISCLAIMER, _race_models, clean_json_response,
    finalize_media_report, get_api_key
)

if HAS_GENAI:
    from google import genai
    from google.genai import types

FRAME_COUNT = 8
INLINE_VIDEO_LIMIT = 18 * 1024 * 1024  # Gemini inline request limit is ~20 MB; bigger videos are sent as frames
VIDEO_DEADLINE_S = 80

VIDEO_EDITORS = {
    "lavf": "FFmpeg (re-encoded)", "handbrake": "HandBrake", "premiere": "Adobe Premiere", "after effects": "Adobe After Effects",
    "capcut": "CapCut", "inshot": "InShot", "davinci": "DaVinci Resolve", "final cut": "Final Cut Pro", "imovie": "iMovie",
    "kinemaster": "KineMaster", "vn video": "VN Editor", "filmora": "Filmora", "clipchamp": "Clipchamp", "canva": "Canva",
    "vegas": "Vegas Pro", "shotcut": "Shotcut", "openshot": "OpenShot",
}
AI_VIDEO_MARKERS = ["sora", "runway", "pika labs", "google veo", "kling", "luma ai", "dream machine", "hailuo", "synthesia", "heygen"]

VIDEO_PROMPT = """
You are VeriLens, an expert media forensics system analysing a VIDEO for AI generation (Sora, Veo, Kling, Runway, Pika),
deepfakes (face swap, lip-sync / talking-head generation) and editing. Evidence, not verdicts.

Look for:
1. Temporal consistency: objects, hands, text, jewellery, hair or background details that morph, flicker, appear or vanish between frames.
2. Faces: identity drift, warping at the jawline/hairline, unnatural blinking, teeth that blur or change, mouth not matching speech.
3. Physics and motion: impossible movement, floating objects, liquids/cloth behaving wrongly, people walking through things, gliding feet.
4. Rendered look: overly smooth, cinematic, dreamlike camera moves; uniform sharpness; plastic skin; perfect lighting.
5. Real-capture signs: natural camera shake, sensor noise, motion blur, rolling shutter, mundane framing, consistent audio ambience.
6. Editing: cuts, splices, inserted objects, replaced backgrounds, speed changes, overlays (separate from AI generation).

CALIBRATION: missing metadata is neutral (social media strips it). Compression and low resolution are NOT AI signs.
Do not default to "authentic" just because no gross error is visible - a polished, dreamlike clip with no capture artifacts deserves a high ai_probability.
Use timestamps (seconds from start) for every visual finding.

Return ONLY valid JSON:
{
  "ai_probability": 0-100 integer,
  "edit_probability": 0-100 integer,
  "edit_types": [zero or more of "splicing", "face_swap", "lip_sync", "object_removal", "background_change", "speed_change", "text_overlay", "filter"],
  "edit_evidence": ["visible sign of editing with timestamp", "..."],
  "evidence_for_ai": ["...", "..."],
  "evidence_for_real": ["...", "..."],
  "summary": "1-2 sentences",
  "verdict_category": "Likely Synthetic / Generated" | "Potential Manipulation / Inpainting" | "Authentic / Unmodified Characteristics" | "Inconclusive / Heavy Compression",
  "confidence": "High" | "Moderate" | "Low",
  "confidence_explanation": "1-2 sentences",
  "findings": [
    {"id": "str", "label": "short title", "category": "temporal" | "face" | "physics" | "texture" | "lighting" | "audio" | "manipulation" | "metadata",
     "suspicion_level": "high" | "medium" | "low" | "neutral", "timestamp": seconds or null,
     "what_we_found": "1-2 sentences", "why_suspicious": "1-2 sentences", "box_2d": null}
  ],
  "ai_assessment": {"suspected_generator": "e.g. Text-to-video diffusion (Sora/Veo/Kling), Face-swap deepfake, Lip-sync model, or Camera capture"},
  "what_to_check_next": ["step 1", "step 2", "step 3"]
}
Keep it compact: at most 5 findings, at most 4 items per evidence list.
"""


def _probe_and_sample(path: str) -> Dict[str, Any]:
    """Container metadata + FRAME_COUNT evenly spaced frames (as JPEG bytes with timestamps)."""
    info: Dict[str, Any] = {"tags": {}, "frames": []}
    with av.open(path) as container:
        info["tags"] = {k: str(v)[:200] for k, v in (container.metadata or {}).items()}
        info["format"] = container.format.long_name or container.format.name
        duration = (container.duration or 0) / 1_000_000
        stream = next((s for s in container.streams if s.type == "video"), None)
        if stream is None:
            raise ValueError("No video stream found in file")
        info["has_audio"] = any(s.type == "audio" for s in container.streams)
        info["codec"] = stream.codec_context.name
        info["width"], info["height"] = stream.codec_context.width, stream.codec_context.height
        info["fps"] = round(float(stream.average_rate), 2) if stream.average_rate else None
        if not duration and stream.duration and stream.time_base:
            duration = float(stream.duration * stream.time_base)
        info["duration_s"] = round(duration, 2)
        for k, v in (stream.metadata or {}).items():
            info["tags"].setdefault(f"video:{k}", str(v)[:200])

        targets = [duration * (i + 0.5) / FRAME_COUNT for i in range(FRAME_COUNT)] if duration else [0]
        for t in targets:
            try:
                container.seek(int(t / stream.time_base), stream=stream, any_frame=False, backward=True)
                for frame in container.decode(stream):
                    ft = float(frame.pts * stream.time_base) if frame.pts is not None else t
                    if ft + 0.05 >= t or not duration:
                        img = frame.to_image().convert("RGB")
                        img.thumbnail((768, 768))
                        buf = io.BytesIO()
                        img.save(buf, "JPEG", quality=85)
                        info["frames"].append({"t": round(ft, 2), "jpeg": buf.getvalue()})
                        break
            except Exception as e:
                print(f"Frame extraction at {t:.1f}s failed: {e}")
    return info


def _video_metadata(info: Dict[str, Any], video_bytes: bytes, filename: str) -> Dict[str, Any]:
    tags = info["tags"]
    lower = {k.lower(): v for k, v in tags.items()}
    make = lower.get("com.apple.quicktime.make") or lower.get("com.android.manufacturer") or lower.get("make")
    model = lower.get("com.apple.quicktime.model") or lower.get("com.android.model") or lower.get("model")
    encoder = lower.get("encoder") or lower.get("video:encoder") or lower.get("com.apple.quicktime.software") or lower.get("software")
    flags = []
    if b"trainedAlgorithmicMedia" in video_bytes:
        flags.append({"id": "c2pa_ai_source", "severity": "high", "title": "C2PA Content Credential: AI-Generated Source",
                      "detail": "Embedded C2PA manifest declares digitalSourceType 'trainedAlgorithmicMedia'."})
    tag_text = " ".join(f"{k} {v}" for k, v in tags.items()).lower()
    ai_marker = next((m for m in AI_VIDEO_MARKERS if m in tag_text), None)
    return {
        "filename": filename,
        "file_size_kb": round(len(video_bytes) / 1024, 2),
        "md5_hash": hashlib.md5(video_bytes).hexdigest(),
        "format": info.get("format"),
        "codec": info.get("codec"),
        "dimensions": {"width": info.get("width"), "height": info.get("height")},
        "duration_s": info.get("duration_s"),
        "fps": info.get("fps"),
        "has_audio": info.get("has_audio"),
        "camera_make": make,
        "camera_model": model,
        "software": f"{ai_marker} (AI video tool)" if ai_marker else encoder,
        "date_time_original": lower.get("creation_time") or lower.get("com.apple.quicktime.creationdate"),
        "has_gps": any("location" in k for k in lower),
        "has_exif": bool(make or model or lower.get("creation_time")),
        "raw_exif_tags": tags,
        "forensic_flags": flags,
    }


def _edit_signals(metadata: Dict[str, Any]) -> List[Dict[str, str]]:
    signals = []
    software = (metadata.get("software") or "").lower()
    editor = next((name for key, name in VIDEO_EDITORS.items() if key in software), None)
    if editor and editor.startswith("FFmpeg"):
        signals.append({"source": "metadata", "strength": "info", "title": "Re-encoded With FFmpeg",
                        "detail": "The encoder tag is FFmpeg/Lavf. Common for downloaded, converted or social-media videos; not proof of content editing."})
    elif editor:
        signals.append({"source": "metadata", "strength": "strong", "title": f"Exported From {editor}",
                        "detail": f"The encoder tag records '{metadata.get('software')}', which is video-editing software."})
    if not metadata.get("has_exif"):
        signals.append({"source": "metadata", "strength": "info", "title": "No Recording-Device Metadata",
                        "detail": "No camera make/model or creation time. Normal for videos shared through social media or messaging apps."})
    return signals


def _gemini_video(video_bytes: bytes, mime: str, frames: List[Dict[str, Any]], metadata: Dict[str, Any], api_key: str):
    client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=70_000))
    meta = {k: v for k, v in metadata.items() if k not in ("raw_exif_tags", "md5_hash")}
    contents: List[Any] = [VIDEO_PROMPT, f"Container metadata:\n{json.dumps(meta, indent=1, default=str)}"]
    if len(video_bytes) <= INLINE_VIDEO_LIMIT:
        contents.append(types.Part.from_bytes(data=video_bytes, mime_type=mime or "video/mp4"))
        mode = "full video"
    else:
        for f in frames:
            contents += [f"Frame at {f['t']}s:", types.Part.from_bytes(data=f["jpeg"], mime_type="image/jpeg")]
        mode = f"{len(frames)} sampled frames (video larger than 18 MB)"
    config = types.GenerateContentConfig(response_mime_type="application/json", temperature=0.2,
                                         thinking_config=types.ThinkingConfig(thinking_budget=GEMINI_THINKING_BUDGET))

    def call(model_name: str) -> Dict[str, Any]:
        response = client.models.generate_content(model=model_name, contents=contents, config=config)
        if not (response and response.text):
            raise ValueError(f"{model_name} returned an empty response")
        return clean_json_response(response.text)

    parsed, model = _race_models(call, ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest"], VIDEO_DEADLINE_S)
    parsed["gemini_model"] = model
    parsed["gemini_input"] = mode
    return parsed


def _detect_frames(frames: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    scores = []
    for f in frames:
        det = ai_detector_service.detect(f["jpeg"])
        if det:
            f["ai_score"] = det["ai_score"]
            scores.append(det)
    if not scores:
        return None
    values = sorted((d["ai_score"] for d in scores), reverse=True)
    top_half = values[:max(1, len(values) // 2)]
    return {
        # mean of the most suspicious half: a deepfake may only affect part of the clip
        "ai_score": round(sum(top_half) / len(top_half), 4),
        "model": scores[0]["model"],
        "labels": {"frames_scored": len(scores), "max": values[0], "min": values[-1]},
        "seconds": round(sum(d["seconds"] for d in scores), 2),
    }


def analyze_video(video_bytes: bytes, filename: str, mime: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    suffix = os.path.splitext(filename or "")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(video_bytes)
        path = tmp.name
    try:
        info = _probe_and_sample(path)
    finally:
        os.unlink(path)
    frames = info["frames"]
    if not frames:
        raise ValueError("Could not decode any frames from this video")
    metadata = _video_metadata(info, video_bytes, filename)

    resolved_key = get_api_key(api_key)
    with ThreadPoolExecutor(max_workers=2) as pool:
        det_future = pool.submit(_detect_frames, frames)
        gemini_error = None
        parsed = None
        if resolved_key and HAS_GENAI:
            try:
                parsed = _gemini_video(video_bytes, mime, frames, metadata, resolved_key)
            except Exception as e:
                gemini_error = str(e)[:300]
                print(f"Gemini video analysis failed: {e}")
        detector = det_future.result()

    if parsed is not None:
        report = finalize_media_report(parsed, metadata, detector=detector)
    else:
        report = {
            "summary": "Gemini video analysis was unavailable; the verdict is based on per-frame neural detection and container metadata.",
            "verdict_category": "Inconclusive / Heavy Compression", "confidence": "Low", "findings": [],
            "what_to_check_next": ["Re-run when Gemini is available for temporal (motion and lip-sync) analysis.",
                                   "Look for flickering or morphing details between frames.",
                                   "Search for the original upload of this clip."],
        }
        report = finalize_media_report(report, metadata, detector=detector, use_model_probability=False) if detector else report
        report["api_notice"] = "Gemini video analysis " + (f"unavailable ({gemini_error})." if gemini_error else "skipped: no valid Gemini API key.")
    report.setdefault("disclaimer", MEDIA_DISCLAIMER)
    combine_edit_analysis(report, {"signals": _edit_signals(metadata)}, metadata)

    report["frames"] = [{"t": f["t"], "ai_score": f.get("ai_score"),
                         "image": "data:image/jpeg;base64," + base64.b64encode(f["jpeg"]).decode()} for f in frames]
    return {"filename": filename, "metadata": metadata, "report": report}
