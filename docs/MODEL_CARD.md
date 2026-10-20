# VEYRA — Model Card: `CropDiseaseCNN`

**Model Name:** VEYRA `CropDiseaseCNN` (Model 01 — 211-Class Final Release)  
**Model Version:** 1.0.0-final  
**Release Date:** October 2026  
**Model Type:** Custom Deep Convolutional Neural Network for Computer Vision (Single-Label Multi-Class Classification)  
**Primary Framework:** PyTorch 2.4.1 (CPU / CUDA compatible)  
**Training Artifacts Source:** `VEYRA_Final-20261020T172259Z-1-001/`  
**License:** Open Research & Educational Use  

---

## 1. Model Summary & Architectural Specification

### 1.1 Core Specification

| Parameter | Specification | Verification Evidence |
| :--- | :--- | :--- |
| **Model Architecture** | `CropDiseaseCNN` | `model_config.json`, `app/model.py` |
| **Total Parameters** | 703,603 parameters | `sum(p.numel() for p in model.parameters())` |
| **Trainable Parameters** | 703,603 (100% trainable) | Verified in offline smoke test |
| **Input Tensor Shape** | `[Batch, 3, 128, 128]` (RGB) | `transforms.Resize((128, 128))` |
| **Input Dynamic Range** | Floats in $[-2.12, 2.64]$ (normalized) | Standard ImageNet statistics applied |
| **Output Dimension** | `[Batch, 211]` (Raw logits) | `model_config.json` (`num_classes: 211`) |
| **Activation Functions** | ReLU (hidden), Softmax (inference) | `torch.softmax(logits, dim=1)` |
| **Regularization** | BatchNorm2D on all convs; Dropout ($p=0.4$) | `nn.BatchNorm2d`, `nn.Dropout(0.4)` |
| **Checkpoint File** | `veyra_cnn_best.pth` (2,846,753 bytes / 2.8 MB) | Local filesystem and Git tracking |

### 1.2 Structural Design

The architecture uses a 4-stage convolutional hierarchy featuring dual convolutions per block in early stages to increase nonlinear receptive fields without parameter explosion:

1. **Stage 1 (Feature Initiation):** Dual $3 \times 3$ Convolutions ($3 \to 32 \to 32$ filters), Batch Normalization, ReLU activations, $2 \times 2$ Max Pooling $\to$ spatial dimension $64 \times 64$.
2. **Stage 2 (Texture & Edge Aggregation):** Dual $3 \times 3$ Convolutions ($32 \to 64 \to 64$ filters), Batch Normalization, ReLU, $2 \times 2$ Max Pooling $\to$ spatial dimension $32 \times 32$.
3. **Stage 3 (Lesion & Pattern Mining):** Dual $3 \times 3$ Convolutions ($64 \to 128 \to 128$ filters), Batch Normalization, ReLU, $2 \times 2$ Max Pooling $\to$ spatial dimension $16 \times 16$.
4. **Stage 4 (High-Level Semantic Synthesis):** Single $3 \times 3$ Convolution ($128 \to 256$ filters), Batch Normalization, ReLU, followed by Adaptive Average Pooling to a fixed $1 \times 1$ spatial latent code.
5. **Classifier Head:** Flatten $\to$ Linear ($256 \to 256$) $\to$ ReLU $\to$ Dropout ($p=0.4$) $\to$ Linear ($256 \to 211$).

---

## 2. Dataset Scope, Harmonization & Splits

### 2.1 Aggregated Data Provenance
The model was trained on a large-scale agricultural visual corpus created by aggregating and harmonizing multiple open-access plant pathology datasets:
* **Agri-Foundation-145k:** Broad agricultural pathology images across diverse farming contexts.
* **PlantVillage:** Color, Segmented, and Grayscale variants covering common laboratory leaf conditions.
* **PlantDoc:** Field-photographed leaves captured under uncontrolled natural lighting, background soil, and branch occlusion.

### 2.2 Split Breakdown
The training pipeline processed a unified manifest of **199,377 sample rows** partitioned into mutually exclusive splits:

| Split Partition | Sample Count | Percentage | Role in Pipeline |
| :--- | :--- | :--- | :--- |
| **Training Split** | 159,487 | 79.99% | Weight gradient updates via backpropagation |
| **Validation Split** | 19,944 | 10.00% | Checkpoint selection, early stopping, hyperparameter tuning |
| **Test Split (Held-Out)** | 19,946 | 10.01% | Unbiased final offline evaluation |
| **Total Manifest Rows** | **199,377** | **100.00%** | **211 Canonical Classes** |

*Note on Data Counting Methodology:* In multi-source agricultural datasets, the total number of manifest rows (199,377) includes multiple visual variants (e.g. segmented vs. full background). It is distinct from raw image file counts or deduplicated unique plants.

---

## 3. Training & Fine-Tuning Methodology

### 3.1 Training Hyperparameters
* **Optimization Algorithm:** Adam Optimizer ($\beta_1 = 0.9, \beta_2 = 0.999$)
* **Initial Learning Rate:** $1 \times 10^{-4}$ (fine-tuning phase `FineTune_90_Target`)
* **Learning Rate Decay:** Reduced to $5 \times 10^{-5}$ at Epoch 3
* **Loss Criterion:** Cross-Entropy Loss (`nn.CrossEntropyLoss`)
* **Hardware Acceleration:** Google Colab NVIDIA Tesla T4 GPU (16 GB VRAM)
* **Batch Size:** 64

### 3.2 Fine-Tuning Convergence History

As documented in `reports/training_history.csv`:

| Fine-Tune Epoch | Train Loss | Train Accuracy | Validation Loss | Validation Accuracy | Learning Rate | Epoch Duration |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Epoch 1** | 0.6004 | 88.94% | **1.1801** | **88.23% (Best)** | $1 \times 10^{-4}$ | 680s (11.3 min) |
| **Epoch 2** | 0.5792 | 89.22% | 1.1768 | 88.07% | $1 \times 10^{-4}$ | 701s (11.7 min) |
| **Epoch 3** | 0.5703 | 89.32% | 1.2112 | 88.13% | $5 \times 10^{-5}$ | 684s (11.4 min) |
| **Epoch 4** | 0.5567 | 89.42% | 1.2191 | 88.21% | $5 \times 10^{-5}$ | 704s (11.7 min) |

The best model checkpoint (`veyra_cnn_best.pth`) was preserved at **Epoch 1**, where validation accuracy reached its peak of **88.23%** (17,597 correct predictions out of 19,944 validation samples) with minimal validation loss.

---

## 4. Evaluation Metrics & Performance Analysis

### 4.1 Overall Held-Out Test Set Metrics (19,946 Samples)

From `reports/test_metrics.json` and `reports/test_confusion_matrix.npy`:

| Metric | Empirical Score | Interpretation |
| :--- | :--- | :--- |
| **Overall Test Accuracy** | **87.95%** ($17,543 / 19,946$) | Primary top-1 classification accuracy across all 19,946 test instances |
| **Weighted F1-Score** | **88.47%** | F1-score weighted by class sample size; reflects population-level diagnostic quality |
| **Weighted Precision** | **89.28%** | Aggregate positive predictive value across the test distribution |
| **Weighted Recall** | **87.95%** | Aggregate sensitivity across all test samples |
| **Macro F1-Score** | **44.00%** | Unweighted arithmetic mean of F1 scores across all 211 classes |

```
                       Test Performance Overview
┌───────────────────────────────────────────────┬────────────┐
│ Overall Test Accuracy                         │   87.95%   │
│ Weighted F1-Score                             │   88.47%   │
│ Weighted Precision                            │   89.28%   │
│ Weighted Recall                               │   87.95%   │
│ Macro F1-Score (unweighted 211 classes)       │   44.00%   │
└───────────────────────────────────────────────┴────────────┘
```

### 4.2 Reconciling the Gap Between Macro F1 (44.00%) and Weighted F1 (88.47%)

The noticeable difference between Macro F1 (44.00%) and Weighted F1 (88.47%) is a direct consequence of **severe class imbalance in the long-tail agricultural dataset**:
* **High-Support Dominance:** High-frequency classes (e.g., `orange_haunglongbing_citrus_greening` with 802 test samples, `corn_maize_common_rust` with 477 samples) achieve near-perfect classification ($F1 > 99\%$). Because these classes comprise the vast majority of all test samples, the **weighted F1** reaches **88.47%**.
* **Long-Tail Penalty in Macro F1:** In the combined 211-class taxonomy, exactly **44 minority classes** have very low test support (between 1 and 8 images). Due to sample sparsity during training, the network achieves an F1 of 0.0 on these 44 classes. In an unweighted arithmetic average (**Macro F1**), each class counts for $\frac{1}{211} \approx 0.47\%$. The 44 zero-F1 classes contribute $0$ to the sum, automatically placing an upper mathematical cap on Macro F1:
  $$\text{Macro F1}_{\max} \le \frac{211 - 44}{211} \times 1.0 = 79.1\%$$
  The remaining classes average $\sim 55.6\%$ F1 across their varied support levels, yielding the observed $44.00\%$ macro average.

### 4.3 Class-Level Performance Profiles

#### Top 10 Strongest Performing Classes (Test Set):

| Class Identifier | Precision | Recall | F1-Score | Test Support |
| :--- | :---: | :---: | :---: | :---: |
| `corn_maize_common_rust` | 1.0000 | 1.0000 | **1.0000** | 477 |
| `cherry_including_sour_healthy` | 1.0000 | 0.9968 | **0.9984** | 314 |
| `orange_haunglongbing_citrus_greening` | 0.9988 | 0.9963 | **0.9975** | 802 |
| `wheat_wheatblast` | 0.9915 | 1.0000 | **0.9957** | 117 |
| `grape_blight_isariopsis_spot` | 0.9938 | 0.9969 | **0.9954** | 323 |
| `cherry_including_sour_powdery_mildew` | 0.9968 | 0.9905 | **0.9937** | 316 |
| `corn_maize_healthy` | 0.9886 | 0.9971 | **0.9929** | 349 |
| `wheat_leafblight` | 0.9853 | 1.0000 | **0.9926** | 134 |
| `peach_bacterial_spot` | 0.9978 | 0.9870 | **0.9923** | 460 |
| `coffee_coffee_brown_eye_spot` | 1.0000 | 1.0000 | **1.0000** | 1 |

#### Weakest Performing Classes (Zero F1 Due to Extreme Sample Sparsity):

| Class Identifier | Precision | Recall | F1-Score | Test Support |
| :--- | :---: | :---: | :---: | :---: |
| `tomato_two_spotted_spider_mites` | 0.0000 | 0.0000 | **0.0000** | 1 |
| `raspberry_spot` | 0.0000 | 0.0000 | **0.0000** | 2 |
| `tobacco_tobacco_frogeye_spot` | 0.0000 | 0.0000 | **0.0000** | 2 |
| `plum_pocket_disease` | 0.0000 | 0.0000 | **0.0000** | 2 |
| `plum_plum_pox_virus` | 0.0000 | 0.0000 | **0.0000** | 3 |
| `raspberry_fire_blight` | 0.0000 | 0.0000 | **0.0000** | 3 |
| `wheat_wheat_bacterial_streak_black_chaff` | 0.0000 | 0.0000 | **0.0000** | 4 |
| `tobacco_tobacco_blue_mold` | 0.0000 | 0.0000 | **0.0000** | 6 |
| `wheat_wheat_septoria_blotch` | 0.0000 | 0.0000 | **0.0000** | 8 |

---

## 5. Domain Shift & Out-of-Distribution Risks

1. **Background Clutter & Natural Lighting:** Models evaluated on laboratory datasets (such as PlantVillage) can over-index on plain gray or black backgrounds. While the inclusion of PlantDoc helps mitigate this, users uploading leaves photographed in harsh direct sunlight, heavy shadow, or against dense soil will experience lower confidence scores.
2. **Crop Stage Variation:** Very early stage symptoms (microscopic fungal spore flecks) or very late-stage necrotic tissue may present visual overlap across unrelated pathogens.
3. **Unseen Plant Species:** Inputs from crops not included in the 211-class mapping will be forced into the closest visual class. The top-1 confidence score will typically be low ($< 50\%$), signaling an uncertain prediction.

---

## 6. Intended Use & Prohibited Interpretations

### 6.1 Intended Use
* **Advisory Decision Support:** Assisting smallholder farmers, agronomists, and students in rapidly narrowing down potential leaf pathogens.
* **Triage in Agricultural Extension:** Helping field workers prioritize farm plots for formal pathology inspection.
* **Educational Demonstration:** Providing a fully documented custom CNN computer vision pipeline for academic evaluation.

### 6.2 Prohibited & Out-of-Scope Interpretations
* **Sole Justification for Toxic Agrochemical Application:** Users **MUST NOT** apply restricted systemic pesticides or herbicides solely based on model output without visual verification by a certified agronomist.
* **Human or Animal Health Applications:** This model is strictly trained on botanical foliar diseases and must never be applied to human dermatology or veterinary pathology.
* **Guaranteed Field Eradication:** VEYRA provides statistical likelihoods, not infallible biological diagnoses.
