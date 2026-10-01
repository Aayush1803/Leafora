#!/usr/bin/env python3
"""
test_local.py — Local smoke-test for the Crop Disease Detection backend.

Run BEFORE deploying to Railway to verify:
  1. Model loads successfully from models/best_color_model.pth
  2. A sanity check verifies input [1,3,128,128] -> output [1,38]
  3. A real PlantVillage image can be processed
  4. /predict returns exactly 3 top predictions
  5. All confidence values sum to ~1.0
  6. The API server responds to GET /health  (requires server to be running)
  7. The API server responds to POST /predict (requires server to be running)

Usage
-----
# Test model + inference logic only (no server needed):
  python test_local.py --offline --image path/to/leaf.jpg

# Full test including live API calls (start uvicorn first):
  uvicorn app.main:app --reload   # in a separate terminal
  python test_local.py --image path/to/leaf.jpg

# Custom server URL:
  python test_local.py --url http://localhost:8000 --image path/to/leaf.jpg
"""

import argparse
import io
import os
import sys
import time
import traceback
from pathlib import Path

# Ensure the project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

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
        raise ValueError("A real PlantVillage image is required. Provide it via --image <path>.")
    
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found at {path}")
    
    with open(path, "rb") as f:
        return f.read()


# ── TEST 1: model loading ─────────────────────────────────────────────────────
def test_model_loading():
    section("Test 1 — Model Loading")
    try:
        from app.inference import load_model, _MODEL_PATH
        print(f"  Model path: {_MODEL_PATH}")
        if not _MODEL_PATH.exists():
            fail(f"best_color_model.pth not found at {_MODEL_PATH}")
            print(f"       {RED}→ Copy your .pth file to models/best_color_model.pth{RESET}")
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


# ── TEST 1.5: model sanity ────────────────────────────────────────────────────
def test_model_sanity():
    section("Test 1.5 — Model Sanity")
    try:
        import torch
        from app.inference import get_model
        model = get_model()
        dummy_input = torch.randn(1, 3, 128, 128)
        
        with torch.no_grad():
            output = model(dummy_input)
            
        assert output.shape == (1, 38), f"Expected shape (1, 38), got {output.shape}"
        ok(f"Output shape is correct: {tuple(output.shape)}")
        
        prob_sum = torch.softmax(output, dim=1).sum().item()
        assert 0.99 < prob_sum < 1.01, f"Softmax sum is {prob_sum}, expected ~1.0"
        ok(f"Softmax sum ≈ 1.0 ({prob_sum:.4f})")
        return True
    except Exception as exc:
        fail(f"Model sanity check raised: {exc}")
        traceback.print_exc()
        return False


# ── TEST 2: preprocessing ────────────────────────────────────────────────────
def test_preprocessing(image_path: str | None):
    section("Test 2 — Image Preprocessing")
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


# ── TEST 3: full prediction ───────────────────────────────────────────────────
def test_prediction(image_path: str | None):
    section("Test 3 — Prediction (top-3)")
    try:
        img_bytes = get_test_image_bytes(image_path)
        from app.inference import predict
        from app.classes import CLASS_NAMES
        
        result = predict(img_bytes, top_k=3)

        assert "predicted_class" in result, "Missing 'predicted_class'"
        assert "confidence" in result, "Missing 'confidence'"
        assert "top_predictions" in result, "Missing 'top_predictions'"
        assert len(result["top_predictions"]) == 3, (
            f"Expected 3 predictions, got {len(result['top_predictions'])}"
        )
        
        for p in result["top_predictions"]:
            assert p["class"] in CLASS_NAMES, f"Invalid class predicted: {p['class']}"

        ok(f"Predicted class : {result['predicted_class']}")
        ok(f"Confidence      : {result['confidence']:.4f}")
        print(f"\n  {'Class':<55} {'Confidence':>10}")
        print(f"  {'-'*66}")
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


# ── TEST 4: validation ────────────────────────────────────────────────────────
def test_validation():
    section("Test 4 — File Validation")
    from app.inference import validate_file

    cases = [
        # (filename, content_type, size, should_raise, description)
        ("leaf.jpg",  "image/jpeg", 1024,                   False, "Valid JPEG"),
        ("leaf.png",  "image/png",  1024,                   False, "Valid PNG"),
        ("leaf.bmp",  "image/bmp",  1024,                   True,  "Reject BMP"),
        ("leaf.gif",  "image/gif",  1024,                   True,  "Reject GIF"),
        ("leaf.jpg",  "image/jpeg", 11 * 1024 * 1024,       True,  "Reject >10 MB"),
        ("leaf.jpg",  "text/plain", 1024,                   True,  "Reject wrong MIME"),
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


# ── TEST 5: live API (optional) ───────────────────────────────────────────────
def test_api(base_url: str, image_path: str | None):
    section(f"Test 5 — Live API  ({base_url})")
    try:
        import requests
    except ImportError:
        fail("'requests' library not installed. Run: pip install requests")
        return False

    all_ok = True

    # GET /health
    try:
        r = requests.get(f"{base_url}/health", timeout=10)
        if r.status_code == 200 and r.json().get("status") == "ok":
            ok(f"GET /health → 200 OK  {r.json()}")
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
            assert len(data["top_predictions"]) == 3
            ok(f"POST /predict → 200 OK")
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
    parser = argparse.ArgumentParser(description="Local smoke-test for the crop-disease API")
    parser.add_argument("--offline", action="store_true",
                        help="Skip live API tests (no server required)")
    parser.add_argument("--url", default="http://localhost:8000",
                        help="Base URL of the running FastAPI server (default: http://localhost:8000)")
    parser.add_argument("--image", default=None,
                        help="Path to a real PlantVillage image file for testing")
    args = parser.parse_args()

    print(f"\n{BOLD}Crop Disease Backend — Local Smoke Test{RESET}")
    print("=" * 70)

    model_ok = test_model_loading()

    if model_ok:
        test_model_sanity()
        test_preprocessing(args.image)
        test_prediction(args.image)

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
