# LEAFORA — HCL Career Shaper Submission Documents

Official project documentation portfolio for **LEAFORA: Crop Disease Detection System**, submitted for the HCL Career Shaper Program (B.Tech Final-Year Capstone, Academic Year 2026).

---

## Document Index

| # | Document File | Description | Source Markdown |
|---|---------------|-------------|-----------------|
| 01 | [`LEAFORA_PRD.pdf`](./LEAFORA_PRD.pdf) | Product Requirements Document — vision, objectives, user stories, functional and non-functional requirements | `docs/PRD.md` |
| 02 | [`LEAFORA_Project_Report.pdf`](./LEAFORA_Project_Report.pdf) | Comprehensive B.Tech Capstone Project Report — complete academic and technical thesis | `docs/REPORT.md` |
| 03 | [`LEAFORA_System_Architecture.pdf`](./LEAFORA_System_Architecture.pdf) | Full-Stack ML System Design — Next.js frontend, FastAPI microservice, PyTorch CNN | `docs/ARCHITECTURE.md` |
| 04 | [`LEAFORA_API_Documentation.pdf`](./LEAFORA_API_Documentation.pdf) | REST Inference Microservice API Specification — endpoints, payloads, schemas | `docs/API.md` |
| 05 | [`LEAFORA_Setup_and_User_Guide.pdf`](./LEAFORA_Setup_and_User_Guide.pdf) | Installation, environment configuration, local development, and user manual | `docs/SETUP.md` |
| 06 | [`LEAFORA_Testing_and_Results.pdf`](./LEAFORA_Testing_and_Results.pdf) | Test strategy, unit/integration test suites, smoke tests, and evaluation outcomes | `docs/TESTING.md` |
| 07 | [`LEAFORA_Deployment_Guide.pdf`](./LEAFORA_Deployment_Guide.pdf) | Cloud deployment guide — Vercel (frontend), Render (FastAPI/PyTorch), health checks | `docs/DEPLOYMENT.md` |
| 08 | [`LEAFORA_Model_Card.pdf`](./LEAFORA_Model_Card.pdf) | Model Card — 211-class custom CNN architecture, parameters (703,603), metrics | `docs/MODEL_CARD.md` |
| 09 | [`LEAFORA_Dataset_Documentation.pdf`](./LEAFORA_Dataset_Documentation.pdf) | Dataset details — 211 classes, class distribution, split strategy (80/10/10) | `docs/DATASET.md` |
| 10 | [`LEAFORA_Experiments_and_Training.pdf`](./LEAFORA_Experiments_and_Training.pdf) | Training convergence history, learning rates, loss curves, ablation findings | `docs/EXPERIMENTS.md` |
| 11 | [`LEAFORA_Limitations_and_Future_Scope.pdf`](./LEAFORA_Limitations_and_Future_Scope.pdf) | Known limitations, operational boundaries, and future research roadmap | `docs/LIMITATIONS_AND_FUTURE_SCOPE.md` |
| 12 | [`LEAFORA_Changelog.pdf`](./LEAFORA_Changelog.pdf) | Complete version history, release notes, and milestone tracking | `docs/CHANGELOG.md` |

---

## Technical Summary

- **Project Name:** LEAFORA
- **Application Type:** Deep Learning-Powered Crop Disease Detection System
- **Model:** Custom Convolutional Neural Network (`CropDiseaseCNN`)
- **Number of Classes:** 211 distinct plant-disease categories
- **Model Parameters:** 703,603 trainable parameters
- **Evaluation Metrics:**
  - Test Accuracy: **87.95%**
  - Weighted F1-Score: **88.47%**
  - Macro F1-Score: **44.00%**
  - Test Dataset Samples: **19,946**
- **Tech Stack:**
  - Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
  - Backend: FastAPI, PyTorch 2.x, Torchvision, Pillow, Uvicorn
  - Cloud Hosting: Vercel (Frontend), Render (Inference API)

---

## Note on Pre-existing Legacy Documents

The `docs/` folder contains two legacy pre-rebrand PDF files (`Crop_Disease_CNN_Full_Project_Architecture.pdf` and `Crop_Disease_Detection_Custom_CNN_PRD.pdf`). These legacy files have been formally superseded by the branded documents in this directory:
- `LEAFORA_System_Architecture.pdf` supersedes `Crop_Disease_CNN_Full_Project_Architecture.pdf`
- `LEAFORA_PRD.pdf` supersedes `Crop_Disease_Detection_Custom_CNN_PRD.pdf`

All documents in this directory represent the authoritative, fully updated submission package.

