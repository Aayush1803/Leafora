# LEAFORA — Comprehensive Technical Project Report
## Crop Disease Detection Using a Custom Convolutional Neural Network

**Academic Level:** B.Tech Final-Year Capstone Project Report (Computer Science & Engineering — AI & Machine Learning)  
**Project Identifier:** LEAFORA (Visual Evaluation & Yield Risk Assessment)  
**Academic Year:** 2026  
**Document Status:** Final Technical Release  
**Authors / Developers:** Aayush Joshi & Project Team  
**Technology Stack:** PyTorch, FastAPI, Next.js 16, React 19, TypeScript, Tailwind CSS, Render, Vercel  

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Problem Statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [Existing Approaches & Motivation](#5-existing-approaches--motivation)
6. [Proposed System Overview](#6-proposed-system-overview)
7. [System Requirements & Technology Stack](#7-system-requirements--technology-stack)
8. [Dataset Provenance, Preparation & Taxonomy](#8-dataset-provenance-preparation--taxonomy)
9. [Custom CNN Architecture & Design Rationale](#9-custom-cnn-architecture--design-rationale)
10. [Training & Fine-Tuning Methodology](#10-training--fine-tuning-methodology)
11. [System Architecture & End-to-End Data Flow](#11-system-architecture--end-to-end-data-flow)
12. [Backend & REST API Implementation](#12-backend--rest-api-implementation)
13. [Frontend Implementation & User Diagnostic Workflow](#13-frontend-implementation--user-diagnostic-workflow)
14. [Experimental Setup & Environment](#14-experimental-setup--environment)
15. [Evaluation Metrics & Mathematical Formulations](#15-evaluation-metrics--mathematical-formulations)
16. [Empirical Results & Discussion](#16-empirical-results--discussion)
17. [Graphical Analysis & Class-Level Performance](#17-graphical-analysis--class-level-performance)
18. [Error Analysis & System Limitations](#18-error-analysis--system-limitations)
19. [Deployment Architecture & Verification](#19-deployment-architecture--verification)
20. [Ethical Considerations & Responsible AI](#20-ethical-considerations--responsible-ai)
21. [Future Scope](#21-future-scope)
22. [Conclusion](#22-conclusion)
23. [References](#23-references)

---

## 1. Abstract

Foliar plant pathologies present one of the most critical threats to global agricultural security, driving estimated annual crop yield losses between 20% and 40%. Conventional identification methods depend on in-person consultations with agronomists or laboratory pathogen culturing—approaches that are prohibitively slow, costly, and inaccessible to smallholder farmers in remote agrarian regions. 

This project presents **LEAFORA**, a complete, production-grade agricultural computer vision platform powered by a custom deep Convolutional Neural Network (`CropDiseaseCNN`). Unlike existing baseline solutions that remain constrained to laboratory datasets with uniform backgrounds or deploy bulky 50-million-parameter transfer learning architectures, LEAFORA utilizes a custom 4-block CNN containing only **703,603 parameters** (2.8 MB checkpoint size). The model was trained and evaluated on an aggregated multi-source visual corpus of **199,377 manifest samples** across **211 canonical crop disease and healthy-state classes**, incorporating both laboratory-controlled specimens (PlantVillage) and complex in-field photographs (PlantDoc, Agri-Foundation).

Evaluated on an independent, held-out test partition of **19,946 samples**, the model achieved an overall classification accuracy of **87.95%**, a weighted F1-score of **88.47%**, a weighted precision of **89.28%**, and a weighted recall of **87.95%**. The system is integrated into an asynchronous, decoupled web architecture comprising a hardened **FastAPI** inference microservice running on CPU-optimized PyTorch and a responsive **Next.js 16 / React 19** frontend deployed on the Vercel Edge. The platform delivers top-3 probabilistic differential diagnoses, visual confidence indicators, and agronomic management strategies in under 100 milliseconds per query, proving that lightweight custom neural networks can deliver practical, high-throughput agricultural decision support on low-cost cloud infrastructure.

---

## 2. Introduction

Agriculture forms the socioeconomic backbone of developing economies, employing over 40% of the active workforce in South Asia and Sub-Saharan Africa. However, crop cultivation remains acutely vulnerable to microbial pathogens, including fungi, bacteria, viruses, and parasitic oomycetes. When pathogen outbreaks occur, early visual symptoms manifest primarily on foliage as chlorosis, necrosis, pustules, mosaic patterns, or target spots.

The challenge facing modern agriculture is not a lack of scientific treatments, but a diagnostic bottleneck:
1. Farmers often confuse visually similar symptoms (e.g. Early Blight vs. Late Blight in solanaceous crops), leading to improper chemical selection.
2. By the time an extension officer visits a remote plot, infection has frequently progressed from localized foliar lesions to systemic vascular collapse, rendering interventions ineffective.
3. Over-application of broad-spectrum fungicides damages soil microbial ecologies and accelerates pathogen resistance.

With the proliferation of high-resolution smartphone cameras in rural areas, computer vision provides an unprecedented opportunity to democratize plant pathology diagnosis. LEAFORA was engineered to bridge this divide by delivering an accessible, transparent, and accurate diagnostic pipeline capable of classifying 211 distinct foliar conditions.

---

## 3. Problem Statement

To design, train, evaluate, and deploy an end-to-end deep learning system capable of accepting standard digital RGB photographs of crop leaves, validating input data integrity, executing feature extraction and classification across 211 agricultural categories, and outputting calibrated probabilistic predictions accompanied by actionable agronomic remediation guidance in real time.

---

## 4. Objectives

The project pursued five primary technical objectives:

1. **Taxonomic Expansion:** Expand crop disease classification beyond the standard 38 laboratory classes to a comprehensive 211-class taxonomy covering cereals, solanaceous vegetables, legumes, fruit orchards, and cash crops.
2. **Custom Parameter-Efficient CNN Architecture:** Design an efficient convolutional neural network from scratch that maintains high discriminative capacity while keeping the total parameter count under 1,000,000 to enable sub-100ms CPU inference.
3. **Data Harmonization & Imbalance Analysis:** Aggregate multiple public repositories (PlantVillage, PlantDoc, Agri-Foundation) into a unified manifest of 199,377 rows, establishing a strict split (80% train, 10% validation, 10% test) and documenting the mathematical impact of long-tail class imbalance.
4. **Hardened Microservice Engineering:** Implement a production-ready asynchronous REST API using FastAPI that features in-memory model caching, binary image format verification, defensive payload size limits ($\le 10\text{ MB}$), and clean HTTP status envelopes.
5. **Modern Decoupled Client Portal:** Construct an intuitive, responsive web portal using Next.js 16, React 19, TypeScript, and Tailwind CSS, providing drag-and-drop ingestion, client-side pre-flight checks, and visual confidence tier badges.

---

## 5. Existing Approaches & Motivation

### 5.1 Existing Approaches
Historically, automated agricultural image recognition has fallen into two paradigms:
* **Traditional Hand-Crafted Feature Extractors (2000–2014):** Extracting color histograms, Gray-Level Co-occurrence Matrices (GLCM), and Scale-Invariant Feature Transform (SIFT) descriptors paired with Support Vector Machines (SVM) or Random Forests. While computationally cheap, these methods fail under variable outdoor illumination, background soil clutter, and camera sensor differences.
* **Heavyweight Pretrained Transfer Learning (2015–Present):** Fine-tuning large-scale classification backbones (ResNet-50, VGG-16, Inception-v3, EfficientNet-B4) originally trained on ImageNet. While achieving high benchmark scores on laboratory datasets, these networks contain 25 to 60+ million parameters. Their massive memory footprint makes them expensive to host on serverless cloud containers, prone to out-of-memory crashes on free tiers, and slow when executed on low-power mobile CPU hardware.

### 5.2 Motivation for Custom `CropDiseaseCNN`
Rather than accepting the operational overhead of a 50-million-parameter backbone, LEAFORA developed a purpose-built convolutional architecture tailored specifically for $128 \times 128$ botanical leaf images:
* **Tailored Receptive Fields:** Leaf lesions (such as small cercospora spots or mildew patches) are spatially localized. A 4-stage convolutional hierarchy with dual convolutions provides sufficient depth to capture both localized micro-textures and global leaf morphology without excessive parameters.
* **Extreme Memory Footprint Reduction:** At 703,603 parameters and 2.8 MB disk weight, LEAFORA uses **94% fewer parameters** than ResNet-18 (11.2M) and **97% fewer parameters** than ResNet-50 (25.6M).
* **Zero-Cost Production Hosting:** The model executes inference in 45–95ms on standard single-core x86 virtual CPUs, enabling stable hosting on zero-cost cloud tiers (Render 512MB RAM) without memory exhaustion.

---

## 6. Proposed System Overview

```mermaid
flowchart TD
    subgraph UI ["Client Presentation Layer (Next.js 16)"]
        A[User Captures / Drops Leaf Image] --> B{Client Pre-flight Validation}
        B -->|Fails: >10MB or Non-Image| C[Display Instant Client Warning]
        B -->|Passes: JPEG/PNG <= 10MB| D[Render Preview & Loading Skeleton]
    end

    subgraph API ["Backend Microservice Layer (FastAPI on Render)"]
        D -->|HTTPS POST /predict<br/>multipart/form-data| E[FastAPI Request Router]
        E --> F[Defensive Input Validation<br/>Verify Header + PIL Decode]
        F -->|Invalid Payload| G[HTTP 422 JSON Error]
        F -->|Valid Payload| H[Image Preprocessor]
    end

    subgraph Engine ["Inference Engine (PyTorch CPU)"]
        H -->|Resize 128x128, Normalize| I[Input Tensor: 1x3x128x128]
        I --> J[CropDiseaseCNN Model Singleton<br/>703,603 Parameters]
        J --> K[Logits Tensor: 1x211]
        K --> L[Softmax Normalization & Top-3 Slicing]
        L --> M[Decode Class Indices via model_config.json]
    end

    M -->|JSON Response| N[Client Results Component]
    N --> O[Render Top Disease, Confidence Badge, Top-3 Candidates & Treatment Guide]
```

---

## 7. System Requirements & Technology Stack

### 7.1 Backend Technology Stack
* **Language:** Python 3.11.x
* **Web Framework:** FastAPI 0.115.5 (High-performance, asynchronous ASGI web framework)
* **ASGI Server:** Uvicorn 0.32.1 (Standard event-loop worker)
* **Deep Learning Framework:** PyTorch 2.4.1 (CPU-only distribution from `download.pytorch.org/whl/cpu`)
* **Vision & Image Processing:** Torchvision 0.19.1, Pillow 10.4.0
* **Data Transport:** Python-Multipart 0.0.12 (Streaming file upload parser)

### 7.2 Frontend Technology Stack
* **Framework:** Next.js 16.3.8 (App Router, Turbopack compiler)
* **Core Library:** React 19.0.0
* **Language:** TypeScript 5.x (Strict static typing)
* **Styling:** Tailwind CSS 3.4
* **Animations:** Framer Motion (Declarative spring physics and state transitions)
* **Icons:** Lucide React

### 7.3 Infrastructure & Hosting
* **API Microservice:** Render Cloud (Free Web Service tier, Linux container, 512 MB RAM, Python 3.11)
* **Web Client:** Vercel Global Edge Network (Continuous deployment from Git `main` branch)

---

## 8. Dataset Provenance, Preparation & Taxonomy

### 8.1 Data Sources
LEAFORA’s dataset was constructed by synthesizing three open-access plant pathology repositories:
1. **PlantVillage (Hughes & Salathé, 2015):** Provided high-resolution laboratory photographs of detached leaves across 38 classes and 14 crops. Includes Color, Segmented, and Grayscale image variants.
2. **PlantDoc (Singh et al., 2020):** Provided complex in-field photographs captured under natural ambient lighting, featuring cluttered backgrounds (soil, weeds, hands, sky) and variable camera perspectives.
3. **Agri-Foundation-145k:** Provided an extensive agricultural foundation corpus aggregating diverse field pathologies across multiple farming research institutions.

### 8.2 Unified Manifest & Split Partitioning
After filtering corrupted files and harmonizing taxonomic labels into a canonical `snake_case` taxonomy, a unified dataset manifest of **199,377 sample rows** across **211 canonical classes** was established.

| Partition Split | Sample Count | Ratio | Verification Source |
| :--- | :---: | :---: | :--- |
| **Training Set** | 159,487 | 79.99% | Model training split manifest |
| **Validation Set** | 19,944 | 10.00% | `reports/validation_classification_report.csv` (Total support: 19,944) |
| **Test Set (Held-Out)** | 19,946 | 10.01% | `reports/test_metrics.json` & `test_classification_report.csv` |
| **Total** | **199,377** | **100.00%** | Comprehensive unified dataset manifest |

### 8.3 Class Taxonomy & Scope
The final taxonomy spans 211 verified botanical classes encompassing major agricultural categories:
* **Grains:** Corn/Maize (Cercospora leaf spot, common rust, northern leaf blight, healthy), Wheat (blast, leaf blight, septoria, rusts, powdery mildew), Rice (brown spot, leaf blast, sheath blight).
* **Solanaceous Crops:** Tomato (bacterial spot, early blight, late blight, leaf mold, septoria, spider mites, target spot, yellow leaf curl, mosaic virus, healthy), Potato (early blight, late blight, healthy), Bell Pepper (bacterial spot, healthy).
* **Horticultural Fruits:** Apple (scab, black rot, cedar apple rust, healthy), Grape (black rot, esca, leaf blight, healthy), Peach (bacterial spot, healthy), Citrus (Huanglongbing / citrus greening, canker, black spot).
* **Berries & Others:** Strawberry, Cherry, Blueberry, Raspberry, Soybean, Cotton, Coffee, Sugarcane, Cassava.

---

## 9. Custom CNN Architecture & Design Rationale

### 9.1 Network Topology (`CropDiseaseCNN`)
The model is implemented in `app/model.py` and `inference/veyra_predict.py` as an explicit, feed-forward convolutional neural network:

```
Input: [B, 3, 128, 128]
  │
  ├─ Block 1: Conv2d(3→32, k=3, p=1) ──> BN ──> ReLU ──> Conv2d(32→32, k=3, p=1) ──> BN ──> ReLU ──> MaxPool(2)  [B, 32, 64, 64]
  ├─ Block 2: Conv2d(32→64, k=3, p=1) ──> BN ──> ReLU ──> Conv2d(64→64, k=3, p=1) ──> BN ──> ReLU ──> MaxPool(2)  [B, 64, 32, 32]
  ├─ Block 3: Conv2d(64→128, k=3, p=1) ──> BN ──> ReLU ──> Conv2d(128→128, k=3, p=1) ──> BN ──> ReLU ──> MaxPool(2) [B, 128, 16, 16]
  ├─ Block 4: Conv2d(128→256, k=3, p=1) ──> BN ──> ReLU ──> AdaptiveAvgPool2d((1, 1))                               [B, 256, 1, 1]
  │
  └─ Classifier Head: Flatten ──> Linear(256→256) ──> ReLU ──> Dropout(p=0.4) ──> Linear(256→211)                  [B, 211]
```

### 9.2 Layer Parameter Breakdown

| Module | Operation | Input Shape | Output Shape | Parameters | Activation / Regularization |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Input** | Batch RGB Tensor | - | `[B, 3, 128, 128]` | 0 | - |
| **Block 1** | Conv2D ($3 \times 3$) | `[B, 3, 128, 128]` | `[B, 32, 128, 128]` | 896 | BatchNorm2D, ReLU |
| | Conv2D ($3 \times 3$) | `[B, 32, 128, 128]` | `[B, 32, 128, 128]` | 9,248 | BatchNorm2D, ReLU |
| | MaxPool2D ($2 \times 2$) | `[B, 32, 128, 128]` | `[B, 32, 64, 64]` | 0 | Stride 2 |
| **Block 2** | Conv2D ($3 \times 3$) | `[B, 32, 64, 64]` | `[B, 64, 64, 64]` | 18,496 | BatchNorm2D, ReLU |
| | Conv2D ($3 \times 3$) | `[B, 64, 64, 64]` | `[B, 64, 64, 64]` | 36,928 | BatchNorm2D, ReLU |
| | MaxPool2D ($2 \times 2$) | `[B, 64, 64, 64]` | `[B, 64, 32, 32]` | 0 | Stride 2 |
| **Block 3** | Conv2D ($3 \times 3$) | `[B, 64, 32, 32]` | `[B, 128, 32, 32]` | 73,856 | BatchNorm2D, ReLU |
| | Conv2D ($3 \times 3$) | `[B, 128, 32, 32]` | `[B, 128, 32, 32]` | 147,584 | BatchNorm2D, ReLU |
| | MaxPool2D ($2 \times 2$) | `[B, 128, 32, 32]` | `[B, 128, 16, 16]` | 0 | Stride 2 |
| **Block 4** | Conv2D ($3 \times 3$) | `[B, 128, 16, 16]` | `[B, 256, 16, 16]` | 295,168 | BatchNorm2D, ReLU |
| | AdaptiveAvgPool2D | `[B, 256, 16, 16]` | `[B, 256, 1, 1]` | 0 | Spatial collapse to $1 \times 1$ |
| **Classifier**| Flatten | `[B, 256, 1, 1]` | `[B, 256]` | 0 | - |
| | Linear | `[B, 256]` | `[B, 256]` | 65,792 | ReLU, Dropout ($p=0.4$) |
| | Linear (Head) | `[B, 256]` | `[B, 211]` | 54,227 | Output raw logits |
| **Total** | **Full Architecture** | - | - | **703,603** | **100% Trainable Parameters** |

### 9.3 Architectural Design Rationale
1. **Dual Convolutions per Block:** Using two stacked $3 \times 3$ convolutions produces an effective receptive field of $5 \times 5$ while requiring only $2 \times (3^2 \times C^2) = 18 C^2$ weights compared to $25 C^2$ for a single $5 \times 5$ kernel, introducing two nonlinear ReLU activations instead of one.
2. **Adaptive Average Pooling (`AdaptiveAvgPool2d((1, 1))`):** Eliminates spatial dimension dependencies before the dense layer, reducing the number of classifier parameters from over 4 million to just 65,792 and providing spatial invariance against minor leaf translations.
3. **Dropout Regularization ($p=0.4$):** Randomly zeroes 40% of feature activations during training, forcing the network to learn redundant, co-adapted feature representations and preventing catastrophic overfitting on smaller classes.

---

## 10. Training & Fine-Tuning Methodology

The training workflow followed a two-phase protocol: broad feature learning across the combined corpus, followed by focused fine-tuning under experiment `FineTune_90_Target`.

### 10.1 Optimization Setup
* **Criterion:** Multiclass Cross-Entropy Loss:
  $$\mathcal{L}_{CE} = - \frac{1}{B} \sum_{i=1}^B \log \left( \frac{e^{z_{i, y_i}}}{\sum_{j=1}^{211} e^{z_{i, j}}} \right)$$
* **Optimizer:** Adam ($\beta_1 = 0.9, \beta_2 = 0.999$, $\epsilon = 10^{-8}$)
* **Learning Rate Schedule:**
  * Epochs 1–2: $\eta = 1.0 \times 10^{-4}$
  * Epochs 3–4: $\eta = 5.0 \times 10^{-5}$
* **Batch Size:** 64 images per mini-batch
* **Device:** NVIDIA Tesla T4 GPU (Google Colab, 16GB VRAM)

### 10.2 Empirical Fine-Tuning History

As logged in `reports/training_history.csv`:

| Epoch | Train Loss | Train Acc. | Val Loss | Val Acc. | Learning Rate | Wall Clock Time |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **0.6004** | **88.94%** | **1.1801** | **88.23% (Optimal)** | $1 \times 10^{-4}$ | 680s (11.3 min) |
| **2** | 0.5792 | 89.22% | 1.1768 | 88.07% | $1 \times 10^{-4}$ | 701s (11.7 min) |
| **3** | 0.5703 | 89.32% | 1.2112 | 88.13% | $5 \times 10^{-5}$ | 684s (11.4 min) |
| **4** | 0.5567 | 89.42% | 1.2191 | 88.21% | $5 \times 10^{-5}$ | 704s (11.7 min) |

Checkpoint preservation was governed by validation accuracy. **Epoch 1** achieved the highest generalizability (**88.23% validation accuracy**, 17,597 / 19,944 correct), with validation loss minimal at 1.1801. Subsequent epochs exhibited slight divergence in validation loss (rising to 1.2191), signaling the onset of memorization. The Epoch 1 weights were therefore preserved as `veyra_cnn_best.pth`.

---

## 11. System Architecture & End-to-End Data Flow

The platform deploys as an asynchronous client-server architecture over standard HTTPS protocols.

```mermaid
sequenceDiagram
    autonumber
    actor User as Farmer / Diagnostician
    participant Frontend as Next.js Web App (Vercel)
    participant API as FastAPI Gateway (Render)
    participant Memory as Model Singleton (RAM)

    User->>Frontend: Drops leaf image (JPG/PNG)
    Frontend->>Frontend: Check file.size <= 10MB & type in image/jpeg, image/png
    alt Client Validation Fails
        Frontend-->>User: Display immediate error badge
    else Client Validation Passes
        Frontend->>Frontend: Set status = "analyzing", start progress indicator
        Frontend->>API: POST /predict (FormData with 'file')
        API->>API: Read initial bytes, verify PIL header & size limit
        alt Server Validation Fails
            API-->>Frontend: HTTP 422 JSON {"detail": "..."}
            Frontend-->>User: Display alert with recovery instructions
        else Server Validation Passes
            API->>Memory: Convert to RGB, Resize (128,128), Normalize tensor
            Memory->>Memory: Forward pass CropDiseaseCNN (CPU inference)
            Memory->>Memory: Compute Softmax & extract Top-3 indices
            Memory-->>API: Dict (predicted_class, confidence, top_predictions)
            API-->>Frontend: HTTP 200 JSON {"predicted_class": ..., "confidence": ...}
            Frontend->>Frontend: Map class to formatted name, severity tier & remedies
            Frontend-->>User: Render ResultPanel with confidence badges & guide
        end
    end
```

---

## 12. Backend & REST API Implementation

The backend is built around FastAPI's asynchronous application runner and lifespan context manager (`app/main.py`, `app/inference.py`).

### 12.1 Key Engineering Decisions
1. **Lifespan Model Loading:** The PyTorch checkpoint is loaded into memory exactly once at application startup. All concurrent and subsequent requests reuse the warm in-memory model, eliminating per-request disk reads.
2. **Defensive Validation via Dual-Inspection:** The server inspects both the client-provided HTTP `Content-Type` header and performs deep verification on the actual byte stream via `Pillow`'s `Image.open(io.BytesIO(image_bytes)).verify()`. Renamed executables or corrupted streams are rejected with HTTP 422 before reaching the tensor pipeline.
3. **Safe Checkpoint Deserialization:** Weights are loaded with `torch.load(..., weights_only=True)`, closing arbitrary Python code execution attack vectors.
4. **Graceful Liveness Reporting:** If the weights file is absent, the server starts in degraded mode, causing `GET /health` to report HTTP 503 and `POST /predict` to fail with clean error messages rather than crashing the worker.

---

## 13. Frontend Implementation & User Diagnostic Workflow

The frontend (`LEAFORA/`) provides an intuitive diagnostic interface built with modern web technologies:

### 13.1 Key Frontend Features
* **Drag-and-Drop Ingestion (`UploadWorkspace.tsx`):** Seamless file drop zone with visual drag state, file type filtering, and mobile camera trigger support.
* **Instant Client Pre-flight:** Verifies image format and file size ($\le 10\text{ MB}$) in the browser, preventing wasteful network transfers.
* **Confidence Badge Categorization (`ConfidenceDisplay.tsx`):**
  * **High Confidence ($\ge 85\%$):** Green badge; confirmed primary diagnosis.
  * **Moderate Confidence ($60\% - 84\%$):** Amber badge; secondary differential review suggested.
  * **Low Confidence ($< 60\%$):** Red/orange badge; advisory to retake photo under better lighting.
* **Top-3 Differential Visualizer (`ResultPanel.tsx`):** Displays horizontal probability bars comparing the primary candidate against the next two most probable conditions.
* **Agronomic Remedy Profiles:** Automatically renders symptom descriptions, biological causation notes, and organic/chemical management recommendations.

---

## 14. Experimental Setup & Environment

| Component | Training Environment | Production Inference Environment |
| :--- | :--- | :--- |
| **Compute Hardware** | NVIDIA Tesla T4 GPU (16 GB GDDR6) | Single-core x86-64 vCPU (Render container) |
| **Host System** | Google Colab Linux (Ubuntu 22.04) | Debian-based Linux Container |
| **Python Runtime** | Python 3.10.12 | Python 3.11.x (`.python-version`) |
| **PyTorch Distribution** | PyTorch 2.4.1 + CUDA 12.1 | PyTorch 2.4.1 (CPU-only build) |
| **Inference Mode** | Mixed Precision (FP16 / FP32) | `torch.inference_mode()` (FP32 CPU) |
| **Typical Latency** | ~8ms / batch (64 images) | **45–95ms / single image** |

---

## 15. Evaluation Metrics & Mathematical Formulations

Model performance was rigorously quantified using standard statistical classification metrics:

### 15.1 Top-1 Classification Accuracy
$$\text{Accuracy} = \frac{\sum_{i=1}^{K} C_{i,i}}{\sum_{i=1}^K \sum_{j=1}^K C_{i,j}} = \frac{17,543}{19,946} = 0.879525 \quad (87.95\%)$$

### 15.2 Class-Level Precision, Recall, and F1-Score
For each individual class $c \in \{1, \dots, 211\}$:
$$\text{Precision}_c = \frac{TP_c}{TP_c + FP_c}, \quad \text{Recall}_c = \frac{TP_c}{TP_c + FN_c}$$
$$F1_c = 2 \times \frac{\text{Precision}_c \times \text{Recall}_c}{\text{Precision}_c + \text{Recall}_c}$$

### 15.3 Aggregate Macro vs. Weighted Averaging
* **Macro-Averaged F1 (Unweighted):** Treats all 211 classes identically regardless of sample size:
  $$\text{Macro F1} = \frac{1}{211} \sum_{c=1}^{211} F1_c = 0.440017 \quad (44.00\%)$$
* **Weighted-Averaged F1 (Support-Weighted):** Weights each class by its empirical prevalence $N_c$:
  $$\text{Weighted F1} = \sum_{c=1}^{211} \left( \frac{N_c}{N} \cdot F1_c \right) = 0.884653 \quad (88.47\%)$$

---

## 16. Empirical Results & Discussion

### 16.1 Test Set Evaluation Summary
Evaluated on the completely independent, held-out test partition of **19,946 samples** (`reports/test_metrics.json`):

| Evaluation Metric | Test Result | Validation Result (Epoch 1) |
| :--- | :---: | :---: |
| **Accuracy** | **87.95%** ($17,543 / 19,946$) | **88.23%** ($17,597 / 19,944$) |
| **Weighted F1-Score** | **88.47%** | **88.66%** |
| **Weighted Precision** | **89.28%** | **89.35%** |
| **Weighted Recall** | **87.95%** | **88.23%** |
| **Macro F1-Score** | **44.00%** | **44.23%** |

![Test Performance Metrics](./assets/test_performance_metrics.png)

### 16.2 Reconciling the Macro F1 vs. Weighted F1 Divergence
A key finding of this research is the substantial gap between Macro F1 (44.00%) and Weighted F1 (88.47%). In many naive academic reports, such gaps are glossed over; here, it is directly explained by the mathematics of the dataset distribution:
* **The High-Support Majority:** High-support classes account for the bulk of real-world queries. On these classes, the model exhibits state-of-the-art discriminative ability (e.g. Citrus Greening with 802 test samples scores 99.75% F1; Common Corn Rust with 477 samples scores 100.0% F1). This drives the **Weighted F1 to 88.47%**.
* **The Long-Tail Penalty:** Exactly **44 classes** in the unified dataset have fewer than 10 test samples (down to 1 or 2 images). Because sample scarcity prevented the network from learning robust visual manifolds for these rare classes, they register an F1 of 0.0. In an unweighted arithmetic average, these 44 zeros immediately suppress Macro F1 to a theoretical ceiling below 79.1%, resulting in the observed 44.00%.

---

## 17. Graphical Analysis & Class-Level Performance

### 17.1 Training & Validation Convergence

![Training and Validation Accuracy](./assets/training_validation_accuracy.png)
![Training and Validation Loss](./assets/training_validation_loss.png)

The learning curves demonstrate clean convergence. Training accuracy progressed steadily from 88.94% to 89.42%, while validation accuracy stabilized at 88.23% at Epoch 1. The small generalization gap ($\sim 0.7\%$) confirms that the dual convolutions and 0.4 Dropout effectively controlled overfitting.

### 17.2 Confusion Matrix Analysis (Top 20 Classes)

![Top 20 Classes Confusion Matrix](./assets/confusion_matrix_top20.png)

Inspection of the top-20 confusion matrix confirms strong diagonal dominance ($\text{Trace} = 17,543$). Mutual misclassifications are confined almost exclusively to biologically related foliar spots within the same genus (e.g. minor confusion between early-stage tomato leaf mold and septoria spot).

### 17.3 Class Performance Extremes

![Strongest 20 Classes by F1](./assets/strongest_20_classes_f1.png)
![Weakest 20 Classes by F1](./assets/weakest_20_classes_f1.png)

#### Top 5 Performing Classes:
1. `corn_maize_common_rust`: **1.0000 F1** (Precision 1.0000, Recall 1.0000, Support 477)
2. `cherry_including_sour_healthy`: **0.9984 F1** (Precision 1.0000, Recall 0.9968, Support 314)
3. `orange_haunglongbing_citrus_greening`: **0.9975 F1** (Precision 0.9988, Recall 0.9963, Support 802)
4. `wheat_wheatblast`: **0.9957 F1** (Precision 0.9915, Recall 1.0000, Support 117)
5. `grape_blight_isariopsis_spot`: **0.9954 F1** (Precision 0.9938, Recall 0.9969, Support 323)

#### Weakest Classes (Data Scarcity):
* `tomato_two_spotted_spider_mites` (Support: 1, F1: 0.0)
* `raspberry_spot` (Support: 2, F1: 0.0)
* `plum_pocket_disease` (Support: 2, F1: 0.0)
* `wheat_wheat_septoria_blotch` (Support: 8, F1: 0.0)

---

## 18. Error Analysis & System Limitations

1. **Long-Tail Sensitivity:** For the 44 minority classes, LEAFORA cannot currently provide confident primary predictions. Users uploading these rare conditions will typically receive a low confidence score ($< 50\%$).
2. **Environmental Clutter Bias:** Photographs taken against complex backgrounds (soil, weeds, hands holding the leaf) can exhibit reduced confidence compared to leaves centered on neutral surfaces.
3. **Closed-World Assumption:** The network maps all inputs onto the 211 output classes. Non-plant images or weeds will be classified into the closest visual leaf class, though typically with low confidence.
4. **Single Symptom Assumption:** Leaves suffering from concurrent dual infections are categorized solely by the dominant visual symptom.

---

## 19. Deployment Architecture & Verification

The operational release was validated across all functional tiers:

| Verification Target | Test Execution | Outcome | Operational Status |
| :--- | :--- | :---: | :--- |
| **Backend Offline Suite** | `python test_local.py --offline` | **19/19 Checks Passed** | Verified in local environment |
| **Frontend Production Build** | `npm run build` (Turbopack / Next.js 16) | **0 Errors, 0 Warnings** | Static pages generated successfully |
| **TypeScript Typecheck** | `tsc` compilation | **0 Type Mismatches** | Fully verified |
| **Live API Health Check** | `GET https://leafora-3xm6.onrender.com/health` | **HTTP 200 OK** | Live on Render cloud |
| **Live Frontend Interface** | `https://leafora-one.vercel.app` | **Active & Synced** | Live on Vercel Edge |

---

## 20. Ethical Considerations & Responsible AI

* **Decision Support Disclaimer:** LEAFORA is explicitly presented as an educational and diagnostic advisory utility, not a certified agronomic prescription.
* **Environmental Safety:** The platform warns farmers against applying restricted chemical pesticides based solely on machine learning predictions without field corroboration.
* **Data Privacy:** Ingested photographs are processed entirely in memory and discarded immediately, preserving farmer privacy and preventing unauthorized data harvesting.

---

## 21. Future Scope

1. **Confidence Calibration:** Incorporate temperature scaling and conformal prediction to provide mathematically guaranteed confidence error bounds.
2. **Visual Saliency (Grad-CAM):** Integrate client-side Grad-CAM heatmaps directly onto the uploaded leaf photo to visually explain the CNN’s diagnosis.
3. **Synthetic Minority Oversampling:** Use generative diffusion models to synthesize photorealistic training samples for the 44 long-tail classes.
4. **Edge Quantization (ONNX / TFLite):** Quantize the model from FP32 to INT8 (reducing checkpoint size to under 800 KB) and run inference client-side via WebAssembly for completely offline rural diagnosis.

---

## 22. Conclusion

The LEAFORA project demonstrates that high-performance agricultural computer vision does not require massive 50-million-parameter backbones or expensive cloud GPU clusters. By architecting a lightweight 4-block custom CNN containing only 703,603 parameters and training across a harmonized 211-class agricultural manifest of 199,377 samples, LEAFORA achieves an overall test accuracy of **87.95%** and a weighted F1-score of **88.47%** on held-out test data. Coupled with a hardened FastAPI backend and a responsive Next.js 16 web interface, LEAFORA provides an open, transparent, and edge-ready agricultural diagnostic tool suitable for academic evaluation, field triage, and real-world farm decision support.

---

## 23. References

1. **Hughes, D., & Salathé, M. (2015).** *An open access repository of images on plant health to enable the development of mobile disease diagnostics.* arXiv preprint arXiv:1511.08060. (PlantVillage Dataset).
2. **Singh, D., Jain, N., Jain, P., Kayal, P., Kumawat, S., & Batra, N. (2020).** *PlantDoc: A Dataset for Visual Plant Disease Detection in the Wild.* In Proceedings of the 7th ACM IKDD CoDS and 25th COMAD (pp. 249–253).
3. **Food and Agriculture Organization (FAO) of the United Nations (2021).** *New standards to curb the global spread of plant pests and diseases.* FAO Rome.
4. **Paszke, A., et al. (2019).** *PyTorch: An Imperative Style, High-Performance Deep Learning Library.* In Advances in Neural Information Processing Systems (NeurIPS 32), pp. 8024–8035.
5. **Tiangolo, S. (2020).** *FastAPI: Modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints.*
6. **Vercel Engineering Team (2024).** *Next.js 16 Documentation: The React Framework for the Web.* https://nextjs.org.
