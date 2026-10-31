
from pathlib import Path
import json

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms


class CropDiseaseCNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, 3, padding=1), nn.BatchNorm2d(32),
            nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64),
            nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1), nn.BatchNorm2d(128),
            nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(128, 256, 3, padding=1), nn.BatchNorm2d(256),
            nn.ReLU(inplace=True), nn.AdaptiveAvgPool2d((1, 1))
        )
        self.classifier = nn.Sequential(
            nn.Flatten(), nn.Linear(256, 256), nn.ReLU(inplace=True),
            nn.Dropout(0.4), nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.classifier(self.features(x))


class LeaforaPredictor:
    def __init__(self, model_dir=None, device=None):
        base = Path(model_dir) if model_dir else Path(__file__).resolve().parents[1]
        config_path = base / "model" / "model_config.json"
        checkpoint_path = base / "model" / "veyra_cnn_best.pth"

        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.classes = [
            label for label, idx in
            sorted(self.config["class_to_idx"].items(), key=lambda item: item[1])
        ]

        self.device = torch.device(
            device or ("cuda" if torch.cuda.is_available() else "cpu")
        )

        checkpoint = torch.load(
            checkpoint_path, map_location=self.device, weights_only=False
        )
        self.model = CropDiseaseCNN(self.config["num_classes"]).to(self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((self.config["input_size"], self.config["input_size"])),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=self.config["normalization_mean"],
                std=self.config["normalization_std"]
            )
        ])

    def predict(self, image, top_k=3):
        """Accept a PIL image or a path; return top predictions and probabilities."""
        if isinstance(image, (str, Path)):
            with Image.open(image) as im:
                image = im.convert("RGB")
        else:
            image = image.convert("RGB")

        x = self.transform(image).unsqueeze(0).to(self.device)

        with torch.inference_mode():
            probabilities = torch.softmax(self.model(x), dim=1)[0]
            k = min(max(1, int(top_k)), len(self.classes))
            values, indices = torch.topk(probabilities, k=k)

        return [
            {
                "label": self.classes[int(idx)],
                "confidence": float(prob),
                "confidence_percent": round(float(prob) * 100, 2)
            }
            for prob, idx in zip(values.cpu().tolist(), indices.cpu().tolist())
        ]
