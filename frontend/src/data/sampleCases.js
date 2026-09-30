export const SAMPLE_CASES = [
  {
    id: "synthetic_portrait",
    title: "AI-Generated Hyperrealistic Portrait (Flux / Midjourney v6)",
    badge: "High Synthetic Likelihood",
    category: "Image Verification",
    thumbnail: "/samples/synthetic_portrait.jpg",
    description: "Photorealistic portrait exhibiting subtle specular pupil mismatches, unnatural skin pore distribution, and stripped hardware EXIF.",
    metadata: {
      filename: "ai_portrait_flux_render.jpg",
      file_size_kb: 1420.5,
      md5_hash: "7f9b8c2d1e0a4f5c6b7a8d9e0f1a2b3c",
      format: "JPEG",
      mime_type: "image/jpeg",
      dimensions: { width: 1024, height: 1024 },
      aspect_ratio: "1.0 (1024:1024)",
      color_mode: "RGB",
      has_exif: false,
      camera_make: null,
      camera_model: null,
      software: "Stable Diffusion / Flux.1-dev",
      date_time_original: null,
      has_gps: false,
      forensic_flags: [
        {
          id: "missing_exif",
          severity: "high",
          title: "Complete Stripped Camera EXIF",
          detail: "No hardware maker notes, lens parameters, or sensor shutter telemetry found."
        },
        {
          id: "standard_diffusion_aspect_ratio",
          severity: "low",
          title: "Exact 1024x1024 Square Generation Canvas",
          detail: "Matches default square latent space resolution standard in modern diffusion models."
        }
      ]
    },
    report: {
      summary: "Multiple high-confidence forensic anomalies discovered: mismatched corneal light reflections, unnatural skin microtexture smoothing, and complete absence of camera sensor metadata.",
      verdict_category: "Likely Synthetic / Generated",
      confidence: "High",
      confidence_explanation: "Identified 4 mutually reinforcing indicators across visual symmetry, corneal optics, and metadata header characteristics.",
      ai_assessment: {
        is_ai_generated: "Likely AI-Generated",
        ai_likelihood: "High",
        confidence_score: "89% evidentiary correlation",
        suspected_generator: "Diffusion Architecture (Flux.1 / Midjourney v6)",
        key_signatures: [
          "Corneal specular reflection asymmetry",
          "Stripped camera hardware EXIF",
          "Square 1024x1024 latent canvas signature",
          "Sub-surface dermal scattering boundary drop"
        ]
      },
      findings: [
        {
          id: "focal_specular_reflection",
          label: "Corneal Specular Reflection Asymmetry",
          category: "lighting",
          suspicion_level: "high",
          what_we_found: "The catchlights in the left eye and right eye reflect distinct physical light source geometries (left eye shows circular studio keylight; right eye shows ambient diffuse window).",
          why_suspicious: "Real cameras capture identical ambient optical catchlights in both eyes simultaneously. Diffusion models synthesize eyes independently without true 3D spatial illumination consistency.",
          box_2d: [310, 390, 410, 610]
        },
        {
          id: "focal_skin_texture",
          label: "Pore Distribution & Micro-smoothing Artifacts",
          category: "texture",
          suspicion_level: "high",
          what_we_found: "Cheek and forehead regions display hyper-detailed pores that blur abruptly into plasticized, untextured gradations around the jawline boundary.",
          why_suspicious: "Generative diffusion models often hallucinate hyper-crisp focal detail while lacking coherent natural sub-surface dermal scattering across depth planes.",
          box_2d: [460, 350, 680, 650]
        },
        {
          id: "focal_hair_coherence",
          label: "Hair Strand Intersection & Strays",
          category: "visual",
          suspicion_level: "medium",
          what_we_found: "Individual peripheral hair strands blend seamlessly into the background bokeh and merge into single thick blocks without logical root origins.",
          why_suspicious: "Fine-detail high-frequency edge estimation remains difficult for latent upscalers, causing fine strands to fade or cross-link abnormally.",
          box_2d: [180, 240, 360, 360]
        },
        {
          id: "focal_metadata_erasure",
          label: "Stripped Camera Sensor & Shutter EXIF",
          category: "metadata",
          suspicion_level: "medium",
          what_we_found: "File contains no EXIF sensor headers, no camera Make/Model (e.g. Sony/Canon/iPhone), no focal length, and no ISO speed ratings.",
          why_suspicious: "Consumer cameras and modern smartphones encode hardware calibration parameters. Direct web-synthesized AI outputs lack hardware sensor maker notes.",
          box_2d: null
        }
      ],
      metadata_analysis: {
        camera_info: "No camera hardware detected",
        software_detected: "Flux.1-dev / Synthetic Canvas",
        timestamp: "Not recorded in EXIF",
        risk_assessment: "High metadata anomaly: Direct binary export without sensor hardware telemetry."
      },
      "what_to_check_next": [
        "Zoom to 400% on the pupils to verify corneal catchlight shape and environmental reflection coherence.",
        "Inspect background foliage / geometric lines for non-Euclidean perspective distortions.",
        "Execute reverse image search on PimEyes / Google Lens to check for progenitor training set matches.",
        "Request authenticated C2PA Content Credentials or camera RAW .CR3 / .ARW source."
      ],
      disclaimer: "VeriLens provides evidence and reasoning signals, not absolute proof of authenticity."
    }
  },
  {
    id: "face_swapped_id",
    title: "Manipulated ID Photo (Face-Swap Inpainting)",
    badge: "Tampered Region Detected",
    category: "Image Verification",
    thumbnail: "/samples/face_swapped_id.jpg",
    description: "Formal identification headshot showing localized JPEG compression boundary mismatches and blending seam artifacts along the jaw and collarline.",
    metadata: {
      filename: "id_document_applicant_crop.jpg",
      file_size_kb: 480.2,
      md5_hash: "3b2c1a0f9e8d7c6b5a4f3e2d1c0b9a8f",
      format: "JPEG",
      mime_type: "image/jpeg",
      dimensions: { width: 1024, height: 1024 },
      aspect_ratio: "1.0 (1024:1024)",
      color_mode: "RGB",
      has_exif: true,
      camera_make: "Generic Scanner",
      camera_model: "DocuScan HD",
      software: "Adobe Photoshop 24.1 (Macintosh)",
      date_time_original: "2024-03-12 14:22:01",
      has_gps: false,
      forensic_flags: [
        {
          id: "software_editing_photoshop",
          severity: "high",
          title: "Editing Software Signature Detected (Adobe Photoshop)",
          detail: "Metadata explicitly records post-processing and layer re-export in Photoshop."
        }
      ]
    },
    report: {
      summary: "Localized manipulation detected: Facial oval exhibits differential JPEG compression quantization and softened boundary blending compared to torso fabric and collar.",
      verdict_category: "Potential Manipulation / Inpainting",
      confidence: "High",
      confidence_explanation: "Inconsistent noise grain variance and seam gradients specifically isolated to the facial boundary oval.",
      ai_assessment: {
        is_ai_generated: "AI Manipulation / Face-Swap",
        ai_likelihood: "High (Localized Inpainting)",
        confidence_score: "86% evidentiary correlation",
        suspected_generator: "Neural Inpainting / Layer Composite (Photoshop 24)",
        key_signatures: [
          "Poisson contour blending halo along collar",
          "Differential noise grain quantization",
          "Desktop raster editing software tag"
        ]
      },
      findings: [
        {
          id: "focal_boundary_seam",
          label: "Facial Boundary Inpainting Seam",
          category: "visual",
          suspicion_level: "high",
          what_we_found: "A faint halo with reduced high-frequency noise variance traces the contour between the chin/jawline and the neck collar.",
          why_suspicious: "When a target face is pasted or in-painted onto a host torso, neural Poisson blending softens the boundary transition to mask tonal mismatches.",
          box_2d: [520, 360, 680, 640]
        },
        {
          id: "focal_lighting_discrepancy",
          label: "Shadow Orientation Discrepancy",
          category: "lighting",
          suspicion_level: "high",
          what_we_found: "Nose cast shadow indicates an elevated light source at ~45 degrees right, whereas collar and shoulder shadows indicate frontal flat illumination.",
          why_suspicious: "Composited face swaps frequently fail to harmonize dual-source shadow vectors between original donor photograph and host portrait.",
          box_2d: [380, 440, 520, 560]
        },
        {
          id: "focal_software_trace",
          label: "Post-Processing Software Footprint",
          category: "metadata",
          suspicion_level: "medium",
          what_we_found: "Metadata headers contain markers consistent with multi-layer image editing software (Photoshop / GIMP export chunk).",
          why_suspicious: "Direct identification camera systems rarely process files through desktop raster editing suites before submission.",
          box_2d: null
        }
      ],
      metadata_analysis: {
        camera_info: "Generic Scanner DocuScan HD",
        software_detected: "Adobe Photoshop 24.1 (Detected in Header)",
        timestamp: "2024-03-12 14:22:01",
        "risk_assessment": "Moderate-High: Image edited in desktop software with layer flattening before upload."
      },
      "what_to_check_next": [
        "Perform Error Level Analysis (ELA) on the jaw boundary to confirm differential compression.",
        "Cross-check ID document issue date against EXIF digitization timestamp.",
        "Verify whether official document issuing authority requires cryptographically signed barcodes or chips."
      ],
      disclaimer: "VeriLens provides evidence and reasoning signals, not absolute proof of authenticity."
    }
  },
  {
    id: "authentic_dslr",
    title: "Authentic Optical Capture (Sony Alpha 7 IV)",
    badge: "Consistent Optical Physics",
    category: "Image Verification",
    thumbnail: "/samples/authentic_dslr.jpg",
    description: "Genuine photographic portrait with full camera telemetry, coherent lens depth of field, and continuous natural Bayer sensor noise.",
    metadata: {
      filename: "DSC04892_SONY_A7IV.JPG",
      file_size_kb: 4210.8,
      md5_hash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
      format: "JPEG",
      mime_type: "image/jpeg",
      dimensions: { width: 1024, height: 1024 },
      aspect_ratio: "1.0 (1024:1024)",
      color_mode: "RGB",
      has_exif: true,
      camera_make: "Sony",
      camera_model: "ILCE-7M4",
      software: "Sony Imaging Edge Firmware 2.00",
      date_time_original: "2023-11-04 16:45:19",
      exposure_time: "1/320 sec",
      f_number: "f/2.0",
      iso_speed: "100",
      focal_length: "85.0 mm",
      lens_model: "FE 85mm F1.4 GM",
      has_gps: false,
      forensic_flags: []
    },
    report: {
      summary: "No indicators of generative synthesis or localized inpainting found. Image displays uniform Bayer sensor noise, physically coherent depth of field, and complete hardware EXIF telemetry.",
      verdict_category: "Authentic / Unmodified Characteristics",
      confidence: "High",
      confidence_explanation: "Full hardware telemetry corroborated by natural optical aberrations and unbroken sensor noise structure.",
      ai_assessment: {
        is_ai_generated: "Authentic Human Photographic Capture",
        ai_likelihood: "Low / Unlikely",
        confidence_score: "94% optical correlation",
        suspected_generator: "None (Authentic Sony ILCE-7M4 Sensor)",
        key_signatures: [
          "Intact Sony camera maker notes and lens telemetry",
          "Physically coherent optical depth of field",
          "Continuous Bayer sensor chrominance noise structure"
        ]
      },
      findings: [
        {
          id: "focal_sensor_noise",
          label: "Uniform Bayer Sensor Chrominance Noise",
          category: "texture",
          suspicion_level: "neutral",
          what_we_found: "Consistent Gaussian sensor noise pattern across both low-light shadow areas and high-light skin gradients.",
          why_suspicious: "Normal physical sensor behavior; not suspicious. Generative models typically create smooth patches or unnatural synthetic grain overlays.",
          box_2d: null
        },
        {
          id: "focal_optical_bokeh",
          label: "Physically Coherent Optical Depth of Field",
          category: "visual",
          suspicion_level: "neutral",
          what_we_found: "Natural circular bokeh disks with slight cat-eye optical vignetting at the frame periphery matching the 85mm f/1.4 lens specifications.",
          why_suspicious: "Authentic optical physics; matches recorded lens focal length and aperture setting.",
          box_2d: [100, 100, 400, 400]
        },
        {
          id: "focal_complete_exif",
          label: "Intact Hardware & Sensor Telemetry",
          category: "metadata",
          suspicion_level: "neutral",
          what_we_found: "Complete camera make (Sony ILCE-7M4), FE 85mm F1.4 GM lens, 1/320s shutter speed, f/2.0 aperture, and ISO 100 present in EXIF.",
          why_suspicious: "Standard unaltered camera file telemetry.",
          box_2d: null
        }
      ],
      metadata_analysis: {
        camera_info: "Sony ILCE-7M4 (A7 IV)",
        software_detected: "Sony Imaging Edge Firmware 2.00",
        timestamp: "2023-11-04 16:45:19",
        "risk_assessment": "Low: EXIF telemetry intact and consistent with photographic characteristics."
      },
      "what_to_check_next": [
        "Inspect embedded thumbnail consistency in EXIF if maximum assurance is required.",
        "Confirm that file hasn't been intercepted in transit if used for strict KYC/AML compliance."
      ],
      disclaimer: "VeriLens provides evidence and reasoning signals, not absolute proof of authenticity."
    }
  }
];

export const SAMPLE_LIVENESS_REPORT = {
  liveness_status: "Consistent Human Liveness Signals Detected",
  status_category: "pass",
  confidence: "High",
  confidence_explanation: "Smooth continuous 3D head rotation with natural parallax and clean occlusion response without face-swap mesh collapse.",
  occlusion_analysis: "During the hand-over-face challenge, the user's fingers realistically occluded the facial features with natural shadow casting and edge contact. No real-time face-swap mask tearing, texture ghosting, or jitter observed.",
  temporal_consistency: "Consistent cranial geometry observed across 0-degree frontal, 30-degree left, and 30-degree right poses. Ear position and jawline perspective shifted in alignment with rigid 3D head motion.",
  evidence: [
    {
      title: "Natural Hand Occlusion Boundary",
      observation: "Fingers physically occlude nose bridge and cheek; hand skin tone matches ambient lighting; no neural mask bleed through knuckles.",
      why_it_matters: "Real-time deepfake models (DeepFaceLive/Avatarify) consistently malfunction when a physical object crosses the facial landmarks.",
      status: "pass"
    },
    {
      title: "3D Perspective & Anatomical Foreshortening",
      observation: "Nose and ear perspective transformed accurately during left and right head turns, confirming 3D volumetric presence rather than 2D planar projection.",
      why_it_matters: "Simple photo/video replay attacks fail to recreate natural parallax between the nose tip and earlobes.",
      status: "pass"
    },
    {
      title: "Dynamic Ambient Lighting Response",
      observation: "Light reflection across the forehead shifted naturally with head rotation towards the primary ambient monitor source.",
      why_it_matters: "Static replayed masks maintain fixed directional lighting regardless of orientation changes.",
      status: "pass"
    }
  ],
  "what_to_check_next": [
    "In high-risk scenarios, request an unannounced gesture challenge (e.g. touch nose with left index finger).",
    "Verify device camera frame rate consistency to rule out injection of virtual webcam drivers (OBS Virtual Cam).",
    "Pair liveness signal with cryptographically signed government ID."
  ],
  disclaimer: "This is a real-time liveness signal indicator, not an absolute guarantee of identity or authenticity."
};
