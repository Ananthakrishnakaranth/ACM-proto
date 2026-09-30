import os
import base64
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from exif_service import extract_image_metadata
from gemini_service import (
    analyze_media_with_gemini,
    analyze_liveness_with_gemini,
    chat_with_verilens,
    get_api_key
)
from sample_data import SAMPLE_CASES, SAMPLE_LIVENESS_REPORT

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

class LivenessRequest(BaseModel):
    frames: Dict[str, str]  # base64 data URLs: {"front": "...", "left": "...", "right": "...", "occlusion": "..."}
    api_key: Optional[str] = None

class ChatRequest(BaseModel):
    report_context: Dict[str, Any]
    user_query: str
    chat_history: Optional[List[Dict[str, str]]] = []
    api_key: Optional[str] = None

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

        # 2. Multimodal Gemini reasoning
        report = analyze_media_with_gemini(
            image_bytes=content,
            mime_type=file.content_type or metadata.get("mime_type", "image/jpeg"),
            metadata_summary=metadata,
            api_key=custom_key
        )

        return {
            "success": True,
            "filename": file.filename,
            "metadata": metadata,
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
