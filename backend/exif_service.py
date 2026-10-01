import io
import hashlib
from typing import Dict, Any, List
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import exifread

def extract_image_metadata(image_bytes: bytes, filename: str = "upload.jpg") -> Dict[str, Any]:
    """
    Extracts deep metadata from an image using Pillow and exifread,
    including EXIF tags, PNG textual chunks, format properties,
    and suspicious heuristic markers (e.g. AI generator signatures).
    """
    md5_hash = hashlib.md5(image_bytes).hexdigest()
    file_size_kb = round(len(image_bytes) / 1024, 2)
    
    metadata: Dict[str, Any] = {
        "filename": filename,
        "file_size_kb": file_size_kb,
        "md5_hash": md5_hash,
        "format": "Unknown",
        "mime_type": "image/jpeg",
        "dimensions": None,
        "aspect_ratio": None,
        "color_mode": None,
        "has_exif": False,
        "camera_make": None,
        "camera_model": None,
        "software": None,
        "date_time_original": None,
        "date_time_digitized": None,
        "exposure_time": None,
        "f_number": None,
        "iso_speed": None,
        "focal_length": None,
        "lens_model": None,
        "has_gps": False,
        "png_info": {},
        "raw_exif_tags": {},
        "forensic_flags": []
    }

    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        metadata["format"] = pil_img.format or "JPEG"
        metadata["mime_type"] = Image.MIME.get(pil_img.format, "image/jpeg")
        metadata["dimensions"] = {"width": pil_img.width, "height": pil_img.height}
        metadata["color_mode"] = pil_img.mode
        
        # Calculate aspect ratio
        if pil_img.height > 0:
            ratio = round(pil_img.width / pil_img.height, 3)
            metadata["aspect_ratio"] = f"{ratio} ({pil_img.width}:{pil_img.height})"

        # Check for PNG textual chunks (often contains Stable Diffusion, ComfyUI, DALL-E, Midjourney prompts)
        if hasattr(pil_img, "text") and pil_img.text:
            metadata["png_info"] = dict(pil_img.text)
            for key, val in pil_img.text.items():
                lower_val = str(val).lower()
                # A1111 writes a "parameters" chunk, ComfyUI writes "prompt"/"workflow" chunks
                generator_chunk = key.lower() in ("parameters", "prompt", "workflow", "dream", "sd-metadata")
                generator_text = any(k in lower_val for k in ["negative prompt", "sampler", "cfg scale", "stable diffusion", "midjourney", "comfyui", "novelai"])
                if generator_chunk or generator_text:
                    metadata["forensic_flags"].append({
                        "id": "png_ai_generation_chunks",
                        "severity": "high",
                        "title": f"Generative AI Metadata Chunk Found ({key})",
                        "detail": f"Embedded generation parameters discovered in PNG metadata: '{str(val)[:120]}...'"
                    })

        # Pillow EXIF extraction
        exif_data = pil_img.getexif()
        if exif_data:
            metadata["has_exif"] = True
            for tag_id, value in exif_data.items():
                tag_name = TAGS.get(tag_id, str(tag_id))
                clean_val = str(value).strip('\x00')
                metadata["raw_exif_tags"][tag_name] = clean_val
                
                if tag_name == "Make":
                    metadata["camera_make"] = clean_val
                elif tag_name == "Model":
                    metadata["camera_model"] = clean_val
                elif tag_name == "Software":
                    metadata["software"] = clean_val
                elif tag_name in ("DateTime", "DateTimeOriginal"):
                    metadata["date_time_original"] = clean_val
                elif tag_name == "DateTimeDigitized":
                    metadata["date_time_digitized"] = clean_val
                elif tag_name == "LensModel":
                    metadata["lens_model"] = clean_val

            # getexif() only returns IFD0 (Make/Model/DateTime). Capture settings live in the
            # Exif sub-IFD and location in the GPS IFD, so read those explicitly.
            exif_ifd = exif_data.get_ifd(0x8769)
            for tag_id, value in exif_ifd.items():
                tag_name = TAGS.get(tag_id, str(tag_id))
                if tag_name in ("MakerNote", "UserComment"):
                    metadata["raw_exif_tags"][tag_name] = f"<{len(value) if hasattr(value, '__len__') else '?'} bytes>"
                    continue
                metadata["raw_exif_tags"][tag_name] = str(value).strip('\x00')[:200]
            metadata["exif_ifd_tag_count"] = len(exif_ifd)

            def _num(v):
                if isinstance(v, (tuple, list)):
                    v = v[0] if len(v) == 1 else (v[0] / v[1] if len(v) == 2 and v[1] else None)
                try:
                    return float(v)
                except (TypeError, ValueError, ZeroDivisionError):
                    return None

            if exif_ifd.get(0x829A) is not None:  # ExposureTime
                t = _num(exif_ifd[0x829A])
                metadata["exposure_time"] = (f"1/{round(1 / t)}" if t and t < 1 else str(t)) if t else str(exif_ifd[0x829A])
            if exif_ifd.get(0x829D) is not None:  # FNumber
                f = _num(exif_ifd[0x829D])
                metadata["f_number"] = f"f/{f:g}" if f else str(exif_ifd[0x829D])
            if exif_ifd.get(0x8827) is not None:  # ISOSpeedRatings / PhotographicSensitivity
                iso = exif_ifd[0x8827]
                metadata["iso_speed"] = str(iso[0] if isinstance(iso, (tuple, list)) else iso)
            if exif_ifd.get(0x920A) is not None:  # FocalLength
                fl = _num(exif_ifd[0x920A])
                metadata["focal_length"] = f"{fl:g} mm" if fl else str(exif_ifd[0x920A])
            if exif_ifd.get(0x9003):  # DateTimeOriginal
                metadata["date_time_original"] = str(exif_ifd[0x9003]).strip('\x00')
            if exif_ifd.get(0x9004):  # DateTimeDigitized
                metadata["date_time_digitized"] = str(exif_ifd[0x9004]).strip('\x00')
            if exif_ifd.get(0xA434):  # LensModel
                metadata["lens_model"] = str(exif_ifd[0xA434]).strip('\x00')
            if exif_data.get_ifd(0x8825):
                metadata["has_gps"] = True

    except Exception as e:
        metadata["forensic_flags"].append({
            "id": "corrupt_header_parse_warning",
            "severity": "medium",
            "title": "Header Inspection Notice",
            "detail": f"Failed standard Pillow parse: {str(e)}"
        })

    # Detailed exifread analysis
    try:
        bio = io.BytesIO(image_bytes)
        tags = exifread.process_file(bio, details=False)
        if tags:
            metadata["has_exif"] = True
            for k, v in tags.items():
                if k not in metadata["raw_exif_tags"]:
                    metadata["raw_exif_tags"][k] = str(v)
            
            if "Image Make" in tags and not metadata["camera_make"]:
                metadata["camera_make"] = str(tags["Image Make"])
            if "Image Model" in tags and not metadata["camera_model"]:
                metadata["camera_model"] = str(tags["Image Model"])
            if "Image Software" in tags and not metadata["software"]:
                metadata["software"] = str(tags["Image Software"])
            if "EXIF DateTimeOriginal" in tags and not metadata["date_time_original"]:
                metadata["date_time_original"] = str(tags["EXIF DateTimeOriginal"])
            # Only fill gaps: the Pillow sub-IFD values above are already formatted
            if "EXIF ExposureTime" in tags and not metadata["exposure_time"]:
                metadata["exposure_time"] = str(tags["EXIF ExposureTime"])
            if "EXIF FNumber" in tags and not metadata["f_number"]:
                metadata["f_number"] = str(tags["EXIF FNumber"])
            if "EXIF ISOSpeedRatings" in tags and not metadata["iso_speed"]:
                metadata["iso_speed"] = str(tags["EXIF ISOSpeedRatings"])
            if "EXIF FocalLength" in tags and not metadata["focal_length"]:
                metadata["focal_length"] = str(tags["EXIF FocalLength"])
            if any(k.startswith("GPS") for k in tags):
                metadata["has_gps"] = True
    except Exception:
        pass

    # Heuristic Forensic Evaluation
    # 0. C2PA Content Credentials declaring AI generation (OpenAI, Adobe Firefly, Google, Microsoft)
    if b"trainedAlgorithmicMedia" in image_bytes:
        metadata["forensic_flags"].append({
            "id": "c2pa_ai_source",
            "severity": "high",
            "title": "C2PA Content Credential: AI-Generated Source",
            "detail": "Embedded C2PA manifest declares digitalSourceType 'trainedAlgorithmicMedia', written by AI image generators."
        })

    # 1. Complete absence of EXIF in realistic photo
    if not metadata["has_exif"]:
        metadata["forensic_flags"].append({
            "id": "missing_exif",
            "severity": "low",
            "title": "No EXIF Hardware Tags",
            "detail": "Image contains no camera hardware, lens, shutter, or sensor metadata. Normal for screenshots and social media / messaging downloads; not evidence of AI on its own."
        })
    else:
        # 2. Check for software editing signatures
        soft = (metadata["software"] or "").lower()
        editing_tools = ["photoshop", "gimp", "canva", "faceapp", "remini", "snapseed", "picsart", "lightroom", "midjourney"]
        for tool in editing_tools:
            if tool in soft:
                metadata["forensic_flags"].append({
                    "id": f"software_editing_{tool}",
                    "severity": "high" if tool in ["faceapp", "remini", "photoshop"] else "medium",
                    "title": f"Editing Software Signature Detected ({metadata['software']})",
                    "detail": f"Metadata explicitly records post-processing by '{metadata['software']}'."
                })

    # 2b. Camera make/model with no capture telemetry at all: real cameras and phones fill the Exif
    # sub-IFD with dozens of tags (exposure, focal length, flash, etc.), so a bare Make/Model in IFD0
    # is typical of hand-written (forged) EXIF
    has_capture_data = any(metadata[k] for k in ("exposure_time", "f_number", "iso_speed", "focal_length")) \
        or metadata["has_gps"] or metadata.get("exif_ifd_tag_count", 0) >= 5
    if (metadata["camera_make"] or metadata["camera_model"]) and not has_capture_data:
        metadata["forensic_flags"].append({
            "id": "sparse_camera_exif",
            "severity": "medium",
            "title": "Camera Tags Without Capture Data",
            "detail": "EXIF names a camera but has no exposure, focal length, GPS or other capture tags. Genuine camera files always include these, so the camera tags may have been added afterwards."
        })

    # 3. Common AI generation square resolutions
    dims = metadata["dimensions"]
    if dims:
        w, h = dims["width"], dims["height"]
        if (w, h) in [(512, 512), (1024, 1024), (768, 768), (1024, 1536), (1536, 1024), (896, 1152), (1152, 896)]:
            metadata["forensic_flags"].append({
                "id": "standard_diffusion_aspect_ratio",
                "severity": "low",
                "title": f"Common Generative Canvas Dimension ({w}x{h})",
                "detail": f"Resolution matches standard default generation aspect ratio presets used in modern diffusion models."
            })

    return metadata
