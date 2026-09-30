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
                if any(k in lower_val for k in ["prompt", "steps", "sampler", "cfg scale", "seed", "model", "stable diffusion", "midjourney", "comfyui"]):
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
            if "EXIF ExposureTime" in tags:
                metadata["exposure_time"] = str(tags["EXIF ExposureTime"])
            if "EXIF FNumber" in tags:
                metadata["f_number"] = str(tags["EXIF FNumber"])
            if "EXIF ISOSpeedRatings" in tags:
                metadata["iso_speed"] = str(tags["EXIF ISOSpeedRatings"])
            if "EXIF FocalLength" in tags:
                metadata["focal_length"] = str(tags["EXIF FocalLength"])
            if any(k.startswith("GPS") for k in tags):
                metadata["has_gps"] = True
    except Exception:
        pass

    # Heuristic Forensic Evaluation
    # 1. Complete absence of EXIF in realistic photo
    if not metadata["has_exif"]:
        metadata["forensic_flags"].append({
            "id": "missing_exif",
            "severity": "medium",
            "title": "Stripped or Missing EXIF Hardware Tags",
            "detail": "Image contains no camera hardware, lens, shutter, or sensor metadata. Typical of AI generator exports or social media compression."
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
