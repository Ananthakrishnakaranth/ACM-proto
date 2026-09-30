# VeriLens — Trust in a Synthetic World

> **“Don’t just ask if it’s real. See why.”**  
> *AI-Powered Multimodal Media & Identity Verification — Evidence, Not Verdicts.*

---

## 🎯 Track & Problem Statement
* **Track:** **“Trust in a Synthetic World”**
* **The Problem:** Deepfakes, photorealistic generative models (Midjourney, Flux), and real-time face-swap software (DeepFaceLive, Avatarify) are increasingly indistinguishable from reality. Traditional detection platforms output opaque black-box verdicts like **`Fake: 87%`** which fail users, provide no justification, and leave students, citizens, and KYC platforms without actionable verification steps.
* **The Solution:** **VeriLens** shifts the paradigm from *“verdicts to evidence”*. Rather than asserting an infallible binary truth, VeriLens synthesizes deep EXIF hardware telemetry, optical catchlight physics, biological micro-textures, and webcam liveness challenge frames through **Google Gemini Multimodal AI** to generate an understandable, forensic **Trust Report**.

---

## 🚀 Key Features

### 1. Media Trust Report
* **Image Ingestion:** Drag-and-drop or select sample presets (AI portrait, face-swapped ID document, authentic DSLR camera photo).
* **Deep EXIF & Hardware Telemetry:** Extracts camera make, model, lens, exposure, shutter speed, ISO, color profile, timestamps, software tags (Photoshop, Canva, Remini), and PNG generation parameters (Stable Diffusion/ComfyUI prompts).
* **Gemini Multimodal Reasoning:** Analyzes corneal specular catchlights (ambient light consistency in pupils), sub-surface dermal scattering, hair strand boundary blending, and non-Euclidean perspective warping.
* **Structured Trust Report:**
  * **What we found:** Objective observations of optical & metadata characteristics.
  * **Why it’s suspicious:** The physical forensic science explaining why generative models or compositing tools fail at this specific feature.
  * **Confidence level:** Transparent confidence backed by corroborating evidence count.
  * **What to check next:** An actionable human verification checklist (e.g. 400% corneal zoom, reverse image indexing, C2PA cryptographic signature check).
* **Interactive Focal Annotator:** Interactive bounding boxes on the image HUD highlighting suspicious regions (ocular catchlights, jawline inpainting seams).

---

### 2. Live Identity Check (Webcam Liveness)
* **Real-time Webcam Access:** Leverages browser `getUserMedia` with an in-browser biometric alignment HUD reticle.
* **4-Step Guided Challenge:**
  1. **Face front:** Baseline frontal alignment and ocular catchlights.
  2. **Turn left (~30°):** Tests 3D volumetric foreshortening and ear parallax.
  3. **Turn right (~30°):** Confirms bilateral cranial symmetry.
  4. **Hand over face (Critical Occlusion):** Placing a hand across the mouth & nose forces real-time face-swap models (e.g., DeepFaceLive) to lose landmark anchors, causing signature texture bleed across knuckles, edge tearing, or mask dropouts.
* **Multimodal Liveness Evaluation:** Evaluates captured frames with Google Gemini, reporting liveness indicators and occlusion boundary integrity.
* **Evidence-Based Signal:** Clearly designated as a **liveness signal indicator, not an absolute guarantee of identity or authenticity**.
* **Simulation Mode:** Includes a instant demo mode for machines without functional webcams or automated judging.

---

### 3. “Ask VeriLens” (Contextual Forensic Chat)
* Users can query Gemini about any generated Trust Report or Liveness check.
* Ask questions such as:
  * *“Why was the corneal catchlight flagged as suspicious?”*
  * *“Could this anomaly simply be heavy social media compression?”*
  * *“How does the hand occlusion test expose real-time deepfakes?”*
* Gemini acts as an expert forensic explainer adhering to *“Evidence, not verdicts”*.

---

## 🔬 Core Architecture: Gemini as the Reasoning Layer

```
                        ┌───────────────────────────────┐
                        │          User Input           │
                        │  (Image Upload / Webcam Stream) │
                        └──────────────┬────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     [ExifRead & Pillow]                             [getUserMedia / Canvas]
  • Camera Make / Model / Lens                    • 4-Step Challenge Sequence
  • Software / PNG Generation Chunks              • Filmstrip Frame Capture
  • Shutter / ISO / Timestamps                    • Hand Occlusion Isolation
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │ Google Gemini Multimodal Vision   │
                     │ (gemini-2.5-flash / 2.0-flash)    │
                     │ • SEES: Visual + Occlusion Frames │
                     │ • REASONS: Correlates Signals     │
                     │ • EXPLAINS: Why Suspicious        │
                     └─────────────────┬─────────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │       VeriLens Trust Report       │
                     │ • What We Found                   │
                     │ • Why It's Suspicious             │
                     │ • Confidence & Reason             │
                     │ • Interactive Focal HUD Boxes     │
                     │ • What To Check Next Checklist    │
                     │ • "Ask VeriLens" Follow-Up Chat   │
                     └───────────────────────────────────┘
```

---

## 💻 Tech Stack

* **Frontend:**
  * React 19 + Vite 8
  * Tailwind CSS v4 (Cyber-forensic aesthetic, dark mode, glassmorphism, HUD scanning lines)
  * Lucide Icons
  * Browser `navigator.mediaDevices.getUserMedia` & HTML5 Canvas
* **Backend:**
  * Python 3.12 + FastAPI + Uvicorn
  * Pillow 12 + ExifRead 3.5 (Deep metadata extraction)
  * Google GenAI SDK (`google-genai`)
  * Python-dotenv + Pydantic
* **Deployment Ready:**
  * Frontend: Vercel (`vercel.json`)
  * Backend: Render / Railway (`Procfile`, `requirements.txt`)

---

## 🛠️ Quickstart (Running Locally)

### 1. Clone the repository
```bash
git clone https://github.com/Ananthakrishnakaranth/ACM-proto.git
cd ACM-proto-1
```

### 2. Start the Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*API will run at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

### 3. Start the Frontend (React + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

### 4. Provide Gemini API Key (Optional)
* You can add `GEMINI_API_KEY=your_key` in `backend/.env`, **OR**
* Simply click **"Add Gemini Key"** in the top navigation bar of the web app to save it in your browser session.
* *Note: VeriLens includes built-in realistic forensic samples and heuristic reasoning engines, so the app is fully functional even before configuring an API key.*

---

## 🌟 Demo Walkthrough for Judges

1. **AI Portrait Inspection:**
   * Load the pre-loaded **AI Synthetic Portrait (Flux)** sample or upload your own.
   * Observe the **Corneal Specular Reflection Asymmetry** finding and click it to focus the interactive bounding box on the image HUD.
   * Toggle to **EXIF & Camera Telemetry** to note the stripped hardware metadata.
   * Toggle to **What To Check Next** and complete the checklist.
2. **Manipulated ID Inpainting Test:**
   * Switch demo preset to **Manipulated ID Photo (Face-Swap)**.
   * Notice the flagged facial boundary halo and detected Photoshop metadata trace.
3. **Interactive "Ask VeriLens" Chat:**
   * Click **"Ask VeriLens"** on any report and ask: *“Why was the corneal catchlight flagged?”* to see Gemini's contextual forensic reasoning.
4. **Live Identity & Occlusion Challenge:**
   * Switch to **Live Identity Check**.
   * Click **"Start 4-Step Liveness Challenge"** with your webcam (or click **"Demo Occlusion Test"**).
   * Perform Front → Turn Left → Turn Right → Hand over Face.
   * View the structured analysis explaining how real-time face-swaps fail during the hand-over-face occlusion moment.

---

## ⚖️ Ethical Disclaimer
*VeriLens provides evidence and reasoning signals, not absolute proof of authenticity. Liveness indicators are signals of physiological and temporal consistency, not a guarantee of identity.*
