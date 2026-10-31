# LEAFORA — Local Development & Setup Guide

**Document Version:** 2.0 (Final Release)  
**Date:** October 2026  
**Audience:** Developers, Evaluators, Maintainers  
**Live Web Application:** [https://LEAFORA-lilac-three.vercel.app](https://LEAFORA-lilac-three.vercel.app)  
**Live Backend API (Render):** [https://vriksh.onrender.com](https://vriksh.onrender.com)  

---

## 1. System Prerequisites

Before beginning local installation, ensure your host development system satisfies the following runtime requirements:

| Component | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Python** | 3.10 | 3.11 or 3.12 | `python --version` |
| **Node.js** | 18.18 | 20.x or 22.x LTS | `node --version` |
| **npm** | 9.0 | 10.x | `npm --version` |
| **Git** | 2.30+ | Latest | `git --version` |
| **RAM** | 4 GB | 8 GB+ | - |
| **Disk Space** | 2 GB free | 5 GB free | - |

---

## 2. Repository Architecture & Directory Structure

```
HclProject/
├── app/                           # Root backend package (synced with crop-disease-backend)
│   ├── __init__.py
│   ├── classes.py                 # Legacy 38-class reference (rollback only)
│   ├── inference.py               # Singleton loader & predict helper
│   ├── main.py                    # FastAPI entrypoint, CORS, routes
│   └── model.py                   # 211-class CropDiseaseCNN architecture
├── crop-disease-backend/          # Standalone backend directory
│   ├── app/                       # FastAPI source
│   ├── models/                    # Active weights & config
│   │   ├── veyra_cnn_best.pth     # Active 211-class model (2.8 MB)
│   │   ├── model_config.json      # 211-class mapping & metadata
│   │   └── best_color_model.pth   # Legacy 38-class weights (rollback only)
│   ├── requirements.txt           # Backend Python dependencies
│   ├── test_local.py              # Backend offline/online test suite
│   └── Procfile                   # Process start command
├── leafora/                         # Active Next.js 16 frontend
│   ├── app/                       # Next.js App Router (page.tsx, layout.tsx, etc.)
│   ├── components/                # React UI components (ResultPanel, Navigation, etc.)
│   ├── lib/                       # API client (api.ts) & utilities
│   ├── package.json               # Node.js dependencies & scripts
│   └── tsconfig.json              # TypeScript configuration
├── docs/                          # Comprehensive project documentation
│   ├── assets/                    # Graphs, diagrams, and evaluation plots
│   ├── PRD.md                     # Product Requirements Document
│   ├── ARCHITECTURE.md            # System & ML architecture
│   ├── MODEL_CARD.md              # Model card & evaluation metrics
│   ├── REPORT.md                  # Comprehensive technical project report
│   ├── API.md                     # REST API specification
│   ├── SETUP.md                   # Setup & developer guide
│   ├── DATASET.md                 # Dataset provenance & analysis
│   ├── EXPERIMENTS.md             # Training history & experiments
│   ├── TESTING.md                 # Verification & test suite
│   ├── DEPLOYMENT.md              # Cloud deployment architecture
│   ├── LIMITATIONS_AND_FUTURE_SCOPE.md # Limitations & future work
│   └── CHANGELOG.md               # Version changelog
├── models/                        # Root models directory
│   ├── veyra_cnn_best.pth
│   ├── model_config.json
│   └── best_color_model.pth
├── requirements.txt               # Root Python dependencies (with PyTorch CPU index)
├── Procfile                       # Root deployment process command
└── test_local.py                  # Root test runner
```

---

## 3. Backend Setup & Startup

The backend is built with FastAPI and runs on CPU-optimized PyTorch.

### Step 3.1: Create a Python Virtual Environment

#### On Windows (PowerShell):
```powershell
# Navigate to the backend folder (or project root)
cd c:\Users\Aayush\OneDrive\HclProject\crop-disease-backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1
```

#### On Linux / macOS:
```bash
cd crop-disease-backend
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3.2: Install Python Dependencies

The `requirements.txt` file specifies the lightweight CPU-only build of PyTorch:

```bash
pip install -r requirements.txt
```

> **Note on PyTorch Installation:**  
> The `requirements.txt` contains `--extra-index-url https://download.pytorch.org/whl/cpu`. This allows pip to fetch standard packages (FastAPI, Uvicorn, Pillow) from PyPI while resolving the ~180 MB CPU-only PyTorch wheel from the extra index, saving bandwidth and disk space.

### Step 3.3: Verify Model Checkpoint Presence

Confirm that the model weights are located in `models/`:
* `models/veyra_cnn_best.pth` (2.8 MB)
* `models/model_config.json` (7.2 KB)

If missing, copy them from `LEAFORA_Final-20261020T172259Z-1-001/LEAFORA_Final/model/`.

### Step 3.4: Run the Backend Smoke Test

Verify that model loading, tensor shapes, and file validation pass:

```bash
python test_local.py --offline
```
*Expected output: `All 19 checks passed!`*

### Step 3.5: Start the Local FastAPI Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will now be accessible at:
* Local API Root: `http://localhost:8000`
* Interactive OpenAPI Documentation (Swagger UI): `http://localhost:8000/docs`
* ReDoc Documentation: `http://localhost:8000/redoc`
* Health Check: `http://localhost:8000/health`

---

## 4. Frontend Setup & Startup

The frontend is built with Next.js 16 (App Router), React 19, and Tailwind CSS.

### Step 4.1: Navigate to Frontend Directory & Install Dependencies

Open a new terminal window:

```bash
cd c:\Users\Aayush\OneDrive\HclProject\leafora
npm install
```

### Step 4.2: Configure Environment Variables

Create or edit `leafora/.env.local`:

```env
# For connecting to local FastAPI backend:
NEXT_PUBLIC_API_URL=http://localhost:8000

# OR for connecting to live production backend on Render:
# NEXT_PUBLIC_API_URL=https://vriksh.onrender.com
```

### Step 4.3: Start the Next.js Development Server

```bash
npm run dev
```

Open your browser at **`http://localhost:3000`**. You will see the LEAFORA diagnostic workspace.

### Step 4.4: Verify Production Build

To test the optimized production build locally:

```bash
npm run build
npm run start
```

---

## 5. End-to-End Local Verification Workflow

1. With `uvicorn` running in Terminal 1 (`http://localhost:8000`) and `npm run dev` running in Terminal 2 (`http://localhost:3000`):
2. Open `http://localhost:3000` in your web browser.
3. Drag and drop any valid leaf photograph (JPEG/PNG $\le 10\text{ MB}$) into the upload workspace.
4. Click **Analyze Leaf**.
5. Observe the network tab: `POST http://localhost:8000/predict` returns HTTP 200 within ~100ms.
6. Observe the UI: The prediction panel animates into view displaying the top predicted disease, confidence percentage, and recommended actions.

---

## 6. Troubleshooting Common Issues

### Issue 1: Windows Console `charmap` Encoding Error
* **Symptom:** `UnicodeEncodeError: 'charmap' codec can't encode characters...`
* **Cause:** Default Windows PowerShell / CMD code page (cp1252) cannot display UTF-8 box characters.
* **Resolution:** Run `$env:PYTHONIOENCODING="utf-8"` in PowerShell before executing python scripts, or rely on the updated `test_local.py` which auto-reconfigures standard output streams.

### Issue 2: CORS Network Error on Frontend
* **Symptom:** `Failed to fetch` or CORS policy error in browser console.
* **Cause:** Backend server is not running, or frontend `NEXT_PUBLIC_API_URL` points to an incorrect address.
* **Resolution:** Ensure FastAPI is listening on port 8000 (`http://localhost:8000/health` returns `{"status": "ok"}`) and verify `.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000`.

### Issue 3: PyTorch Large Download or Memory Exhaustion
* **Symptom:** `pip install` hangs or downloads gigabytes of CUDA packages.
* **Cause:** `pip` defaulted to standard PyPI CUDA wheels.
* **Resolution:** Ensure `requirements.txt` includes `--index-url https://download.pytorch.org/whl/cpu` at the top of the file.

### Issue 4: Render Backend Cold Starts
* **Symptom:** Initial prediction takes 40+ seconds when connecting to `https://vriksh.onrender.com`.
* **Cause:** Render free-tier services spin down after 15 minutes of inactivity.
* **Resolution:** This is standard serverless cold-start behavior. The frontend displays an alert to notify users that the backend is waking up.
