# Crop Disease Detection Using Custom CNN — Product Requirements Document (PRD)

> **Official Release Notice (v2.0 — October 2026):**  
> This document has been finalized and integrated into the primary VEYRA documentation suite.  
> The canonical and authoritative PRD is maintained at [`docs/PRD.md`](./PRD.md).

---

## Document Metadata

| Attribute | Specification |
| :--- | :--- |
| **Project Title** | VEYRA — Crop Disease Detection Using a Custom Convolutional Neural Network |
| **Document Version** | 2.0 (Approved Final Release) |
| **Primary Document** | [`docs/PRD.md`](./PRD.md) |
| **Model Architecture** | Custom `CropDiseaseCNN` (4 conv blocks, 7 Conv2d layers, 703,603 parameters) |
| **Output Classes** | 211 verified canonical agricultural categories |
| **Input Format** | RGB, $128 \times 128$, ImageNet Normalization |
| **Backend Framework** | FastAPI (Python 3.11+, PyTorch CPU) |
| **Frontend Framework** | Next.js 16 (React 19, TypeScript, Tailwind CSS) |
| **Status** | Production Deployed (Render API + Vercel Client) |

---

## 1. Executive Summary

VEYRA provides automated plant disease diagnostic intelligence from digital leaf photographs. Rather than relying on heavyweight off-the-shelf classifiers (e.g. ResNet-50, EfficientNet) or restricted commercial APIs, VEYRA implements a custom-designed, parameter-efficient Convolutional Neural Network (`CropDiseaseCNN`) trained from scratch and fine-tuned across an aggregated corpus of agricultural imagery.

The finalized system supports **211 distinct disease and healthy-state classes** across major cereal crops, fruit trees, vegetables, and legumes, returning top-3 probabilistic predictions and actionable agronomic management strategies in under 100 milliseconds on standard CPU hardware.

---

## 2. Key Problem Statement & Solved Objectives

### 2.1 The Problem
Plant diseases cause 20–40% global yield loss annually. Smallholder farmers frequently lack timely access to extension plant pathologists, leading to incorrect pesticide applications, environmental degradation, and crop failure.

### 2.2 System Objectives Achieved
1. **Taxonomic Scale:** Expanded from initial 38-class prototype to 211 biological categories.
2. **Computational Efficiency:** 703,603 parameters with a 2.8 MB PyTorch checkpoint. Runs smoothly on zero-cost cloud tiers (Render 512MB RAM) and low-power hardware.
3. **Transparent Evaluation:** Evaluated on a held-out test split of 19,946 samples. Achieved **87.95% overall accuracy** and **88.47% weighted F1-score**.
4. **Resilient User Experience:** Full drag-and-drop web client with client-side image validation, confidence tier badges, and comprehensive error recovery.

---

## 3. Product Specification Summary

For the full, detailed specification covering all Functional Requirements (`FR-01` to `FR-15`), Non-Functional Requirements (`NFR-01` to `NFR-09`), User Personas, User Journeys, Acceptance Criteria, and Architectural Boundaries, please consult:

👉 **[Complete Product Requirements Document (`docs/PRD.md`)](./PRD.md)**
