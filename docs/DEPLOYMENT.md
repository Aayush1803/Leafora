# LEAFORA — Cloud Deployment & Production Operations

**Document Version:** 2.0 (Final Release)  
**Date:** October 2026  
**Frontend Deployment:** Vercel Global Edge Network  
**Backend Deployment:** Render Cloud Web Service  
**Production Frontend URL:** `https://LEAFORA-lilac-three.vercel.app`  
**Production Backend URL:** `https://vriksh.onrender.com`  

---

## 1. Production Architecture Overview

LEAFORA adopts a cloud-native, decoupled architecture separating the client-side presentation layer from the inference compute layer. This design enables independent scaling, instant global static delivery, and cost-effective compute allocation.

```mermaid
flowchart TD
    User["End User / Mobile Farmer"] --> |1. HTTPS Request| VercelEdge["Vercel Global Edge Network<br/>(https://LEAFORA-lilac-three.vercel.app)"]
    VercelEdge --> |2. Serves Pre-rendered Static Shell| User
    User --> |3. Uploads Leaf Image<br/>(POST /predict)| RenderLB["Render TLS Reverse Proxy<br/>(https://vriksh.onrender.com)"]
    RenderLB --> |4. Forwards Request| Uvicorn["Uvicorn ASGI Container<br/>(Linux Python 3.11)"]
    Uvicorn --> |5. In-Memory Inference| Model["CropDiseaseCNN<br/>(2.8 MB Checkpoint on CPU)"]
    Model --> |6. Top-3 Prediction JSON| Uvicorn
    Uvicorn --> |7. Response Payload| RenderLB
    RenderLB --> |8. Encrypted HTTPS Response| User
```

---

## 2. Backend Deployment Specification (Render)

### 2.1 Service Configuration

| Setting | Value / Parameter | Notes |
| :--- | :--- | :--- |
| **Service Type** | Web Service | Linux native environment |
| **Repository** | `https://github.com/Aayush1803/Vriksh.git` | Synced to `main` branch |
| **Root Directory** | `.` (Root) or `crop-disease-backend` | Both directories contain full runnable packages |
| **Environment** | Python 3.11.x | Configured via `.python-version` |
| **Build Command** | `pip install -r requirements.txt` | Downloads CPU-only PyTorch wheel |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` | Specified in `Procfile` |
| **Instance Plan** | Free Tier (0.1 CPU, 512 MB RAM) | Model fits comfortably in ~320 MB active RAM |
| **Auto-Deploy** | Enabled | Triggered on git push to `main` |

### 2.2 Critical Build Fix: PyTorch CPU Wheels
Standard PyTorch distributions from PyPI default to CUDA-enabled packages totaling over 2 GB. On Render's 512 MB container build limits, this leads to deployment timeouts. LEAFORA's `requirements.txt` specifies:

```text
--extra-index-url https://download.pytorch.org/whl/cpu

fastapi==0.115.5
uvicorn[standard]==0.32.1
torch==2.4.1
torchvision==0.19.1
Pillow==10.4.0
python-multipart==0.0.12
```

This pins the build to the lightweight ~180 MB CPU wheel, ensuring fast builds and zero CUDA bloat.

### 2.3 Required Environment Variables (Backend)

| Key | Suggested Value | Purpose |
| :--- | :--- | :--- |
| `PYTHONUNBUFFERED` | `1` | Forces immediate flushing of stdout/stderr logs to Render dashboard. |
| `PORT` | Dynamic (`10000` / `$PORT`) | Automatically injected by Render; bound by Uvicorn. |

---

## 3. Frontend Deployment Specification (Vercel)

### 3.1 Project Settings

| Setting | Value / Parameter | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | Next.js | Auto-detected |
| **Root Directory** | `leafora` | Nested frontend directory |
| **Node.js Version** | 20.x | LTS |
| **Build Command** | `npm run build` | Turbopack static compilation |
| **Output Directory** | `.next` | Auto-detected |
| **Install Command** | `npm install` | - |

### 3.2 Required Environment Variables (Frontend)

| Key | Production Value | Development Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://vriksh.onrender.com` | `http://localhost:8000` |
| `NEXT_PUBLIC_APP_URL` | `https://LEAFORA-lilac-three.vercel.app` | `http://localhost:3000` |

---

## 4. Operational Health & Monitoring

### 4.1 Liveness Verification
External uptime monitors (e.g. BetterStack, UptimeRobot) can ping the `/health` endpoint every 5 minutes to keep the Render free-tier container warm:

```bash
curl -f https://vriksh.onrender.com/health || exit 1
```

*Expected Response:*
```json
{"status": "ok", "model": "CropDiseaseCNN", "classes": 211, "model_loaded": true, "device": "cpu"}
```

### 4.2 Free-Tier Sleep Cycle & Mitigation
Render free instances spin down after 15 minutes of inactivity. When a farmer accesses the portal after a dormant period:
1. The first request takes 30–50 seconds to complete while the container boots and loads the 2.8 MB PyTorch weights.
2. LEAFORA's frontend detects extended pending states and displays an informational message: *"Backend service is waking up from sleep mode. Please allow up to 45 seconds..."*
3. Once awake, subsequent requests process in 60–120ms.

---

## 5. Rollback & Disaster Recovery Strategy

If an unexpected runtime regression occurs with the 211-class model:

1. **Model Weight Rollback:** The legacy 38-class Color CNN checkpoint is preserved at `models/best_color_model.pth`, with corresponding classes in `app/classes.py`.
2. **Git Reversion:** A clean git revert of the latest deployment commit restores the prior stable container state:
   ```bash
   git revert HEAD
   git push origin main
   ```
3. **Render Deployment History:** The Render dashboard maintains previous build images. Rolling back to a prior deployment can be performed instantly via the web UI with zero build time.
