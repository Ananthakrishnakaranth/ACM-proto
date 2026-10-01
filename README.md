# VeriLens — Trust in a Synthetic World

> **“Don’t just ask if it’s real. See why.”**  
> *AI-powered multimodal media & identity verification — Evidence, Not Verdicts.*

VeriLens checks whether an **image or video is AI-generated, deepfaked or edited**, and — instead of a black-box “Fake: 87%” — explains **why**, shows **how the score was calculated**, and tells you **what to check next**.

---

## 🎯 Track & Problem Statement
* **Track:** **“Trust in a Synthetic World”**
* **The Problem:** Deepfakes, photorealistic generators (GPT-Image, Midjourney, Flux, Sora, Veo) and real-time face-swap software (DeepFaceLive, Avatarify) are increasingly indistinguishable from reality. Most detectors output opaque verdicts with no justification, leaving students, citizens and KYC platforms without actionable verification steps.
* **The Solution:** VeriLens combines **three independent signals** — file-metadata forensics, a **local neural AI-image detector**, and **Google Gemini multimodal reasoning** — into an understandable, traceable **Trust Report**, exportable as a PDF.

---

## 🚀 Features at a Glance

| Feature | What it does |
|---|---|
| **Media Trust Report** | Image → AI-generation verdict, AI probability with step-by-step calculation, findings with boxes on the image |
| **Editing & Manipulation Analysis** | Was the photo edited after capture? Editing software, edit history, thumbnail mismatch, Gemini visual check, ELA heatmap |
| **Video Check** | Video → AI video / deepfake / lip-sync check with per-frame scores and clickable timestamps |
| **PDF Forensic Reports** | One-click downloadable report for images and videos |
| **Live Identity Check** | 4-step webcam liveness challenge with hand-over-face occlusion test |
| **ZK Privacy** | Prototype zero-knowledge-style proofs: prove a check passed without sharing the face or image |
| **Ask VeriLens** | Chat with Gemini about any report |
| **Chrome Extension** | Right-click any image on the web → “Check with VeriLens” |

---

### 1. Media Trust Report (Images)
* **Upload** an image (JPG, PNG, WEBP, TIFF) or pick a demo preset.
* **Metadata forensics:** camera make/model, exposure, ISO, focal length, GPS, software tags, **C2PA Content Credentials** (the “AI-generated” label embedded by OpenAI, Adobe Firefly, Google), and Stable Diffusion / ComfyUI generation parameters in PNGs.
  * Missing EXIF is treated as **neutral** — screenshots and WhatsApp/Instagram images never have it.
  * Camera tags **without** any capture data (no exposure, focal length or GPS) are flagged as likely forged.
* **Neural AI-image detector:** a local classifier ([`haywoodsloan/ai-image-detector-deploy`](https://huggingface.co/haywoodsloan/ai-image-detector-deploy)) that recognises pixel-level fingerprints of modern generators. Runs on CPU in ~1 s, in parallel with Gemini.
* **Gemini visual reasoning:** lighting, anatomy, texture, scene logic and the “too perfect / rendered” look of modern generators; returns evidence **for AI** and **for a real capture**, plus an AI probability.
* **Transparent scoring** — every report shows the calculation, e.g.:
  ```
  Blend: 60% x detector 10.0% + 40% x Gemini 8% = 9.2%
  Camera EXIF (motorola edge 50 pro): -4.6 points (half the score, max 10)
  Final AI probability: 5%
  ```
  * Explicit AI metadata (C2PA, generator parameters) overrides the visual signals (→ 97%+).
  * Verdict bands: ≥ 70% *Likely Synthetic* · 45–69% *Possibly AI-Generated* · 31–44% *Inconclusive* · ≤ 30% *Authentic*.
  * “Authentic” can only be *High* confidence when real camera metadata is present.

### 2. Editing & Manipulation Analysis
A separate question from AI generation — a real photo can be edited, an AI image can be untouched.

| Evidence | Weight |
|---|---|
| Editing software in EXIF (Photoshop, Lightroom, Snapseed, PicsArt, Canva, FaceApp, Remini… ~30 tools) | Strong |
| XMP edit history (Adobe save events, Camera Raw adjustments) | Strong |
| Embedded camera thumbnail no longer matches the image (cropped / altered after capture) | Strong |
| “Modified” date later than capture date | Moderate |
| Gemini visual check: retouching, object removal, splicing, background change, warping, text overlays | Likelihood + edit types + boxes |

* **Error Level Analysis (ELA) heatmap** is shown next to the original for visual inspection. It is deliberately **not** used in the automatic verdict — in testing, automatic ELA region scoring produced false positives on ordinary photos.
* Plain re-compression (WhatsApp, Instagram) is **not** counted as editing.

### 3. Video Check
* Upload MP4 / MOV / WEBM.
* **8 evenly spaced frames** are scored by the neural detector — shown as a clickable frame strip with colour-coded AI scores.
* **Gemini watches the full clip** (≤ 18 MB; larger clips are sent as frames) for temporal artifacts: morphing/flickering objects, face warping, lip-sync mismatch, impossible physics.
* **Container metadata:** recording device (iPhone/Android tags), encoder/editor (CapCut, InShot, Premiere, DaVinci…), creation time, C2PA and AI-tool tags (Sora, Runway, Kling…).
* Findings carry **timestamps** — click to jump the player to that moment.

### 4. PDF Forensic Reports
One click on **“PDF Report”** produces a 2–4 page A4 report: verdict panel, summary, annotated image (or video frame contact sheet), file/video details, signal breakdown with the probability calculation, editing analysis with ELA heatmap, evidence weighed, findings, next steps, EXIF appendix and methodology.

### 5. Live Identity Check (Webcam Liveness)
* 4-step guided challenge: **front → turn left → turn right → hand over face**.
* The **occlusion step** forces real-time face-swap models to lose landmark anchors, producing texture bleed, edge tearing or mask dropouts.
* Frames are evaluated by Gemini. A **liveness signal indicator, not a guarantee of identity**. Includes a demo mode for machines without a webcam.

### 6. ZK Privacy (Prototype)
Lets a user **prove a result without sharing the private data**:
* **zk-Liveness** — prove “a live human passed the challenge, trust score X%” without including the face frames (frames are hashed into commitments, not stored).
* **zk-Media attestation** — prove “an image with this fingerprint was analysed with verdict X” without revealing the image, EXIF or GPS.
* **Device/PIN authenticator** — Microsoft-Authenticator-style 2-digit challenge for users without a camera.
* **Nullifier hash** prevents reusing the same proof without revealing identity; a **Verify** step checks proof artifacts.

> ⚠️ **Prototype honesty note:** proofs use HMAC-SHA256 commitments arranged in a Groth16-style format; they are **not** real zk-SNARKs, and verification checks structure, freshness and well-formedness rather than cryptographic soundness. Frames are sent to the backend for liveness analysis before being hashed. Production would use Circom circuits with Groth16 / snarkjs.

### 7. Ask VeriLens
Ask Gemini follow-up questions about any report — *“Why was this flagged?”*, *“Could this just be compression?”* — answered in the “evidence, not verdicts” style.

### 8. Chrome Extension
Right-click **any image on any website** → **“Check with VeriLens”** → a popup shows the verdict, AI probability, edit verdict, summary and top findings, with a link to the full app. The toolbar popup shows backend status and settings.

---

## 🔬 Architecture

```
          Image / Video upload  ·  Webcam frames  ·  Chrome extension (right-click)
                                        │
                                        ▼
                         FastAPI backend (main.py)  ── runs in parallel ──┐
     ┌──────────────────────┬───────────────────────┬────────────────────┤
     ▼                      ▼                       ▼                    ▼
 Metadata forensics    Neural AI detector     Edit forensics        Gemini multimodal
 exif_service.py       ai_detector_service    edit_service.py       gemini_service.py
 • EXIF / sub-IFD      • HF image classifier  • editing software    • hedged requests across
 • C2PA, PNG chunks    • per-frame for video  • XMP history           Gemini models
 • forged-tag check      (video_service.py)   • thumbnail / dates   • visual + temporal
                                              • ELA heatmap           reasoning, edit check
     └──────────────────────┴───────────────────────┴────────────────────┘
                                        │
                                        ▼
            Fusion: metadata proof overrides · 60/40 detector/Gemini blend ·
            camera adjustment · verdict bands · traceable probability_breakdown
                                        │
                                        ▼
       Trust Report (React UI)  ·  PDF report (report_service.py)  ·  ZK proof (zk_service.py)
```

**Resilience & speed**
* Typical image analysis: **~15 s**; short video: **~12–30 s**.
* Gemini calls are **hedged**: one request at a time, a backup model starts only if the first fails or is slow (saves quota); 40 s per-call timeout, 50 s overall deadline.
* If Gemini is unavailable (quota, overload, no key), the verdict falls back to **metadata + neural detector**, with a clear notice.

---

## 📊 Accuracy (honest status)

Measured on a **small internal test set** — not a benchmark:

| Component | Test | Result |
|---|---|---|
| Neural detector alone | 9 AI images (ChatGPT/GPT-Image + samples, AI tags stripped) | **9 / 9** detected |
| Neural detector alone | 8 real WhatsApp photos | **7 / 8** correct (1 false positive) |
| Gemini alone | 4 test images | 3 / 4 (missed one very photorealistic portrait) |
| C2PA metadata rule | Original ChatGPT images | 100% (explicit label in the file) |
| Edit detection | Constructed test files (Photoshop stamp, cropped, content changed, spliced) | All flagged; untouched file clean |

* Combined, the detector got **16 / 17 (≈ 94%)** — too small a sample to claim a headline accuracy.
* AI test images were mostly from one generator family (OpenAI); Midjourney, Flux and heavily compressed social media images are not yet evaluated.
* Detector benchmark (same 17 images): `haywoodsloan` 16/17 · `Ateeqq` 12/17 · `umm-maybe` 10/17 · `Organika` 9/17 — the best was chosen.

---

## 💻 Tech Stack

* **Frontend:** React 19 + Vite, Tailwind CSS v4, Lucide icons, `getUserMedia` + Canvas
* **Backend:** Python 3.12+ (tested on 3.14), FastAPI + Uvicorn, Pillow, ExifRead, NumPy
* **AI:** Google GenAI SDK (`google-genai`), PyTorch (CPU) + Hugging Face `transformers`
* **Video:** PyAV (bundles FFmpeg)
* **Reports:** ReportLab
* **Networking:** `truststore` (uses the OS certificate store — fixes SSL errors behind antivirus / proxy HTTPS inspection)
* **Extension:** Chrome Manifest V3

---

## 🛠️ Quickstart (Running Locally)

### 1. Clone
```bash
git clone https://github.com/Ananthakrishnakaranth/ACM-proto.git
cd ACM-proto
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows   (macOS/Linux: source venv/bin/activate)
pip install torch --index-url https://download.pytorch.org/whl/cpu   # smaller CPU-only build
pip install -r requirements.txt
python main.py
```
* API: `http://localhost:8000` · Swagger docs: `http://localhost:8000/docs` · Health: `http://localhost:8000/api/health`
* First start downloads the detector model (~700 MB, one time). Wait for `AI detector '...' loaded` before the first upload.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

### 4. Gemini API key
* Get a key at [Google AI Studio](https://aistudio.google.com/apikey).
* Put `GEMINI_API_KEY=your_key` in `backend/.env` (restart the backend), **or** click **“Add Gemini Key”** in the app.
* ⚠️ A key saved in the app (browser) **overrides** `backend/.env`.
* Without a key, VeriLens still works using metadata + the neural detector.

### 5. Chrome extension
1. Open `chrome://extensions` and enable **Developer mode**.
2. **Load unpacked** → select the `extension/` folder.
3. With the backend running, right-click any image → **Check with VeriLens**.

---

## 🧯 Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `429 RESOURCE_EXHAUSTED` | Free-tier Gemini quota used up. Wait for the reset, use a key from another Google project, or enable billing. |
| `503 UNAVAILABLE` | Google’s servers are overloaded; retry after a minute. VeriLens automatically tries other models, including `gemini-flash-lite-latest`. |
| `API key not valid` | Wrong value copied, or an old key saved in the browser is overriding `.env` — re-enter it via the key button. |
| `SSL: CERTIFICATE_VERIFY_FAILED` | Antivirus/proxy HTTPS inspection; ensure `truststore` is installed (`pip install -r requirements.txt`). |
| Extension says backend offline | Start the backend (`python main.py`) on the same machine, or change the backend URL in the extension popup. |
| Changes not showing | Restart the backend — `.env` and Python code are only loaded at startup. |

---

## 🌟 Demo Walkthrough for Judges

1. **AI image:** upload an original ChatGPT/Firefly image → *Likely Synthetic, 97%* via the C2PA credential. Then upload a screenshot of it (metadata stripped) → the neural detector still flags it; open **“How the AI probability was calculated”**.
2. **Real phone photo:** upload a photo straight from a phone → *Authentic*, with **“Captured On: <phone model>”** and its camera settings.
3. **Edited photo:** edit a phone photo in Snapseed/PicsArt (remove an object, add text) → **Editing Analysis** shows the evidence; expand the **ELA heatmap**.
4. **PDF:** click **PDF Report** on any result.
5. **Video:** open **Video Check**, upload a real clip and an AI clip (Sora/Veo sample) → compare frame scores and click finding timestamps.
6. **Liveness:** **Live Identity Check** → Front → Left → Right → Hand over face.
7. **ZK Privacy:** generate and verify a proof that the liveness check passed without sharing frames.
8. **Chrome extension:** right-click an image on any news or social site → **Check with VeriLens**.

---

## ⚖️ Ethical Disclaimer
*VeriLens provides evidence and reasoning signals, not absolute proof of authenticity. No detector is perfect — results should support, not replace, human judgement. Liveness indicators are signals of physiological and temporal consistency, not a guarantee of identity.*
