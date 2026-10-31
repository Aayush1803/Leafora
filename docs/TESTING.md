# LEAFORA — Verification, Testing & Quality Assurance

**Document Version:** 2.0 (Final Release)  
**Date:** October 2026  
**Quality Status:** Approved for Release  
**Test Frameworks:** Python `unittest` / `test_local.py`, Next.js Build Pipeline, TypeScript Compiler (`tsc`)  

---

## 1. Quality Assurance Strategy & Test Matrix

LEAFORA utilizes a multi-tiered verification methodology spanning offline model sanity checks, defensive input validation, static TypeScript typechecking, and production frontend bundling.

```
+---------------------------------------------------------------------------------+
|                                 TEST PYRAMID                                    |
+---------------------------------------------------------------------------------+
| [Tier 4] End-to-End Diagnostic Flow (Client drag/drop to API prediction)        |
| [Tier 3] Frontend Production Build & TypeScript Verification (npm run build)    |
| [Tier 2] Backend Input Validation & MIME Defenses (test_local.py Test 6)        |
| [Tier 1] Model Sanity, Tensor Dimensions, Weights Safety (test_local.py Tests 1-5)|
+---------------------------------------------------------------------------------+
```

---

## 2. Comprehensive Test Execution Results

All available checks were executed on the active repository. Outcomes are strictly labeled as **`PASS`**, **`FAIL`**, **`NOT RUN`**, or **`BLOCKED`**.

### 2.1 Backend Offline Smoke Test Suite (`test_local.py --offline`)

**Command:**
```powershell
python test_local.py --offline
```

| Check ID | Verification Area | Condition Tested | Result | Details |
| :---: | :--- | :--- | :---: | :--- |
| **TC-01** | Checkpoint Loading | Model weights load from `models/veyra_cnn_best.pth` | **PASS** | File exists, valid state dictionary |
| **TC-02** | Architecture Integrity | Instantiated class is `CropDiseaseCNN` | **PASS** | Matches training class signature |
| **TC-03** | Parameter Count | Total trainable parameter count equals 703,603 | **PASS** | Verified: 703,603 parameters |
| **TC-04** | Class Count Alignment | Config `num_classes` and `class_to_idx` size equal 211 | **PASS** | 211 classes mapped |
| **TC-05** | Class Spot-Check | Verify `tomato_late_blight` is present in mapping | **PASS** | Found at index |
| **TC-06** | Class Spot-Check | Verify `apple_scab` is present in mapping | **PASS** | Found at index |
| **TC-07** | Output Shape Sanity | Random input tensor `[1, 3, 128, 128]` produces `[1, 211]` | **PASS** | Exact dimensions verified |
| **TC-08** | Numerical Stability | Check that output logits contain no NaNs or Infs | **PASS** | `torch.isfinite(output).all()` confirmed |
| **TC-09** | Probability Sum | Softmax output across 211 classes sums to $1.0 \pm 10^{-5}$ | **PASS** | Sum = 1.000000 |
| **TC-10** | Synthetic Inference | Synthetic PIL JPEG preprocessed and inferred on CPU | **PASS** | Forward pass completes cleanly |
| **TC-11** | Output Dimensionality | CPU inference returns array of length 211 | **PASS** | Top prediction: `corn_maize_healthy` |
| **TC-12** | Input Validation | Valid JPEG image accepted | **PASS** | 200 OK equivalent |
| **TC-13** | Input Validation | Valid PNG image accepted | **PASS** | 200 OK equivalent |
| **TC-14** | Defensive Rejection | BMP image format rejected | **PASS** | Correctly raises HTTP 422 |
| **TC-15** | Defensive Rejection | GIF image format rejected | **PASS** | Correctly raises HTTP 422 |
| **TC-16** | Defensive Rejection | File payload exceeding 10 MB rejected | **PASS** | Correctly raises HTTP 422 |
| **TC-17** | Defensive Rejection | Mismatched MIME type header rejected | **PASS** | Correctly raises HTTP 422 |
| **TC-18** | Checkpoint Deserialization | Verify `weights_only=True` loads safely without pickle hazard | **PASS** | Confirmed safe unpickling |
| **TC-19** | Output Finiteness | Logits generated from real checkpoint are strictly finite | **PASS** | All values within floating point range |

**Backend Summary: 19 / 19 Offline Checks PASSED (100% Success Rate).**

---

### 2.2 Frontend Build & Static Analysis (`npm run build`)

**Command:**
```bash
cd LEAFORA
npm run build
```

| Check ID | Verification Area | Target / Tool | Result | Details |
| :---: | :--- | :--- | :---: | :--- |
| **TC-20** | TypeScript Typecheck | `tsc` / Next.js Compiler | **PASS** | Finished in 2.1s with 0 type errors |
| **TC-21** | Route Compilation | Turbopack Next.js 16 | **PASS** | All routes (`/`, `/about`, `/insights`, `/_not-found`) compiled |
| **TC-22** | Static Generation | Static HTML Pre-rendering | **PASS** | 6 of 6 static pages generated in 853ms |
| **TC-23** | Component Rendering | React 19 Client Components | **PASS** | `UploadWorkspace`, `ResultPanel`, `ConfidenceDisplay` bundle cleanly |

**Frontend Summary: Build Successful with 0 Warnings or Errors.**

---

### 2.3 Online & Deployment Verification Status

| Check ID | Verification Scenario | Status | Documented Rationale |
| :---: | :--- | :---: | :--- |
| **TC-24** | Local Live API Server (`GET /health`) | **NOT RUN** | Local FastAPI server was not kept running as a background daemon during this documentation verification phase. |
| **TC-25** | Local Live API Prediction (`POST /predict`) | **NOT RUN** | Requires live local server running concurrently with a committed test image. |
| **TC-26** | Remote Render Production Deployment | **PASS** | Live deployment active at `https://leafora-3xm6.onrender.com/health` (Render service configured and verified). |
| **TC-27** | Remote Vercel Production Deployment | **PASS** | Client application active at `https://leafora-one.vercel.app` connecting to Render backend (`https://leafora-3xm6.onrender.com`). |
| **TC-28** | Hardware CUDA Acceleration | **NOT RUN** | Host development machine utilizes CPU inference; production cloud runs on CPU. GPU is only required for training. |

---

## 3. Reproduction Commands for Continuous Integration

### Complete CI Test Script
```powershell
# 1. Test Backend Offline Suite
$env:PYTHONIOENCODING="utf-8"
python test_local.py --offline

# 2. Test Frontend Typecheck and Build
cd LEAFORA
npm run build
cd ..
```
