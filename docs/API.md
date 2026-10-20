# VEYRA — REST API Specification

**API Version:** 1.0.0  
**Base Protocol:** HTTPS / HTTP/1.1  
**Default Port (Local):** `8000`  
**Production Host:** `https://vriksh.onrender.com`  
**Local Development Host:** `http://localhost:8000`  
**Framework:** FastAPI 0.115 / Uvicorn 0.32 (ASGI)  

---

## 1. Overview & Service Contract

The VEYRA backend provides a lightweight, stateless inference API for automated crop disease classification. All inference operations are executed synchronously on CPU memory without intermediate filesystem persistence.

### Key Operational Characteristics
* **Statelessness:** No client sessions, state tokens, or database records are maintained.
* **CORS Policy:** Permissive CORS enabled (`allow_origins=["*"]`) to support requests from the decoupled Vercel frontend, local development hosts, and third-party diagnostic clients.
* **Cold Starts:** When deployed on Render's free cloud tier, instances spin down after inactivity. Initial connection attempts may experience a 30–50 second spin-up latency.

---

## 2. API Endpoints

### 2.1 Health & Liveness Check: `GET /health`

Returns operational status, model residency in memory, active class count, and compute device.

* **Path:** `/health`
* **HTTP Method:** `GET`
* **Authentication:** None (Public)
* **Request Headers:** None

#### Response: Model Loaded (`200 OK`)
Returned when the FastAPI worker is operational and `CropDiseaseCNN` is resident in memory:
```json
{
  "status": "ok",
  "model": "CropDiseaseCNN",
  "classes": 211,
  "model_loaded": true,
  "device": "cpu"
}
```

#### Response: Model Unavailable (`503 Service Unavailable`)
Returned if the server started but the model checkpoint could not be found or loaded:
```json
{
  "status": "error",
  "model": "CropDiseaseCNN",
  "classes": 211,
  "model_loaded": false,
  "device": "cpu",
  "detail": "Model weights not loaded"
}
```

---

### 2.2 Crop Disease Prediction: `POST /predict`

Receives a leaf photograph and returns the primary predicted pathology alongside ranked top-3 differential candidates with probability scores.

* **Path:** `/predict`
* **HTTP Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Authentication:** None (Public)

#### Request Payload Specification

| Form Field | Type | Required | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- |
| `file` | `File` (Binary) | **Yes** | `.jpg`, `.jpeg`, `.png`<br/>$\le 10\text{ MB}$ (10,485,760 bytes) | High-resolution or standard photo of a single infected or healthy plant leaf. |

#### Successful Prediction Response (`200 OK`)
```json
{
  "predicted_class": "tomato_late_blight",
  "confidence": 0.9812,
  "top_predictions": [
    {
      "class": "tomato_late_blight",
      "confidence": 0.9812
    },
    {
      "class": "tomato_early_blight",
      "confidence": 0.0143
    },
    {
      "class": "tomato_leaf_mold",
      "confidence": 0.0031
    }
  ]
}
```

#### Response Fields Detailed:
* `predicted_class` (`string`): The canonical snake_case class name of the highest-confidence prediction (e.g. `tomato_late_blight`, `corn_maize_common_rust`, `apple_healthy`).
* `confidence` (`float`): Float between `0.0` and `1.0` representing the softmax posterior probability for the top-1 prediction. (Multiplied by 100 on the frontend for percentage display).
* `top_predictions` (`array[object]`): Exactly 3 ranked prediction objects, each containing:
  * `class` (`string`): The class label.
  * `confidence` (`float`): The softmax probability for that class.

---

## 3. Error Handling & Status Codes

The API utilizes standard HTTP status codes and uniform JSON error envelopes (`{"detail": "..."}`).

| HTTP Status | Reason | Trigger Condition | JSON Response Body |
| :---: | :--- | :--- | :--- |
| **`422`** | Unprocessable Entity | Unsupported file extension (e.g. `.webp`, `.bmp`, `.pdf`) | `{"detail": "Unsupported file extension '.bmp'. Allowed: .jpg, .jpeg, .png"}` |
| **`422`** | Unprocessable Entity | File size exceeds 10 MB limit | `{"detail": "File size (12.4 MB) exceeds 10 MB limit."}` |
| **`422`** | Unprocessable Entity | Corrupt binary stream or spoofed MIME type | `{"detail": "Corrupt or unreadable image file."}` |
| **`422`** | Unprocessable Entity | Missing `file` field in form submission | Standard FastAPI validation error object |
| **`503`** | Service Unavailable | Backend model is not loaded in worker memory | `{"detail": "Model is not loaded. Please contact server administrator."}` |
| **`500`** | Internal Server Error | Unexpected compute or memory fault during inference | `{"detail": "Internal inference error: <exception_message>"}` |

---

## 4. Usage Examples

### 4.1 cURL

#### Health Check
```bash
curl -X GET https://vriksh.onrender.com/health
```

#### Prediction Request
```bash
curl -X POST https://vriksh.onrender.com/predict \
  -F "file=@/path/to/leaf_photo.jpg"
```

### 4.2 Windows PowerShell

#### Health Check
```powershell
Invoke-RestMethod -Uri "https://vriksh.onrender.com/health" -Method Get
```

#### Prediction Request
```powershell
Invoke-RestMethod `
  -Uri "https://vriksh.onrender.com/predict" `
  -Method Post `
  -Form @{ file = Get-Item "C:\data\tomato_leaf.jpg" }
```

### 4.3 Python (`requests`)

```python
import requests

url = "https://vriksh.onrender.com/predict"
file_path = "sample_leaf.jpg"

with open(file_path, "rb") as f:
    files = {"file": (file_path, f, "image/jpeg")}
    response = requests.post(url, files=files, timeout=30)

if response.status_code == 200:
    data = response.json()
    print(f"Top Disease: {data['predicted_class']}")
    print(f"Confidence:  {data['confidence'] * 100:.2f}%")
    for rank, item in enumerate(data["top_predictions"], start=1):
        print(f"  {rank}. {item['class']} ({item['confidence'] * 100:.2f}%)")
else:
    print(f"Error {response.status_code}: {response.text}")
```

### 4.4 Frontend TypeScript Integration (`lib/api.ts`)

```typescript
export interface TopPrediction {
  class: string;
  confidence: number;
}

export interface PredictResponse {
  predicted_class: string;
  confidence: number;
  top_predictions: TopPrediction[];
}

export async function predictCropDisease(file: File): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Server responded with status ${res.status}`);
  }

  return res.json();
}
```
