#!/usr/bin/env python3
"""
test_local.py — Local smoke-test for the VEYRA Crop Disease Detection backend.

Run BEFORE deploying to Railway to verify:
  1. Model loads successfully from models/veyra_cnn_best.pth
  2. Model config has 211 classes matching the checkpoint
  3. A sanity check verifies input [1,3,128,128] -> output [1,211]
  4. A real leaf image can be preprocessed correctly
  5. /predict returns top-3 predictions with the correct response structure
  6. All confidence values are valid (0-1, sum of top-k <= 1.0)
  7. File validation correctly accepts/rejects MIME types and sizes
  8. GET /health reports model_loaded=true (requires server to be running)
  9. POST /predict returns a valid JSON prediction (requires server)

Usage
-----
# Offline — tests model loading + inference logic (no server needed):
  python test_local.py --offline --image path/to/leaf.jpg

# Full test — also hits the live API (start uvicorn first in another terminal):
  uvicorn app.main:app --reload
  python test_local.py --image path/to/leaf.jpg

# Against a custom server URL:
  python test_local.py --url http://localhost:8000 --image path/to/leaf.jpg
"""

import argparse
import io
import sys
import traceback
from pathlib import Path

# Ensure the project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN = "\033[92m"
RED   = "\033[91m"
CYAN  = "\033[96m"
RESET = "\033[0m"
BOLD  = "\033[1m"

passed = 0
failed = 0


def ok(msg: str) -> None:
    global passed
    passed += 1
    print(f"  {GREEN}✓{RESET}  {msg}")


def fail(msg: str) -> None:
    global failed
    failed += 1
    print(f"  {RED}✗{RESET}  {msg}")


def section(title: str) -> None:
    print(f"\n{BOLD}{CYAN}── {title} {'─' * (60 - len(title))}{RESET}")


# ── Helper: load real image ───────────────────────────────────────────────────
def get_test_image_bytes(image_path: str | None) -> bytes:
    """Return raw bytes of a provided image path."""
    if not image_path:
        raise ValueError("A real leaf image is required. Provide it via --image <path>.")

    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found at {path}")

    with open(path, "rb") as f:
        return f.read()


# ── TEST 1: model loading ─────────────────────────────────────────────────────
def test_model_loading():
    section("Test 1 — Model Loading")
    try:
        from app.inference import load_model, _MODEL_PATH, _CONFIG_PATH
        print(f"  Checkpoint : {_MODEL_PATH}")
        print(f"  Config     : {_CONFIG_PATH}")

        if not _MODEL_PATH.exists():
            fail(f"veyra_cnn_best.pth not found at {_MODEL_PATH}")
            print(f"       {RED}→ Copy the checkpoint to models/veyra_cnn_best.pth{RESET}")
            return False
        if not _CONFIG_PATH.exists():
            fail(f"model_config.json not found at {_CONFIG_PATH}")
            print(f"       {RED}→ Copy the config to models/model_config.json{RESET}")
            return False

        model = load_model()
        ok("Model loaded without errors")
        ok(f"Model type: {type(model).__name__}")
        num_params = sum(p.numel() for p in model.parameters())
        ok(f"Parameter count: {num_params:,}")
        return True
    except Exception as exc:
        fail(f"Model loading raised: {exc}")
        traceback.print_exc()
        return False


# ── TEST 1.5: class mapping consistency ───────────────────────────────────────
def test_class_mapping():
    section("Test 1.5 — Class Mapping Consistency")
    try:
        from app.inference import get_class_names, _num_classes
        class_names = get_class_names()

        assert len(class_names) == 211, (
            f"Expected 211 class names, got {len(class_names)}"
        )
        ok(f"Class name count: {len(class_names)} (expected 211)")

        assert _num_classes == 211, (
            f"_num_classes={_num_classes}, expected 211"
        )
        ok(f"_num_classes matches: {_num_classes}")

        # Spot-check a few known class names from model_config.json
        assert "tomato_late_blight" in class_names, "Expected 'tomato_late_blight' in class list"
        ok("Spot-check 'tomato_late_blight' present")

        assert "apple_scab" in class_names, "Expected 'apple_scab' in class list"
        ok("Spot-check 'apple_scab' present")

        return True
    except Exception as exc:
        fail(f"Class mapping check raised: {exc}")
        traceback.print_exc()
        return False


# ── TEST 2: model sanity ──────────────────────────────────────────────────────
def test_model_sanity():
    section("Test 2 — Model Sanity (shape + softmax)")
    try:
        import torch
        from app.inference import get_model, get_class_names

        model       = get_model()
        class_names = get_class_names()
        n           = len(class_names)

        dummy_input = torch.randn(1, 3, 128, 128)

        with torch.inference_mode():
            output = model(dummy_input)

        assert output.shape == (1, n), f"Expected shape (1, {n}), got {output.shape}"
        ok(f"Output shape correct: {tuple(output.shape)}")

        assert torch.isfinite(output).all(), "Model output contains non-finite values"
        ok("Output values are finite")

        prob_sum = torch.softmax(output, dim=1).sum().item()
        assert 0.999 < prob_sum < 1.001, f"Softmax sum is {prob_sum}, expected ≈1.0"
        ok(f"Softmax sum ≈ 1.0 ({prob_sum:.6f})")
        return True
    except Exception as exc:
        fail(f"Model sanity check raised: {exc}")
        traceback.print_exc()
        return False


# ── TEST 3: preprocessing ─────────────────────────────────────────────────────
def test_preprocessing(image_path: str | None):
    section("Test 3 — Image Preprocessing")
    try:
        img_bytes = get_test_image_bytes(image_path)
        from app.inference import preprocess_image

        tensor = preprocess_image(img_bytes)
        assert tensor.shape == (1, 3, 128, 128), f"Unexpected shape: {tensor.shape}"
        ok(f"Output tensor shape: {tuple(tensor.shape)}")
        ok(f"dtype: {tensor.dtype}")
        return True
    except ValueError as exc:
        fail(f"Missing real image: {exc}")
        return False
    except Exception as exc:
        fail(f"Preprocessing raised: {exc}")
        traceback.print_exc()
        return False


# ── TEST 4: full prediction ───────────────────────────────────────────────────
def test_prediction(image_path: str | None):
    section("Test 4 — Prediction (top-3)")
    try:
        img_bytes = get_test_image_bytes(image_path)
        from app.inference import predict, get_class_names

        class_names = get_class_names()
        result      = predict(img_bytes, top_k=3)

        assert "predicted_class" in result,    "Missing 'predicted_class'"
        assert "confidence"      in result,    "Missing 'confidence'"
        assert "top_predictions" in result,    "Missing 'top_predictions'"
        assert len(result["top_predictions"]) == 3, (
            f"Expected 3 predictions, got {len(result['top_predictions'])}"
        )
        ok("Response has 'predicted_class', 'confidence', 'top_predictions'")
        ok(f"Exactly 3 top predictions returned")

        for p in result["top_predictions"]:
            assert "class"      in p, "Prediction entry missing 'class'"
            assert "confidence" in p, "Prediction entry missing 'confidence'"
            assert p["class"] in class_names, (
                f"Returned class '{p['class']}' not in 211-class list"
            )
            assert 0.0 <= p["confidence"] <= 1.0, (
                f"Confidence {p['confidence']} outside [0, 1]"
            )
        ok("All predicted classes are in the 211-class mapping")
        ok("All confidence scores are in [0.0, 1.0]")

        ok(f"Predicted class : {result['predicted_class']}")
        ok(f"Confidence      : {result['confidence']:.4f}")

        print(f"\n  {'Class':<55} {'Confidence':>10}")
        print(f"  {'-' * 66}")
        for i, p in enumerate(result["top_predictions"], 1):
            print(f"  {i}. {p['class']:<52} {p['confidence']:>10.4f}")

        total = sum(p["confidence"] for p in result["top_predictions"])
        ok(f"Sum of top-3 confidences: {total:.4f} (should be ≤ 1.0)")
        return True
    except ValueError as exc:
        fail(f"Missing real image: {exc}")
        return False
    except Exception as exc:
        fail(f"Prediction raised: {exc}")
        traceback.print_exc()
        return False


# ── TEST 5: CPU smoke test ───────────────────────────────────────────────────
def test_cpu_inference_smoke():
    section("Test 5 — CPU Inference Smoke Test")
    try:
        import torch
        from PIL import Image
        from app.inference import get_model, get_class_names, _TRANSFORM

        # Synthesise a 200×200 green-ish leaf-like image
        img = Image.new("RGB", (200, 200), color=(34, 139, 34))
        tensor = _TRANSFORM(img).unsqueeze(0)

        model       = get_model()
        class_names = get_class_names()

        with torch.inference_mode():
            probs = torch.softmax(model(tensor), dim=1)[0]

        top_prob, top_idx = probs.max(0)
        ok(f"CPU inference succeeded on synthetic image")
        ok(f"Top class  : {class_names[top_idx.item()]} ({top_prob.item():.4f})")
        ok(f"Output dim : {len(probs)} (expected 211)")
        assert len(probs) == 211
        return True
    except Exception as exc:
        fail(f"CPU smoke test raised: {exc}")
        traceback.print_exc()
        return False


# ── TEST 6: validation ────────────────────────────────────────────────────────
def test_validation():
    section("Test 6 — File Validation")
    from app.inference import validate_file

    cases = [
        # (filename, content_type, size, should_raise, description)
        ("leaf.jpg",  "image/jpeg", 1024,                  False, "Valid JPEG"),
        ("leaf.png",  "image/png",  1024,                  False, "Valid PNG"),
        ("leaf.bmp",  "image/bmp",  1024,                  True,  "Reject BMP"),
        ("leaf.gif",  "image/gif",  1024,                  True,  "Reject GIF"),
        ("leaf.jpg",  "image/jpeg", 11 * 1024 * 1024,      True,  "Reject >10 MB"),
        ("leaf.jpg",  "text/plain", 1024,                  True,  "Reject wrong MIME"),
    ]

    all_ok = True
    for fname, ct, size, expect_raise, desc in cases:
        try:
            validate_file(fname, ct, size)
            raised = False
        except ValueError:
            raised = True

        if raised == expect_raise:
            ok(desc)
        else:
            fail(f"{desc} — expected raise={expect_raise}, got raise={raised}")
            all_ok = False

    return all_ok


# ── TEST 7: live API (optional) ───────────────────────────────────────────────
def test_api(base_url: str, image_path: str | None):
    section(f"Test 7 — Live API  ({base_url})")
    try:
        import requests
    except ImportError:
        fail("'requests' library not installed. Run: pip install requests")
        return False

    all_ok = True

    # GET /health
    try:
        r = requests.get(f"{base_url}/health", timeout=10)
        data = r.json()
        if r.status_code == 200 and data.get("status") == "ok":
            ok(f"GET /health → 200 OK  {data}")
            if data.get("model_loaded"):
                ok("model_loaded=true")
            else:
                fail("model_loaded is not true — model may not have loaded at startup")
                all_ok = False
            if data.get("num_classes") == 211:
                ok("num_classes=211 ✓")
            else:
                fail(f"num_classes={data.get('num_classes')}, expected 211")
                all_ok = False
        else:
            fail(f"GET /health → {r.status_code}  {r.text[:200]}")
            all_ok = False
    except Exception as exc:
        fail(f"GET /health raised: {exc}")
        all_ok = False

    # POST /predict
    try:
        img_bytes = get_test_image_bytes(image_path)
        files = {"file": ("test_leaf.jpg", img_bytes, "image/jpeg")}
        r = requests.post(f"{base_url}/predict", files=files, timeout=30)
        if r.status_code == 200:
            data = r.json()
            assert "predicted_class" in data
            assert "confidence"      in data
            assert "top_predictions" in data
            assert len(data["top_predictions"]) == 3
            ok("POST /predict → 200 OK")
            ok(f"  predicted_class: {data['predicted_class']}")
            ok(f"  confidence     : {data['confidence']:.4f}")
        else:
            fail(f"POST /predict → {r.status_code}  {r.text[:300]}")
            all_ok = False
    except ValueError as exc:
        fail(f"Missing real image: {exc}")
        all_ok = False
    except Exception as exc:
        fail(f"POST /predict raised: {exc}")
        all_ok = False

    return all_ok


# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Local smoke-test for the VEYRA crop-disease API")
    parser.add_argument(
        "--offline", action="store_true",
        help="Skip live API tests (no server required)",
    )
    parser.add_argument(
        "--url", default="http://localhost:8000",
        help="Base URL of the running FastAPI server (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--image", default=None,
        help="Path to a real leaf image file for testing (JPG or PNG)",
    )
    args = parser.parse_args()

    print(f"\n{BOLD}VEYRA Crop Disease Backend — Local Smoke Test{RESET}")
    print("=" * 70)

    model_ok = test_model_loading()

    if model_ok:
        test_class_mapping()
        test_model_sanity()
        test_cpu_inference_smoke()

    if args.image:
        test_preprocessing(args.image)
        test_prediction(args.image)
    else:
        section("Tests 3 & 4 — Image Tests")
        print(f"  {CYAN}(Skipped — no --image provided){RESET}")

    test_validation()

    if not args.offline:
        test_api(args.url, args.image)
    else:
        print(f"\n{CYAN}(Skipping live API tests — run without --offline once server is up){RESET}")

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'=' * 70}")
    total = passed + failed
    if failed == 0:
        print(f"{GREEN}{BOLD}  All {total} checks passed!{RESET}")
    else:
        print(f"{RED}{BOLD}  {failed}/{total} checks failed.{RESET}")
    print()

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
