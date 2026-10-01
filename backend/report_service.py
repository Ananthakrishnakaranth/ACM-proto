import base64
import io
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image as RLImage, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
)

# Fonts: Arial (Windows) covers far more Unicode than the built-in Helvetica; fall back if missing
FONT, FONT_BOLD = "Helvetica", "Helvetica-Bold"
_WIN_FONTS = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
try:
    pdfmetrics.registerFont(TTFont("Arial", os.path.join(_WIN_FONTS, "arial.ttf")))
    pdfmetrics.registerFont(TTFont("Arial-Bold", os.path.join(_WIN_FONTS, "arialbd.ttf")))
    FONT, FONT_BOLD = "Arial", "Arial-Bold"
except Exception:
    pass

INK = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#64748b")
RULE = colors.HexColor("#e2e8f0")
PANEL = colors.HexColor("#f8fafc")
ACCENT = colors.HexColor("#0891b2")

VERDICT_COLORS = {
    "red": (colors.HexColor("#fef2f2"), colors.HexColor("#b91c1c")),
    "amber": (colors.HexColor("#fffbeb"), colors.HexColor("#b45309")),
    "green": (colors.HexColor("#f0fdf4"), colors.HexColor("#15803d")),
    "grey": (colors.HexColor("#f1f5f9"), colors.HexColor("#475569")),
}
LEVEL_COLORS = {
    "high": colors.HexColor("#b91c1c"),
    "medium": colors.HexColor("#b45309"),
    "low": colors.HexColor("#0369a1"),
    "neutral": colors.HexColor("#475569"),
}
BOX_RGB = {"high": (220, 38, 38), "medium": (217, 119, 6), "low": (2, 132, 199), "neutral": (71, 85, 105)}

styles = {
    "title": ParagraphStyle("title", fontName=FONT_BOLD, fontSize=18, leading=22, textColor=INK),
    "subtitle": ParagraphStyle("subtitle", fontName=FONT, fontSize=9, leading=12, textColor=MUTED),
    "h2": ParagraphStyle("h2", fontName=FONT_BOLD, fontSize=12, leading=15, textColor=INK, spaceBefore=10, spaceAfter=5),
    "body": ParagraphStyle("body", fontName=FONT, fontSize=9.5, leading=13.5, textColor=INK, alignment=TA_LEFT),
    "small": ParagraphStyle("small", fontName=FONT, fontSize=8.5, leading=11.5, textColor=MUTED),
    "label": ParagraphStyle("label", fontName=FONT_BOLD, fontSize=8, leading=10, textColor=MUTED),
    "cell": ParagraphStyle("cell", fontName=FONT, fontSize=8.5, leading=11, textColor=INK),
    "cell_bold": ParagraphStyle("cell_bold", fontName=FONT_BOLD, fontSize=8.5, leading=11, textColor=INK),
    "verdict": ParagraphStyle("verdict", fontName=FONT_BOLD, fontSize=15, leading=19),
    "finding_title": ParagraphStyle("finding_title", fontName=FONT_BOLD, fontSize=10, leading=13, textColor=INK),
}


def _p(text: Any, style: str = "body") -> Paragraph:
    return Paragraph(escape(str(text if text is not None else "")).replace("\n", "<br/>"), styles[style])


def _verdict_tone(verdict: str) -> str:
    v = (verdict or "").lower()
    if "possibly" in v or "manipulation" in v or "inpainting" in v:
        return "amber"
    if "synthetic" in v or "generated" in v:
        return "red"
    if "authentic" in v or "unmodified" in v:
        return "green"
    return "grey"


def _decode_image(image_data_url: Optional[str]) -> Optional[Image.Image]:
    if not image_data_url:
        return None
    try:
        data = image_data_url.split(",", 1)[1] if "," in image_data_url else image_data_url
        return Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")
    except Exception:
        return None


def _annotated_image(img: Image.Image, findings: List[Dict[str, Any]]) -> Image.Image:
    """Draws the finding regions (box_2d = [ymin, xmin, ymax, xmax] on a 0-1000 scale) onto the image."""
    img = img.copy()
    img.thumbnail((1400, 1400))
    draw = ImageDraw.Draw(img)
    w, h = img.size
    stroke = max(2, round(min(w, h) / 220))
    tag = max(18, round(min(w, h) / 28))
    try:
        font = ImageFont.truetype(os.path.join(_WIN_FONTS, "arialbd.ttf"), round(tag * 0.75))
    except Exception:
        font = ImageFont.load_default()
    number = 0
    for f in findings:
        box = f.get("box_2d")
        if not (isinstance(box, (list, tuple)) and len(box) == 4):
            continue
        number += 1
        f["_box_number"] = number
        ymin, xmin, ymax, xmax = [max(0, min(1000, float(v))) for v in box]
        rect = (xmin / 1000 * w, ymin / 1000 * h, xmax / 1000 * w, ymax / 1000 * h)
        rgb = BOX_RGB.get((f.get("suspicion_level") or "neutral").lower(), BOX_RGB["neutral"])
        draw.rectangle(rect, outline=rgb, width=stroke)
        draw.rectangle((rect[0], rect[1], rect[0] + tag, rect[1] + tag), fill=rgb)
        draw.text((rect[0] + tag / 2, rect[1] + tag / 2), str(number), fill=(255, 255, 255), font=font, anchor="mm")
    return img


def _contact_sheet(frames: List[Dict[str, Any]]) -> Optional[Image.Image]:
    """Grid of sampled video frames, each labelled with its timestamp and neural AI score."""
    tiles = []
    for f in frames:
        img = _decode_image(f.get("image"))
        if img is not None:
            tiles.append((img, f.get("t"), f.get("ai_score")))
    if not tiles:
        return None
    cols, tile_w = 4, 320
    tile_h = round(tile_w * tiles[0][0].height / tiles[0][0].width)
    label_h = 30
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tile_w + (cols + 1) * 8, rows * (tile_h + label_h) + (rows + 1) * 8), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(os.path.join(_WIN_FONTS, "arialbd.ttf"), 17)
    except Exception:
        font = ImageFont.load_default()
    for i, (img, t, score) in enumerate(tiles):
        x = 8 + (i % cols) * (tile_w + 8)
        y = 8 + (i // cols) * (tile_h + label_h + 8)
        sheet.paste(img.resize((tile_w, tile_h)), (x, y))
        rgb = (148, 163, 184) if score is None else (220, 38, 38) if score >= 0.7 else (217, 119, 6) if score >= 0.45 else (22, 163, 74)
        draw.rectangle((x, y + tile_h, x + tile_w, y + tile_h + label_h), fill=rgb)
        stamp = f"{int(t // 60)}:{int(t % 60):02d}" if t is not None else "-"
        draw.text((x + 8, y + tile_h + 6), f"{stamp}   {'n/a' if score is None else f'{round(score * 100)}% AI'}", fill="white", font=font)
    return sheet


def _rl_image(img: Image.Image, max_w: float, max_h: float) -> RLImage:
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    buf.seek(0)
    ratio = min(max_w / img.width, max_h / img.height)
    return RLImage(buf, width=img.width * ratio, height=img.height * ratio)


def _kv_table(rows: List[List[Any]], col_widths) -> Table:
    data = [[_p(k, "cell_bold"), _p(v if v not in (None, "") else "-", "cell")] for k, v in rows]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def _bullets(items: List[str], style: str = "body") -> List[Paragraph]:
    return [Paragraph("&bull;&nbsp;&nbsp;" + escape(str(i)), styles[style]) for i in items if i]


def _clean_raw_tags(raw: Dict[str, Any]) -> List[List[str]]:
    """Readable subset of raw EXIF: drops binary blobs, padding and duplicated exifread copies."""
    rows = []
    for k, v in (raw or {}).items():
        s = str(v)
        if k.isdigit() or "Padding" in k or s.startswith("b'") or s.startswith("<") or len(s) > 120:
            continue
        if k.startswith(("Image ", "EXIF ", "GPS ", "Interoperability ", "Thumbnail ")) and k.split(" ", 1)[1] in raw:
            continue
        rows.append([k, s])
    return rows[:40]


def _footer(canvas, doc, report_id: str):
    canvas.saveState()
    canvas.setFont(FONT, 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, f"VeriLens Forensic Analysis Report  |  {report_id}")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {doc.page}")
    canvas.setStrokeColor(RULE)
    canvas.line(18 * mm, 13 * mm, A4[0] - 18 * mm, 13 * mm)
    canvas.restoreState()


def build_pdf_report(report: Dict[str, Any], image_data_url: Optional[str] = None) -> bytes:
    md = report.get("metadata") or {}
    ai = report.get("ai_assessment") or {}
    findings = [dict(f) for f in (report.get("findings") or [])]
    now = datetime.now()
    report_id = f"VL-{now:%Y%m%d-%H%M%S}-{(md.get('md5_hash') or '000000')[:6].upper()}"
    width = A4[0] - 36 * mm

    story: List[Any] = []
    is_video = bool(report.get("frames")) or md.get("duration_s") is not None

    # Header
    story.append(Paragraph("VeriLens Video Forensic Report" if is_video else "VeriLens Forensic Analysis Report", styles["title"]))
    story.append(_p(f"Report ID {report_id}   |   Generated {now:%d %b %Y, %H:%M}   |   File: {report.get('filename') or md.get('filename') or 'upload'}", "subtitle"))
    story.append(Spacer(1, 6))
    story.append(Table([[""]], colWidths=[width], rowHeights=[1.2], style=[("BACKGROUND", (0, 0), (-1, -1), ACCENT)]))
    story.append(Spacer(1, 10))

    # Verdict panel
    tone = _verdict_tone(report.get("verdict_category"))
    bg, fg = VERDICT_COLORS[tone]
    verdict_style = ParagraphStyle("v", parent=styles["verdict"], textColor=fg)
    prob = report.get("ai_probability")
    stats = [
        ["Confidence", report.get("confidence") or "-"],
        ["AI probability", f"{prob}%" if prob is not None else (ai.get("confidence_score") or "-")],
        ["AI likelihood", ai.get("ai_likelihood") or "-"],
    ]
    stat_cells = [[_p(k, "label"), _p(v, "cell_bold")] for k, v in stats]
    stat_table = Table(stat_cells, colWidths=[30 * mm, 28 * mm])
    stat_table.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    verdict_block = [
        _p("VERDICT", "label"),
        Paragraph(escape(report.get("verdict_category") or "Unknown"), verdict_style),
        Spacer(1, 3),
        _p(ai.get("is_ai_generated") or "", "small"),
    ]
    panel = Table([[verdict_block, stat_table]], colWidths=[width - 64 * mm, 64 * mm])
    panel.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, fg),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(panel)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Summary", styles["h2"]))
    story.append(_p(report.get("summary")))
    if report.get("confidence_explanation"):
        story.append(Spacer(1, 4))
        story.append(_p("Why this confidence: " + report["confidence_explanation"], "small"))
    if report.get("api_notice"):
        story.append(Spacer(1, 4))
        story.append(_p("Engine notice: " + report["api_notice"], "small"))

    # Image + file facts side by side
    img = _decode_image(image_data_url)
    dims = md.get("dimensions") or {}
    make, model = (md.get("camera_make") or "").strip(), (md.get("camera_model") or "").strip()
    camera = model if make and model.lower().startswith(make.lower()) else " ".join(x for x in [make, model] if x)
    settings = ", ".join(str(x) for x in [md.get("exposure_time"), md.get("f_number"), md.get("focal_length"),
                                          f"ISO {md['iso_speed']}" if md.get("iso_speed") else None] if x)
    facts = [
        ["File name", md.get("filename") or report.get("filename")],
        ["Format", f"{md.get('format') or '-'} ({md.get('mime_type') or '-'})"],
        ["Dimensions", f"{dims.get('width')} x {dims.get('height')} px" if dims else "-"],
        ["File size", f"{md.get('file_size_kb')} KB" if md.get("file_size_kb") is not None else "-"],
        ["MD5 hash", md.get("md5_hash")],
        ["Camera", camera or "Not recorded"],
        ["Capture settings", settings or "Not recorded"],
        ["Captured at", md.get("date_time_original") or "Not recorded"],
        ["Software", md.get("software") or "None recorded"],
        ["GPS location", "Present" if md.get("has_gps") else "Not present"],
    ]
    if is_video:
        facts = [
            ["File name", md.get("filename") or report.get("filename")],
            ["Format", f"{md.get('format') or '-'} ({md.get('codec') or '-'})"],
            ["Resolution", f"{dims.get('width')} x {dims.get('height')} px" if dims.get("width") else "-"],
            ["Duration", f"{md.get('duration_s')} s @ {md.get('fps') or '?'} fps" if md.get("duration_s") else "-"],
            ["Audio track", "Yes" if md.get("has_audio") else "No"],
            ["File size", f"{md.get('file_size_kb')} KB" if md.get("file_size_kb") is not None else "-"],
            ["MD5 hash", md.get("md5_hash")],
            ["Recording device", camera or "Not recorded"],
            ["Created at", md.get("date_time_original") or "Not recorded"],
            ["Encoder / software", md.get("software") or "None recorded"],
            ["Gemini input", report.get("gemini_input") or "Not analysed"],
        ]
        story.append(Paragraph("Video Details", styles["h2"]))
        story.append(_kv_table(facts, [35 * mm, width - 35 * mm]))
        sheet = _contact_sheet(report.get("frames") or [])
        if sheet is not None:
            story.append(KeepTogether([
                Paragraph("Sampled Frames", styles["h2"]),
                _rl_image(sheet, width, 72 * mm),
                Spacer(1, 3),
                _p("Evenly spaced frames, each labelled with its timestamp and the neural detector's AI score "
                   "(green < 45%, amber 45-69%, red >= 70%).", "small"),
            ]))
    elif img is not None:
        story.append(Paragraph("Evidence Image & File Details", styles["h2"]))
        annotated = _annotated_image(img, findings)
        left = [_rl_image(annotated, width * 0.48, 95 * mm)]
        if any(f.get("_box_number") for f in findings):
            left += [Spacer(1, 3), _p("Numbered boxes mark the regions referenced in Findings.", "small")]
        side = Table([[left, _kv_table(facts, [24 * mm, width * 0.5 - 30 * mm])]], colWidths=[width * 0.5, width * 0.5])
        side.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
        story.append(side)
    else:
        story.append(Paragraph("File Details", styles["h2"]))
        story.append(_kv_table(facts, [35 * mm, width - 35 * mm]))

    # Signal breakdown
    detector = report.get("detector")
    meta_ai = [f for f in findings if f.get("id") in ("fnd_png_generation_chunks", "fnd_c2pa_ai_source", "fnd_ai_software")]
    signals = [
        ["Neural AI-image detector",
         f"{detector['ai_score'] * 100:.1f}% AI  ({detector.get('model')}, {detector.get('seconds')} s)" if detector else "Not run"],
        ["Gemini visual analysis",
         f"{report['visual_model_probability']}% AI" if report.get("visual_model_probability") is not None
         else ("Included in AI probability" if not report.get("api_notice") else "Not available for this run")],
        ["Metadata AI evidence", "; ".join(f["label"] for f in meta_ai) if meta_ai else "None found"],
        ["Suspected pipeline", ai.get("suspected_generator") or "-"],
    ]
    if report.get("probability_breakdown"):
        signals.append(["How the AI probability was calculated", "\n".join(report["probability_breakdown"])])
    story.append(KeepTogether([Paragraph("Signal Breakdown", styles["h2"]), _kv_table(signals, [45 * mm, width - 45 * mm])]))

    # Editing analysis
    edit = report.get("edit_analysis")
    if edit:
        e_bg, e_fg = VERDICT_COLORS.get(edit.get("tone"), VERDICT_COLORS["grey"])
        head = Table([[Paragraph(escape(edit.get("verdict") or "-"), ParagraphStyle("ev", parent=styles["finding_title"], textColor=e_fg)),
                       _p(f"{edit.get('edit_probability')}% edit likelihood", "cell_bold")]],
                     colWidths=[width * 0.6, width * 0.4])
        head.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), e_bg), ("LINEBEFORE", (0, 0), (0, -1), 3, e_fg),
                                  ("ALIGN", (1, 0), (1, 0), "RIGHT"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                  ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                                  ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8)]))
        block = [Paragraph("Editing & Manipulation Analysis", styles["h2"]), head, Spacer(1, 4), _p(edit.get("summary"))]
        if edit.get("edit_types"):
            block += [Spacer(1, 2), _p("Suspected edit types: " + ", ".join(edit["edit_types"]), "cell_bold")]
        story.append(KeepTogether(block))
        rows = [[f"{s.get('title')}  [{s.get('source')}, {s.get('strength')}]", s.get("detail")] for s in edit.get("signals") or []]
        if rows:
            story.append(Spacer(1, 4))
            story.append(_kv_table(rows, [62 * mm, width - 62 * mm]))
        if edit.get("note"):
            story.append(Spacer(1, 3))
            story.append(_p(edit["note"], "small"))
        heat = _decode_image(edit.get("ela_heatmap"))
        if heat is not None:
            pair = [_rl_image(img, width * 0.48, 70 * mm)] if img is not None else [""]
            pair.append(_rl_image(heat, width * 0.48, 70 * mm))
            t = Table([pair, [_p("Original", "small"), _p("Error Level Analysis heatmap", "small")]], colWidths=[width / 2, width / 2])
            t.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
            story.append(KeepTogether([Spacer(1, 6), t, _p(
                "ELA shows how much each area changes when re-compressed. Edges and fine texture are naturally bright; "
                "a region clearly brighter or darker than similar surroundings may have been pasted or retouched.", "small")]))

    # Evidence lists
    for_ai, for_real = report.get("evidence_for_ai") or [], report.get("evidence_for_real") or []
    if for_ai or for_real:
        cols = [[_p("Pointing to AI generation", "label")] + (_bullets(for_ai, "cell") or [_p("None noted", "cell")]),
                [_p("Pointing to a real capture", "label")] + (_bullets(for_real, "cell") or [_p("None noted", "cell")])]
        ev = Table([cols], colWidths=[width / 2, width / 2])
        ev.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (-1, -1), PANEL),
            ("LINEAFTER", (0, 0), (0, -1), 0.5, RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(KeepTogether([Paragraph("Evidence Weighed", styles["h2"]), ev]))

    # Findings
    story.append(Paragraph(f"Findings ({len(findings)})", styles["h2"]))
    for f in findings:
        level = (f.get("suspicion_level") or "neutral").lower()
        badge = ParagraphStyle("b", parent=styles["label"], textColor=LEVEL_COLORS.get(level, MUTED))
        num = f"[{f['_box_number']}] " if f.get("_box_number") else ""
        ts = f.get("timestamp")
        if isinstance(ts, (int, float)):
            num += f"[{int(ts // 60)}:{int(ts % 60):02d}] "
        block = [
            Table([[Paragraph(escape(num + (f.get("label") or "Finding")), styles["finding_title"]),
                    Paragraph(escape(f"{level.upper()} SUSPICION  |  {(f.get('category') or '').upper()}"), badge)]],
                  colWidths=[width * 0.62, width * 0.38 - 12],
                  style=[("ALIGN", (1, 0), (1, 0), "RIGHT"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                         ("VALIGN", (0, 0), (-1, -1), "TOP")]),
            Spacer(1, 2),
            _p("What we found: " + (f.get("what_we_found") or "-"), "cell"),
            Spacer(1, 2),
            _p("Why it matters: " + (f.get("why_suspicious") or "-"), "small"),
        ]
        card = Table([[block]], colWidths=[width])
        card.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, RULE),
            ("LINEBEFORE", (0, 0), (0, -1), 2.5, LEVEL_COLORS.get(level, MUTED)),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(KeepTogether([card, Spacer(1, 5)]))

    # Metadata flags
    flags = md.get("forensic_flags") or []
    if flags:
        story.append(Paragraph("Metadata Forensic Flags", styles["h2"]))
        story.append(_kv_table([[f"{(fl.get('severity') or '').upper()}: {fl.get('title')}", fl.get("detail")] for fl in flags],
                               [60 * mm, width - 60 * mm]))

    # Next steps
    steps = report.get("what_to_check_next") or []
    if steps:
        story.append(Paragraph("Recommended Next Steps", styles["h2"]))
        story.extend(Paragraph(f"{i}.&nbsp;&nbsp;" + escape(s), styles["body"]) for i, s in enumerate(steps, 1))

    # Raw EXIF appendix
    raw_rows = _clean_raw_tags(md.get("raw_exif_tags"))
    if raw_rows:
        story.append(Paragraph("Appendix: Embedded EXIF Tags", styles["h2"]))
        story.append(_kv_table(raw_rows, [55 * mm, width - 55 * mm]))

    # Method & disclaimer
    story.append(Paragraph("Methodology", styles["h2"]))
    story.append(_p(
        "VeriLens combines three independent signals: (1) file metadata forensics - EXIF camera telemetry, "
        "C2PA content credentials, embedded generator parameters and editing-software stamps; (2) a local neural "
        "AI-image classifier trained to recognise pixel-level fingerprints of modern image generators; and "
        "(3) Google Gemini multimodal visual reasoning over lighting, anatomy, texture and scene logic. "
        "Explicit AI-generator metadata overrides the visual signals; otherwise the AI probability is a weighted "
        "blend of the classifier and the visual analysis. Editing is assessed separately from AI generation: "
        "editing-software stamps, XMP edit history, modified-after-capture dates and a mismatched embedded camera "
        "thumbnail are treated as strong evidence, combined with Gemini's visual check for retouching, object removal, "
        "splicing and background changes. The Error Level Analysis heatmap is provided for visual inspection.", "small"))
    story.append(Spacer(1, 6))
    story.append(_p(report.get("disclaimer") or
                    "VeriLens provides evidence and reasoning signals, not absolute proof of authenticity.", "small"))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                            topMargin=16 * mm, bottomMargin=18 * mm,
                            title=f"VeriLens Report {report_id}", author="VeriLens")
    doc.build(story, onFirstPage=lambda c, d: _footer(c, d, report_id),
              onLaterPages=lambda c, d: _footer(c, d, report_id))
    return buf.getvalue()


def report_filename(report: Dict[str, Any]) -> str:
    base = os.path.splitext(report.get("filename") or "image")[0]
    base = re.sub(r"[^A-Za-z0-9_-]+", "_", base).strip("_")[:40] or "image"
    return f"VeriLens_Report_{base}_{datetime.now():%Y%m%d_%H%M}.pdf"
