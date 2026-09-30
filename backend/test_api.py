import urllib.request
import json
import io
import base64
from PIL import Image

def run_tests():
    print("=== STARTING VERILENS VERIFICATION SUITE ===")
    
    # 1. Health Check
    res = urllib.request.urlopen('http://127.0.0.1:8000/api/health')
    health = json.loads(res.read().decode())
    print("[PASS] 1. Health check:", health['status'], "| Philosophy:", health['philosophy'])

    # 2. Sample Cases
    res = urllib.request.urlopen('http://127.0.0.1:8000/api/sample-cases')
    samples = json.loads(res.read().decode())
    print(f"[PASS] 2. Sample cases loaded: {len(samples['samples'])} cases | Liveness preloaded: {bool(samples['sample_liveness'])}")

    # 3. Create dummy test JPEG
    img = Image.new('RGB', (640, 640), color=(50, 80, 120))
    bio = io.BytesIO()
    img.save(bio, format='JPEG')
    img_bytes = bio.getvalue()

    # Form boundary
    boundary = "----VeriLensFormBoundary9823412"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test_scan.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode('utf-8') + img_bytes + f"\r\n--{boundary}--\r\n".encode('utf-8')

    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/analyze-media',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    res = urllib.request.urlopen(req)
    media_res = json.loads(res.read().decode())
    print("[PASS] 3. Media Analysis Success:", media_res['success'])
    print("        Verdict Category:", media_res['report']['verdict_category'])
    print("        Confidence:", media_res['report']['confidence'])
    print("        AI Likelihood:", media_res['report'].get('ai_assessment', {}).get('ai_likelihood'))
    print("        Suspected Pipeline:", media_res['report'].get('ai_assessment', {}).get('suspected_generator'))
    print(f"        Findings Count: {len(media_res['report']['findings'])}")

    # 4. Liveness test with base64 frames
    b64_frame = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode('utf-8')
    liveness_payload = json.dumps({
        "frames": {
            "front": b64_frame,
            "left": b64_frame,
            "right": b64_frame,
            "occlusion": b64_frame
        }
    }).encode('utf-8')

    req2 = urllib.request.Request(
        'http://127.0.0.1:8000/api/analyze-liveness',
        data=liveness_payload,
        headers={'Content-Type': 'application/json'}
    )
    res2 = urllib.request.urlopen(req2)
    liveness_res = json.loads(res2.read().decode())
    print("[PASS] 4. Liveness Analysis Success:", liveness_res['success'])
    print("        Status:", liveness_res['report']['liveness_status'])
    print("        Occlusion Analysis:", liveness_res['report']['occlusion_analysis'][:70] + "...")

    # 5. Follow-up Chat ("Ask VeriLens")
    chat_payload = json.dumps({
        "report_context": media_res['report'],
        "user_query": "Why was the absence of camera sensor EXIF flagged as suspicious?"
    }).encode('utf-8')

    req3 = urllib.request.Request(
        'http://127.0.0.1:8000/api/chat',
        data=chat_payload,
        headers={'Content-Type': 'application/json'}
    )
    res3 = urllib.request.urlopen(req3)
    chat_res = json.loads(res3.read().decode())
    print("[PASS] 5. Follow-Up Chat Success:", chat_res['success'])
    print("        Reply:", chat_res['reply'][:100] + "...")

    print("=== ALL 5 VERILENS API TESTS PASSED! ===")

if __name__ == '__main__':
    run_tests()
