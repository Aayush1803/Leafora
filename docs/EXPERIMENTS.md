# LEAFORA — Model Experiments, Training History & Evaluation

**Document Version:** 2.0 (Final Release)  
**Date:** October 2026  
**Primary Experiment ID:** `FineTune_90_Target`  
**Active Checkpoint:** `veyra_cnn_best.pth` (2.8 MB, 703,603 parameters)  
**Evaluation Scope:** 19,946 Test Samples across 211 Classes  

---

## 1. Experimental Methodology & Model Evolution

During the LEAFORA research cycle, multiple modeling strategies were evaluated to identify the optimal balance between classification capacity, inference latency, memory consumption, and training cost.

### 1.1 Architectural Exploration History

| Model Prototype | Taxonomy Scope | Parameters | Evaluation Split Acc. | Outcome & Decision |
| :--- | :---: | :---: | :---: | :--- |
| **Model 00 (Baseline Color CNN)** | 38 Classes (PlantVillage) | ~4.8 MB | ~99.1% (Lab test set) | **Archived as Rollback Reference.** While accurate in pure studio conditions, 38 classes lacked coverage for real multi-crop farming. Overfit to lab backgrounds. |
| **Model Candidate: ResNet18** | 211 Classes | 11.2 Million | Not Completed | **Stopped Early.** Massive parameter footprint caused severe training latency on free Colab instances and exceeded target memory ceilings for low-cost cloud deployment. |
| **Model 01: LEAFORA `CropDiseaseCNN`** | **211 Classes** | **703,603 (2.8 MB)** | **87.95% (Held-Out Test)** | **SELECTED AS FINAL RELEASE.** Highly compact, fast CPU inference (45–95ms), robust across 211 categories, achieves 88.47% weighted F1. |

---

## 2. Training Configuration & Hyperparameters

The finalized model was pre-trained and then fine-tuned under the experiment run `FineTune_90_Target` on an NVIDIA Tesla T4 GPU in Google Colab.

* **Architecture:** Custom 4-Block `CropDiseaseCNN`
* **Input Resolution:** $128 \times 128 \times 3$ (RGB)
* **Optimization Algorithm:** Adam ($\beta_1 = 0.9, \beta_2 = 0.999$, $\epsilon = 10^{-8}$)
* **Loss Function:** Categorical Cross-Entropy (`nn.CrossEntropyLoss`)
* **Batch Size:** 64
* **Learning Rate Schedule:**
  * Epochs 1–2: $\eta = 1 \times 10^{-4}$
  * Epochs 3–4: $\eta = 5 \times 10^{-5}$
* **Checkpoint Criterion:** Highest validation accuracy on held-out validation set (19,944 samples).

---

## 3. Training & Validation Convergence History

The fine-tuning phase was tracked across 4 epochs. The logged metrics from `reports/training_history.csv` are presented below:

| Fine-Tune Epoch | Train Loss | Train Accuracy | Validation Loss | Validation Accuracy | Learning Rate | Wall Clock Time |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Epoch 1** | **0.6004** | **88.94%** | **1.1801** | **88.23% (Selected)** | $1 \times 10^{-4}$ | 679.99s (11.3 min) |
| **Epoch 2** | 0.5792 | 89.22% | 1.1768 | 88.07% | $1 \times 10^{-4}$ | 700.81s (11.7 min) |
| **Epoch 3** | 0.5703 | 89.32% | 1.2112 | 88.13% | $5 \times 10^{-5}$ | 684.21s (11.4 min) |
| **Epoch 4** | 0.5567 | 89.42% | 1.2191 | 88.21% | $5 \times 10^{-5}$ | 704.06s (11.7 min) |

```
                       Training vs. Validation Accuracy
  100% ┼─────────────────────────────────────────────────────────────
       │
   90% ┼─── Train: 88.94% ─────── 89.22% ─────── 89.32% ─────── 89.42%
       │    Val  : 88.23% (BEST) ─ 88.07% ─────── 88.13% ─────── 88.21%
   80% ┼─────────────────────────────────────────────────────────────
       └──────────────┬──────────────┬──────────────┬──────────────┬─
                   Epoch 1        Epoch 2        Epoch 3        Epoch 4
```

### Analysis of Training Curves:
* **Best Checkpoint Selection:** Epoch 1 yielded the highest generalization accuracy on the validation split (**88.23%**, 17,597 / 19,944 correct).
* **Mild Overfitting Signs in Late Epochs:** While training loss continued to decrease to 0.5567 in Epoch 4, validation loss slightly drifted from 1.1768 up to 1.2191. Preserving the Epoch 1 checkpoint (`veyra_cnn_best.pth`) prevented memorization and preserved generalization.

---

## 4. Final Held-Out Test Evaluation

The selected checkpoint was evaluated on the completely unseen, held-out test split of **19,946 samples** (`reports/test_metrics.json`):

### 4.1 Global Metric Summary

| Metric | Score | Formula / Definition |
| :--- | :---: | :--- |
| **Test Accuracy** | **87.95%** | $\frac{\text{Correct Predictions}}{\text{Total Test Samples}} = \frac{17,543}{19,946}$ |
| **Weighted F1-Score** | **88.47%** | $\sum_{c=1}^{211} \left( \frac{N_c}{N} \cdot F1_c \right)$ |
| **Weighted Precision** | **89.28%** | $\sum_{c=1}^{211} \left( \frac{N_c}{N} \cdot \text{Precision}_c \right)$ |
| **Weighted Recall** | **87.95%** | $\sum_{c=1}^{211} \left( \frac{N_c}{N} \cdot \text{Recall}_c \right)$ |
| **Macro F1-Score** | **44.00%** | $\frac{1}{211} \sum_{c=1}^{211} F1_c$ |

---

## 5. Confusion Matrix & Diagnosis Breakdown

Evaluation on the $211 \times 211$ test confusion matrix (`reports/test_confusion_matrix.npy`) demonstrates strong diagonal trace concentration:

$$\text{Trace}(C) = \sum_{i=1}^{211} C_{i,i} = 17,543 \quad (\text{Accuracy} = 87.9525\%)$$

### 5.1 High-Confidence Diagnostic Clusters
* **Corn (Maize) Rusts & Healthy Leaves:** $F1 = 1.000$ on `corn_maize_common_rust` (477 / 477 correct); $F1 = 0.993$ on `corn_maize_healthy`.
* **Citrus Greening (HLB):** $F1 = 0.9975$ on `orange_haunglongbing_citrus_greening` (799 / 802 correct). The distinctive asymmetric chlorosis patterns are reliably detected.
* **Wheat Blast & Leaf Blight:** Both achieve $> 0.99$ F1 with near-zero false positives.
* **Stone Fruits (Cherry, Peach):** Peach bacterial spot and sour cherry powdery mildew achieve $> 0.99$ F1.

### 5.2 Confusion Matrix Top-20 Visualization
The top 20 most frequent classes demonstrate strong diagonal density with minor mutual confusion occurring only between closely related foliar spots:

![Top 20 Classes Confusion Matrix](./assets/confusion_matrix_top20.png)

---

## 6. Detailed Class-Level Performance Analysis

### 6.1 Top 20 Strongest Classes

![Top 20 Strongest Classes](./assets/strongest_20_classes_f1.png)

| Rank | Class | F1-Score | Precision | Recall | Support |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | `corn_maize_common_rust` | **1.0000** | 1.0000 | 1.0000 | 477 |
| 2 | `coffee_coffee_brown_eye_spot` | **1.0000** | 1.0000 | 1.0000 | 1 |
| 3 | `cherry_including_sour_healthy` | **0.9984** | 1.0000 | 0.9968 | 314 |
| 4 | `orange_haunglongbing_citrus_greening` | **0.9975** | 0.9988 | 0.9963 | 802 |
| 5 | `wheat_wheatblast` | **0.9957** | 0.9915 | 1.0000 | 117 |
| 6 | `grape_blight_isariopsis_spot` | **0.9954** | 0.9938 | 0.9969 | 323 |
| 7 | `cherry_including_sour_powdery_mildew` | **0.9937** | 0.9968 | 0.9905 | 316 |
| 8 | `corn_maize_healthy` | **0.9929** | 0.9886 | 0.9971 | 349 |
| 9 | `wheat_leafblight` | **0.9926** | 0.9853 | 1.0000 | 134 |
| 10 | `peach_bacterial_spot` | **0.9923** | 0.9978 | 0.9870 | 460 |

### 6.2 Top 20 Weakest Classes & Root Cause

![Top 20 Weakest Classes](./assets/weakest_20_classes_f1.png)

The weakest 20 classes all register $F1 = 0.0$. Inspection of the test support confirms that this failure is directly tied to **data scarcity**:
* `tomato_two_spotted_spider_mites`: 1 test sample
* `raspberry_spot`: 2 test samples
* `plum_pocket_disease`: 2 test samples
* `plum_plum_pox_virus`: 3 test samples
* `raspberry_fire_blight`: 3 test samples
* `wheat_wheat_bacterial_streak_black_chaff`: 4 test samples
* `tobacco_tobacco_blue_mold`: 6 test samples
* `wheat_wheat_septoria_blotch`: 8 test samples

Because each of these classes contained fewer than 10 instances in the entire test partition (and similarly few in the training split), the model defaulted to higher-probability classes with shared visual symptoms.

---

## 7. Reproducibility & Limitations

1. **Hardware Reproducibility:** Training runs executed on Google Colab T4 GPUs with PyTorch standard deterministic seeding. Minor floating point variations may occur when re-evaluating across differing CUDA compute capabilities.
2. **Inference Determinism:** Running inference on CPU via `torch.inference_mode()` yields strictly deterministic output probabilities for identical input byte streams.
