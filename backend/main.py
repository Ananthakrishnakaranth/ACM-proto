import os
import base64
import hashlib
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from exif_service import extract_image_metadata
from gemini_service import (
    analyze_media_with_gemini,
    analyze_liveness_with_gemini,
    chat_with_verilens,
    get_api_key
)
from zk_service import (
    generate_liveness_zk_proof,
    generate_media_zk_proof,
    verify_zk_proof,
    generate_device_challenge,
    verify_device_response,
    hash_bytes
)
from sample_data import SAMPLE_CASES, SAMPLE_LIVENESS_REPORT
import ai_detector_service
from report_service import build_pdf_report, report_filename
from edit_service import analyze_edits, combine_edit_analysis

# Runs the local AI detector alongside the Gemini request
detector_pool = ThreadPoolExecutor(max_workers=4)

app = FastAPI(
    title="VeriLens API",
    description="Multimodal Media & Identity Forensic Verification API - Evidence, Not Verdicts.",
    version="1.0.0"
)

# Enable CORS for frontend dev server & deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def preload_ai_detector():
    ai_detector_service.preload_in_background()

class LivenessRequest(BaseModel):
    frames: Dict[str, str]  # base64 data URLs: {"front": "...", "left": "...", "right": "...", "occlusion": "..."}
    api_key: Optional[str] = None

class ReportRequest(BaseModel):
    report: Dict[str, Any]
    image_data_url: Optional[str] = None  # base64 data URL of the analyzed image, drawn with finding boxes

class ChatRequest(BaseModel):
    report_context: Dict[str, Any]
    user_query: str
    chat_history: Optional[List[Dict[str, str]]] = []
    api_key: Optional[str] = None

class ZkLivenessProofRequest(BaseModel):
    liveness_report: Dict[str, Any]
    frame_data_urls: Optional[Dict[str, str]] = {}  # base64 data URLs for frame hashing (hashed client-side ideally)
    method: Optional[str] = "webcam_occlusion"  # "webcam_occlusion" | "device_authenticator"

class ZkMediaProofRequest(BaseModel):
    media_report: Dict[str, Any]
    image_hash: str  # SHA-256 of the image bytes
    metadata_summary: Optional[Dict[str, Any]] = {}

class ZkVerifyRequest(BaseModel):
    proof: Dict[str, Any]

class DeviceVerifyRequest(BaseModel):
    session_token: str
    challenge_number: int
    user_pin: str

def strip_base64_header(b64_string: str) -> bytes:
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    return base64.b64decode(b64_string)

@app.get("/api/health")
def health_check():
    has_key = bool(get_api_key())
    return {
        "status": "healthy",
        "service": "VeriLens AI Verification",
        "gemini_configured": has_key,
        "ai_detector": ai_detector_service.status(),
        "philosophy": "Don't just ask if it's real. See why."
    }

@app.get("/api/sample-cases")
def get_sample_cases():
    return {
        "samples": SAMPLE_CASES,
        "sample_liveness": SAMPLE_LIVENESS_REPORT
    }

@app.post("/api/analyze-media")
async def analyze_media(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    x_gemini_api_key: Optional[str] = Header(None)
):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
            
        custom_key = api_key or x_gemini_api_key

        # 1. Deep EXIF and header extraction
        metadata = extract_image_metadata(content, filename=file.filename or "upload.jpg")

        # 2. Local neural AI detector + edit forensics (in parallel) + multimodal Gemini reasoning
        detector_future = detector_pool.submit(ai_detector_service.detect, content)
        edit_future = detector_pool.submit(analyze_edits, content, metadata)
        report = await asyncio.to_thread(
            analyze_media_with_gemini,
            image_bytes=content,
            mime_type=file.content_type or metadata.get("mime_type", "image/jpeg"),
            metadata_summary=metadata,
            api_key=custom_key,
            detector_future=detector_future
        )

        # 3. Was the photo edited? (metadata + ELA + Gemini's visual edit assessment)
        try:
            local_edits = edit_future.result(timeout=30)
        except Exception as e:
            print(f"Edit analysis failed: {e}")
            local_edits = None
        combine_edit_analysis(report, local_edits, metadata)

        return {
            "success": True,
            "filename": file.filename,
            "metadata": metadata,
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/report/pdf")
async def report_pdf(payload: ReportRequest):
    try:
        pdf = await asyncio.to_thread(build_pdf_report, payload.report, payload.image_data_url)
        return Response(
            content=pdf,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{report_filename(payload.report)}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@app.post("/api/analyze-liveness")
async def analyze_liveness(payload: LivenessRequest):
    try:
        decoded_frames: Dict[str, bytes] = {}
        for key, b64 in payload.frames.items():
            if b64:
                try:
                    decoded_frames[key] = strip_base64_header(b64)
                except Exception as e:
                    print(f"Error decoding frame {key}: {e}")

        if not decoded_frames:
            raise HTTPException(status_code=400, detail="No valid frames received for liveness challenge.")

        report = analyze_liveness_with_gemini(
            frames=decoded_frames,
            api_key=payload.api_key
        )

        return {
            "success": True,
            "report": report,
            "frames_analyzed": list(decoded_frames.keys())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Liveness verification failed: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest):
    try:
        reply = chat_with_verilens(
            report_context=payload.report_context,
            user_query=payload.user_query,
            chat_history=payload.chat_history or [],
            api_key=payload.api_key
        )
        return {"success": True, "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# ─── Zero-Knowledge Proof Endpoints ───────────────────────────────────────────

@app.post("/api/zk/generate-liveness-proof")
async def zk_generate_liveness_proof(payload: ZkLivenessProofRequest):
    """Generate a ZK proof that a liveness challenge was passed, without revealing biometric frames."""
    try:
        # Hash the frame data URLs to create commitments (frames never stored)
        frame_hashes = {}
        for key, data_url in (payload.frame_data_urls or {}).items():
            if data_url:
                try:
                    raw_bytes = strip_base64_header(data_url)
                    frame_hashes[key] = hash_bytes(raw_bytes)
                except Exception:
                    frame_hashes[key] = hashlib.sha256(data_url.encode()).hexdigest()
        
        # If no frame data was sent, generate placeholder hashes
        if not frame_hashes:
            for key in ["front", "left", "right", "occlusion"]:
                frame_hashes[key] = hashlib.sha256(f"frame_{key}_session".encode()).hexdigest()
        
        proof = generate_liveness_zk_proof(
            liveness_report=payload.liveness_report,
            frame_hashes=frame_hashes,
            method=payload.method or "webcam_occlusion"
        )
        
        return {
            "success": True,
            "zk_proof": proof,
            "message": "Zero-Knowledge proof generated. Biometric frames were hashed and discarded — zero raw data stored."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZK proof generation failed: {str(e)}")


@app.post("/api/zk/generate-media-proof")
async def zk_generate_media_proof(payload: ZkMediaProofRequest):
    """Generate a ZK forensic attestation that a document passed forensic checks."""
    try:
        proof = generate_media_zk_proof(
            media_report=payload.media_report,
            image_hash=payload.image_hash,
            metadata_summary=payload.metadata_summary or {}
        )
        
        return {
            "success": True,
            "zk_proof": proof,
            "message": "Zero-Knowledge forensic attestation generated. Document content remains private."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZK media proof generation failed: {str(e)}")


@app.post("/api/zk/verify-proof")
async def zk_verify_proof(payload: ZkVerifyRequest):
    """Independently verify a VeriLens ZK proof artifact."""
    try:
        result = verify_zk_proof(payload.proof)
        return {
            "success": True,
            "verification": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZK verification failed: {str(e)}")


@app.get("/api/zk/device-challenge")
async def zk_device_challenge():
    """Generate a Microsoft Authenticator-style 2-digit challenge for no-camera devices."""
    try:
        challenge = generate_device_challenge()
        return {
            "success": True,
            "challenge": challenge
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Device challenge generation failed: {str(e)}")


@app.post("/api/zk/device-verify")
async def zk_device_verify(payload: DeviceVerifyRequest):
    """Verify device PIN response and generate ZK proof of authentication."""
    try:
        result = verify_device_response(
            session_token=payload.session_token,
            challenge_number=payload.challenge_number,
            user_pin=payload.user_pin
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Device verification failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
