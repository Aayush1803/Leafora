"""
model.py — CropDiseaseCNN architecture.

This definition exactly mirrors the architecture used during training.
It must stay in sync with the exported VEYRA_Final/inference/veyra_predict.py
to ensure checkpoint weights load without shape mismatches.

Architecture summary
--------------------
Block 1: Conv(3→32)  + BN + ReLU + Conv(32→32)  + BN + ReLU + MaxPool2d
Block 2: Conv(32→64) + BN + ReLU + Conv(64→64)  + BN + ReLU + MaxPool2d
Block 3: Conv(64→128)+ BN + ReLU + Conv(128→128)+ BN + ReLU + MaxPool2d
Block 4: Conv(128→256)+BN + ReLU + AdaptiveAvgPool2d(1,1)
Classifier: Flatten → Linear(256,256) → ReLU → Dropout(0.4) → Linear(256, num_classes)

Input:  [B, 3, 128, 128]   (RGB, normalised)
Output: [B, num_classes]   (raw logits)
"""

import torch.nn as nn


class CropDiseaseCNN(nn.Module):
    """Custom CNN for multi-class crop disease classification."""

    def __init__(self, num_classes: int) -> None:
        super().__init__()
        self.features = nn.Sequential(
            # Block 1
            nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, 3, padding=1), nn.BatchNorm2d(32),
            nn.ReLU(inplace=True), nn.MaxPool2d(2),
            # Block 2
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64),
            nn.ReLU(inplace=True), nn.MaxPool2d(2),
            # Block 3
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1), nn.BatchNorm2d(128),
            nn.ReLU(inplace=True), nn.MaxPool2d(2),
            # Block 4
            nn.Conv2d(128, 256, 3, padding=1), nn.BatchNorm2d(256),
            nn.ReLU(inplace=True), nn.AdaptiveAvgPool2d((1, 1)),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))
