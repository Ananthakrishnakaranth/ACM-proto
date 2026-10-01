import base64
import io
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import exifread
import numpy as np
from PIL import Image, ImageChops, ImageOps

# Software that edits pixel content (as opposed to cameras / phone firmware)
EDITOR_SOFTWARE = {
    "photoshop": "Adobe Photoshop", "lightroom": "Adobe Lightroom", "camera raw": "Adobe Camera Raw",
    "gimp": "GIMP", "affinity": "Affinity Photo", "pixelmator": "Pixelmator", "paint.net": "Paint.NET",
    "snapseed": "Snapseed", "picsart": "PicsArt", "canva": "Canva", "faceapp": "FaceApp", "facetune": "Facetune",
    "remini": "Remini", "lightleap": "Lightleap", "vsco": "VSCO", "meitu": "Meitu", "beautyplus": "BeautyPlus",
    "photo editor": "Photo editor app", "photoeditor": "Photo editor app", "picasa": "Picasa",
    "fotor": "Fotor", "pixlr": "Pixlr", "polarr": "Polarr", "luminar": "Luminar", "capture one": "Capture One",
    "darktable": "darktable", "photopea": "Photopea", "inshot": "InShot", "airbrush": "AirBrush",
}


def _parse_exif_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.strptime(str(value).strip()[:19], "%Y:%m:%d %H:%M:%S")
    except ValueError:
        return None


def _xmp_packet(image_bytes: bytes) -> str:
    start = image_bytes.find(b"<x:xmpmeta")
    if start == -1:
        return ""
    end = image_bytes.find(b"</x:xmpmeta>", start)
    return image_bytes[start:end + 12 if end != -1 else start + 200_000].decode("utf-8", "ignore")


def _signal(source: str, strength: str, title: str, detail: str) -> Dict[str, str]:
    """strength: strong (near-conclusive) | moderate | weak | info (context, not evidence of editing)"""
    return {"source": source, "strength": strength, "title": title, "detail": detail}


def _metadata_signals(image_bytes: bytes, metadata: Dict[str, Any]) -> List[Dict[str, str]]:
    signals = []
    raw = metadata.get("raw_exif_tags") or {}

    # 1. Editing software in the EXIF Software tag
    software = metadata.get("software") or ""
    editor = next((name for key, name in EDITOR_SOFTWARE.items() if key in software.lower()), None)
    if editor:
        signals.append(_signal("metadata", "strong", f"Edited with {editor}",
                               f"The EXIF Software tag records '{software}', which is image-editing software."))

    # 2. XMP edit history (Adobe and many editors write this)
    xmp = _xmp_packet(image_bytes)
    if xmp:
        agents = set(re.findall(r'(?:softwareAgent|CreatorTool)(?:="|>)([^"<]+)', xmp))
        xmp_editor = next((f"{name} ({a})" for a in agents for key, name in EDITOR_SOFTWARE.items() if key in a.lower()), None)
        saves = len(re.findall(r'stEvt:action(?:="|>)saved', xmp))
        if "photoshop:History" in xmp or saves or xmp_editor:
            parts = []
            if xmp_editor:
                parts.append(f"editing tool {xmp_editor}")
            if saves:
                parts.append(f"{saves} recorded save event(s)")
            if "photoshop:History" in xmp:
                parts.append("a Photoshop history log")
            signals.append(_signal("metadata", "strong" if (xmp_editor or saves) else "moderate",
                                   "Edit History in XMP Metadata",
                                   "Embedded XMP metadata contains " + ", ".join(parts or ["edit-history entries"]) + "."))
        if re.search(r'crs:(Exposure2012|Contrast2012|Temperature|Saturation|Clarity2012)', xmp):
            signals.append(_signal("metadata", "moderate", "Raw / Lightroom Adjustments Recorded",
                                   "XMP contains Adobe Camera Raw / Lightroom develop settings (exposure, colour, contrast adjustments)."))

    # 3. Modified date later than capture date
    original = _parse_exif_date(raw.get("DateTimeOriginal") or raw.get("EXIF DateTimeOriginal"))
    modified = _parse_exif_date(raw.get("DateTime") or raw.get("Image DateTime"))
    if original and modified:
        gap = (modified - original).total_seconds()
        if gap > 120:
            hours = gap / 3600
            when = f"{hours / 24:.0f} days" if hours >= 48 else f"{hours:.1f} hours" if hours >= 1 else f"{gap / 60:.0f} minutes"
            signals.append(_signal("metadata", "moderate", "File Modified After Capture",
                                   f"Captured {original:%Y-%m-%d %H:%M} but last modified {modified:%Y-%m-%d %H:%M} ({when} later). "
                                   "Phones write both dates at capture; a later modified date usually means the file was re-saved by an editor."))

    # 4. Embedded EXIF thumbnail no longer matches the main image
    try:
        tags = exifread.process_file(io.BytesIO(image_bytes), details=True)
        thumb_bytes = tags.get("JPEGThumbnail")
        if thumb_bytes:
            thumb = Image.open(io.BytesIO(thumb_bytes)).convert("L")
            main = Image.open(io.BytesIO(image_bytes))
            main = ImageOps.exif_transpose(main).convert("L")
            thumb_ratio, main_ratio = thumb.width / thumb.height, main.width / main.height
            # thumbnails may be stored un-rotated; compare against both orientations
            ratio_ok = min(abs(thumb_ratio - main_ratio), abs(1 / thumb_ratio - main_ratio)) < 0.06
            if not ratio_ok:
                signals.append(_signal("metadata", "strong", "Camera Thumbnail Doesn't Match Image",
                                       f"The thumbnail embedded at capture has a different shape ({thumb.width}x{thumb.height}) than the image "
                                       f"({main.width}x{main.height}). The image was cropped or altered after the thumbnail was written."))
            else:
                if abs(thumb_ratio - main_ratio) >= 0.06:
                    thumb = thumb.transpose(Image.Transpose.ROTATE_90)
                a = thumb.resize((64, 64))
                b = main.resize((64, 64))
                diff = sum(ImageChops.difference(a, b).getdata()) / (64 * 64)
                if diff > 28:
                    signals.append(_signal("metadata", "strong", "Camera Thumbnail Doesn't Match Image",
                                           f"The thumbnail embedded at capture differs visibly from the image content (mean difference {diff:.0f}/255). "
                                           "Editors often change the image without regenerating this thumbnail."))
                else:
                    signals.append(_signal("metadata", "info", "Camera Thumbnail Matches Image",
                                           "The thumbnail written at capture still matches the image, which argues against later cropping or major edits."))
    except Exception:
        pass

    # Context: no metadata means these checks were impossible, not that the image is unedited
    if not metadata.get("has_exif"):
        signals.append(_signal("metadata", "info", "Metadata Checks Not Possible",
                               "The file has no EXIF, so software, date and thumbnail checks could not run. "
                               "Screenshots and images shared through WhatsApp/Instagram are always stripped and re-compressed."))
    return signals


def _jpeg_quality(img: Image.Image) -> Optional[int]:
    """Rough IJG-equivalent quality from the luminance quantization table."""
    q = getattr(img, "quantization", None)
    if not q or 0 not in q:
        return None
    std = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
           14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92,
           49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99]
    table = list(q[0])
    scale = sum(t * 100 / s for t, s in zip(table, std)) / 64
    quality = (200 - scale) / 2 if scale <= 100 else 5000 / scale
    return max(1, min(100, round(quality)))


def _ela(img: Image.Image) -> Dict[str, Any]:
    """Error Level Analysis heatmap: re-save at a known quality and map how much each region changes.
    Pasted, cloned or retouched regions often look uniformly brighter or darker than comparable surroundings.
    Shown for human inspection only - automatic ELA region scoring misfires on ordinary photos (text, edges,
    smooth areas), so it is deliberately not used in the edit verdict."""
    rgb = img.convert("RGB")
    rgb.thumbnail((1200, 1200))
    buf = io.BytesIO()
    rgb.save(buf, "JPEG", quality=90)
    resaved = Image.open(io.BytesIO(buf.getvalue()))
    arr = np.asarray(ImageChops.difference(rgb, resaved).convert("L"), dtype=np.float32)

    # Stretch so the 99th percentile maps to full brightness (raw ELA errors are often < 1 grey level)
    p99 = max(1.0, float(np.percentile(arr, 99)))
    heat = Image.fromarray(np.clip(arr * (255.0 / p99), 0, 255).astype(np.uint8))
    heat = ImageOps.colorize(heat, black="#020617", mid="#0891b2", white="#fde047")
    heat.thumbnail((700, 700))
    out = io.BytesIO()
    heat.save(out, "JPEG", quality=80)
    return {"heatmap": "data:image/jpeg;base64," + base64.b64encode(out.getvalue()).decode()}


def analyze_edits(image_bytes: bytes, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Metadata edit evidence + ELA heatmap. Gemini's visual edit assessment is merged later in combine_edit_analysis()."""
    result: Dict[str, Any] = {"signals": _metadata_signals(image_bytes, metadata)}
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.format == "JPEG":
            result["jpeg_quality"] = _jpeg_quality(img)
        result["ela"] = _ela(img)
    except Exception as e:
        result["ela_error"] = str(e)
    return result


EDIT_TYPE_LABELS = {
    "retouching": "Retouching / beautification", "object_removal": "Object removal / inpainting",
    "splicing": "Splicing / composite", "face_swap": "Face swap", "filter": "Filter / colour grading",
    "crop": "Cropping", "text_overlay": "Text / sticker overlay", "background_change": "Background change",
    "warping": "Warping / reshaping",
}


def combine_edit_analysis(report: Dict[str, Any], local: Optional[Dict[str, Any]], metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Merges local edit evidence with Gemini's edit_probability / edit_types into report['edit_analysis']."""
    local = local or {"signals": []}
    signals = list(local.get("signals", []))

    gemini_prob = report.get("edit_probability")
    try:
        gemini_prob = max(0, min(100, int(float(gemini_prob)))) if gemini_prob is not None else None
    except (TypeError, ValueError):
        gemini_prob = None
    edit_types = [EDIT_TYPE_LABELS.get(t, str(t).replace("_", " ").capitalize()) for t in (report.get("edit_types") or [])]
    for ev in (report.get("edit_evidence") or [])[:4]:
        signals.append({"source": "visual", "strength": "moderate" if (gemini_prob or 0) >= 50 else "weak",
                        "title": "Visual Analysis", "detail": ev})

    strong = [s for s in signals if s["strength"] == "strong"]
    moderate = [s for s in signals if s["strength"] == "moderate" and s["source"] == "metadata"]

    # Score: metadata proof dominates; otherwise Gemini's visual estimate, nudged by the weaker local signals
    if strong:
        score = max(90, gemini_prob or 0)
    else:
        score = gemini_prob if gemini_prob is not None else 20
        score += 25 * len(moderate)
        if moderate:
            score = max(score, 45)  # a metadata trace of re-editing is never "No Editing Detected"
    score = int(max(0, min(100, score)))

    if strong:
        verdict, tone = "Edited", "red"
    elif score >= 70:
        verdict, tone = "Likely Edited", "red"
    elif score >= 40:
        verdict, tone = "Possibly Edited", "amber"
    else:
        verdict, tone = "No Editing Detected", "green"

    if verdict == "No Editing Detected" and not metadata.get("has_exif") and gemini_prob is None:
        verdict, tone = "Undetermined", "grey"

    synthetic = "synthetic" in (report.get("verdict_category") or "").lower()
    note = None
    if synthetic:
        note = "The image itself appears AI-generated, so 'editing' here refers to changes made on top of the generated image."
    elif local.get("jpeg_quality") and not metadata.get("has_exif"):
        note = (f"The file was re-saved (JPEG quality ~{local['jpeg_quality']}) without metadata, which is normal for "
                "shared/downloaded images and is not counted as content editing.")

    report["edit_analysis"] = {
        "verdict": verdict,
        "tone": tone,
        "edit_probability": score,
        "edit_types": edit_types,
        "signals": signals,
        "jpeg_quality": local.get("jpeg_quality"),
        "ela_heatmap": (local.get("ela") or {}).get("heatmap"),
        "note": note,
        "summary": _edit_summary(verdict, strong, edit_types, gemini_prob),
    }
    return report


def _edit_summary(verdict: str, strong: List[Dict[str, str]], edit_types: List[str], gemini_prob: Optional[int]) -> str:
    if strong:
        return "File metadata shows the image was changed after capture: " + "; ".join(s["title"] for s in strong[:3]) + "."
    if verdict in ("Likely Edited", "Possibly Edited"):
        kinds = f" ({', '.join(edit_types[:3])})" if edit_types else ""
        return f"Visual and pixel analysis found signs of editing{kinds}, but no metadata proof."
    if verdict == "Undetermined":
        return "Not enough evidence to judge editing: no metadata and no visual assessment available."
    return "No metadata traces of editing software and no visual signs of manipulation were found."
