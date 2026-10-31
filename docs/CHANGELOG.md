# LEAFORA — Project Changelog

All notable changes to the **LEAFORA** crop disease detection platform are documented in this file based on verifiable repository commits and engineering releases.

---

## [2.0.0] - 2026-10-21 (Final Release)

### Added
* **211-Class Custom CNN Inference:** Transitioned active backend to the finalized 211-class `CropDiseaseCNN` trained on 199,377 manifest samples.
* **Deep Input Verification:** Added binary magic-byte decoding in `app/inference.py` via Pillow to verify image content and prevent MIME-spoofing attacks.
* **Top-3 Differential Predictions:** Enhanced `/predict` endpoint to return primary prediction plus ranked `top_predictions` with individual probability values.
* **CPU-Only Wheel Pinning:** Added `--index-url https://download.pytorch.org/whl/cpu` to root `requirements.txt` to eliminate 2 GB CUDA package downloads on Render.
* **Liveness & Readiness Hardening:** Updated `/health` endpoint to return HTTP 503 if the model fails to load at startup.
* **Windows Terminal Reliability:** Added automatic `sys.stdout` UTF-8 stream reconfiguration in `test_local.py` to prevent cp1252 charmap encoding errors.
* **Evaluation Graphs & Artifacts:** Integrated 6 empirical evaluation graphs (`training_validation_accuracy.png`, `training_validation_loss.png`, `test_performance_metrics.png`, `confusion_matrix_top20.png`, `strongest_20_classes_f1.png`, `weakest_20_classes_f1.png`) into `docs/assets/`.
* **Complete Documentation Suite:** Authored exhaustive B.Tech CSE-AIML final-year project documentation suite (`PRD.md`, `ARCHITECTURE.md`, `MODEL_CARD.md`, `REPORT.md`, `API.md`, `SETUP.md`, `DATASET.md`, `EXPERIMENTS.md`, `TESTING.md`, `DEPLOYMENT.md`, `LIMITATIONS_AND_FUTURE_SCOPE.md`, `CHANGELOG.md`).

### Changed
* **Root README Overhaul:** Replaced outdated 38-class claims with accurate 211-class specifications, test metrics (87.95% accuracy, 88.47% weighted F1), and system architecture.
* **Frontend UI Polish:** Updated Next.js frontend components (`ResultPanel.tsx`, `ConfidenceDisplay.tsx`, `Navigation.tsx`, `insights/page.tsx`, `about/page.tsx`) to showcase 211 categories, real-time client validation, and clear confidence badges.
* **Synchronized Backend Layout:** Unified root `app/` and `crop-disease-backend/app/` to guarantee identical behavior across any deployment root.

### Preserved
* **Rollback Artifacts:** Retained legacy 38-class checkpoint `models/best_color_model.pth` (4.8 MB) and `app/classes.py` as unimported reference artifacts.

---

## [1.1.0] - 2026-10-01

### Added
* **Next.js 16 Web Application:** Bootstrapped modern React frontend in `LEAFORA/` with drag-and-drop upload workspace and Framer Motion micro-animations.
* **FastAPI Backend Structure:** Created initial FastAPI inference service with Uvicorn ASGI server and Render deployment configuration (`Procfile`).
* **Python Runtime Specification:** Added `.python-version` specifying Python 3.11 for Render compatibility.

---

## [1.0.0] - 2026-10-01 (Prototype Baseline)

### Added
* **Initial 38-Class Color CNN:** Initial proof-of-concept backend trained on PlantVillage 38-class color dataset (`best_color_model.pth`).
* **Basic Smoke Test:** Added baseline test script `test_local.py` for shape and endpoint verification.
