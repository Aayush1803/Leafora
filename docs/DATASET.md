# LEAFORA — Dataset Provenance, Methodology & Taxonomy

**Document Version:** 2.0 (Final Release)  
**Date:** October 2026  
**Taxonomic Coverage:** 211 Unified Agricultural Disease & Healthy-State Classes  
**Total Manifest Volume:** 199,377 Rows (159,487 Train / 19,944 Validation / 19,946 Test)  

---

## 1. Overview & Data Philosophy

High-accuracy crop pathology detection requires training datasets that reflect both morphological disease symptoms and varied environmental capture conditions. Early agricultural vision systems predominantly relied on the **PlantVillage** dataset, which suffered from severe laboratory background bias (leaves detached and photographed on plain gray sheets). 

LEAFORA overcomes this single-source bottleneck by adopting an aggregated, multi-source training methodology combining structured laboratory datasets with uncontrolled, in-field agricultural photography.

```
+-----------------------------------------------------------------------------------+
|                           AGGREGATED SOURCE REPOSITORIES                          |
+-----------------------------------------------------------------------------------+
| 1. Agri-Foundation-145k  : Broad multi-crop agricultural dataset (~144,751 images) |
| 2. PlantVillage (Color)  : Laboratory detached leaf photos (54,305 raw images)    |
| 3. PlantVillage (Segm.)  : Background-subtracted segmented masks                  |
| 4. PlantVillage (Gray)   : Grayscale intensity variants                           |
| 5. PlantDoc Dataset      : In-field, complex natural canopy photographs           |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        TAXONOMIC HARMONIZATION & FILTERING                        |
| • Canonical snake_case naming standard (e.g. crop_disease)                        |
| • Removal of ambiguous or corrupt files                                           |
| • Merging of synonymous biological taxonomy across 211 output classes             |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                             UNIFIED DATASET MANIFEST                              |
|                          Total Manifest Rows: 199,377                             |
|       Train: 159,487 (80%)  │  Validation: 19,944 (10%)  │  Test: 19,946 (10%)     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Counting Methodology: Reconciling Dataset Figures

In multi-source machine learning projects, confusion often arises when different metrics (raw files, unique leaves, manifest entries) are conflated. LEAFORA strictly distinguishes these metrics:

| Entity Type | Numerical Count | Context & Definition |
| :--- | :---: | :--- |
| **Agri-Foundation-145k Summary** | ~144,751 images | Baseline open-source aggregated corpus across 215 reported categories prior to final taxonomy freezing. |
| **PlantVillage Raw Image Count** | 54,305 images | The classic lab dataset spanning 38 classes across 14 crop species (e.g. 5,507 citrus greening images; 152 potato healthy images). |
| **Unified Manifest Rows** | **199,377 rows** | The exact number of indexed sample rows across all partitions after aggregating Agri Foundation, PlantDoc, and PlantVillage variants. |
| **Training Split Samples** | **159,487 samples** | Manifest rows assigned to the training split ($79.99\%$). |
| **Validation Split Samples** | **19,944 samples** | Manifest rows assigned to validation ($10.00\%$). |
| **Test Split Samples** | **19,946 samples** | Manifest rows assigned to held-out test evaluation ($10.01\%$). |
| **Unique Physical Plants** | *Not reliably bounded* | Because PlantVillage includes multiple photographic variants (color, segmented, grayscale) of the same underlying leaves, manifest row counts exceed the count of distinct physical plants. |

---

## 3. Class Taxonomy & Output Mapping

The model outputs predictions across **211 canonical classes**, defined in alphabetical order in `model_config.json`. Classes follow a structured syntax: `<crop>_<disease>` or `<crop>_<disease>_<pathogen>`, with healthy specimens designated as `<crop>_healthy`.

### Major Crop Families Covered (211 Categories Total):
* **Cereals & Grains:** Corn (Maize), Wheat, Rice, Barley, Sorghum.
* **Solanaceous Crops:** Tomato, Potato, Bell Pepper, Eggplant, Tobacco.
* **Fruit Orchards:** Apple, Cherry, Peach, Grape, Citrus (Orange, Lemon, Lime).
* **Berries:** Strawberry, Blueberry, Raspberry, Blackberry.
* **Legumes & Cash Crops:** Soybean, Cotton, Coffee, Sugarcane, Cassava.
* **Brassicas & Vegetables:** Cabbage, Cauliflower, Broccoli, Carrot, Celery, Lettuce.
* **Cucurbits:** Cucumber, Squash, Watermelon, Muskmelon.

---

## 4. Class Imbalance & Long-Tail Distribution

The unified dataset exhibits significant class imbalance typical of real-world epidemiological data:

```
Sample Distribution Across 211 Test Classes (19,946 Samples Total)
  High-Support Classes (>300 samples) :  ~15% of classes account for ~72% of test samples
  Moderate-Support Classes (50–300)   :  ~35% of classes account for ~22% of test samples
  Minority Classes (<50 samples)      :  ~50% of classes account for ~6% of test samples
  Long-tail Minority (<=8 samples)    :  44 classes (account for 112 test samples total)
```

### 4.1 High-Support Classes in Held-Out Test Set:
* `orange_haunglongbing_citrus_greening`: **802** samples ($F1 = 0.9975$)
* `corn_maize_common_rust`: **477** samples ($F1 = 1.0000$)
* `peach_bacterial_spot`: **460** samples ($F1 = 0.9923$)
* `corn_maize_healthy`: **349** samples ($F1 = 0.9929$)
* `grape_blight_isariopsis_spot`: **323** samples ($F1 = 0.9954$)
* `cherry_including_sour_healthy`: **314** samples ($F1 = 0.9984$)

### 4.2 Severe Minority Classes (Zero F1 Due to Sample Sparsity):
* `tomato_two_spotted_spider_mites`: **1** test sample ($F1 = 0.0$)
* `raspberry_spot`: **2** test samples ($F1 = 0.0$)
* `plum_pocket_disease`: **2** test samples ($F1 = 0.0$)
* `wheat_wheat_septoria_blotch`: **8** test samples ($F1 = 0.0$)
* *Total classes with F1 = 0.0:* **44 classes**

---

## 5. Preprocessing & Augmentation Pipeline

During data loading, images undergo consistent spatial and radiometric standardizations:

1. **Resolution Standardization:** Downsampled or upsampled using bilinear interpolation to $128 \times 128$ pixels. This dimension provides optimal balance between fine fungal lesion detail and sub-100ms CPU inference speed.
2. **Color Channel Conversion:** Explicitly coerced to 3-channel RGB, discarding infrared, alpha, or 16-bit depth metadata.
3. **Tensor Scaling:** Integer pixel values $[0, 255]$ converted to floating point tensors $[0.0, 1.0]$.
4. **Channel Normalization:** Standardized using ImageNet parameters ($\mu = [0.485, 0.456, 0.406]$, $\sigma = [0.229, 0.224, 0.225]$).

---

## 6. Dataset Limitations & Quality Observations

1. **Background Artifact Overfitting:** Models trained on early iterations of PlantVillage demonstrated vulnerability to classifying the gray cardboard background rather than the leaf lesion. Combining PlantDoc and segmented masks mitigated this risk substantially.
2. **Dual-Infection Annotation Scarcity:** Real agricultural leaves often suffer from concurrent infections (e.g. Septoria leaf spot and early blight on the same tomato leaf). The current dataset treats all samples as single-label ground truth.
3. **Geographic Bias:** Sourcing was skewed toward North American, European, and East Asian agricultural research repositories; tropical root crops (cassava, yam) have fewer representative samples than temperate orchard fruits.

---

## 7. Data Provenance & Academic Attribution

* **PlantVillage:** Hughes, D., & Salathé, M. (2015). *An open access repository of images on plant health to enable the development of mobile disease diagnostics.* arXiv:1511.08060.
* **PlantDoc:** Singh, D., Jain, N., Jain, P., Kayal, P., Kumawat, S., & Batra, N. (2020). *PlantDoc: A Dataset for Visual Plant Disease Detection in the Wild.* Proceedings of the 7th ACM IKDD CoDS and 25th COMAD.
* **Agri-Foundation-145k:** Aggregated agricultural imagery foundation corpus compiled from multiple public plant pathology repositories under CC BY-SA 4.0 / CC BY 4.0 open research licenses.
