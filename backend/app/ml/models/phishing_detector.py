import os
import pickle
import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import RandomForestClassifier


class PhishingDetector:
    def __init__(self, model_path: str = "app/ml/weights/phishing_detector.pkl"):
        self.model_path = model_path
        self.model = None
        self.feature_names = [
            "urgency_count", "url_count", "ip_in_url", 
            "suspicious_domains", "word_count", "caps_ratio"
        ]
        self.baselines = {
            "urgency_count": 0.0,
            "url_count": 0.0,
            "ip_in_url": 0.0,
            "suspicious_domains": 0.0,
            "word_count": 100.0,
            "caps_ratio": 0.05
        }
        self.load_model()

    def load_model(self):
        """Loads phishing model weights or trains a fallback model if not found."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
                return
            except Exception:
                pass
        self._train_fallback_model()

    def _train_fallback_model(self):
        """Trains a fallback Random Forest model on synthetic phishing features."""
        np.random.seed(42)
        X = []
        y = []
        # Benign emails
        for _ in range(100):
            X.append([
                float(np.random.randint(0, 2)), # low urgency
                float(np.random.randint(0, 3)), # low url count
                0.0,                            # no ip in url
                0.0,                            # no susp domains
                float(np.random.randint(50, 400)), # medium length
                float(np.random.uniform(0.01, 0.08)) # low capitalization ratio
            ])
            y.append(0)
        # Phishing emails
        for _ in range(100):
            X.append([
                float(np.random.randint(2, 6)), # high urgency
                float(np.random.randint(2, 8)), # high url count
                float(np.random.choice([0.0, 1.0], p=[0.7, 0.3])), # sometimes has IP in URL
                float(np.random.randint(1, 4)), # has suspicious domains
                float(np.random.randint(30, 200)), # shorter length
                float(np.random.uniform(0.08, 0.25)) # high capitalization (panic)
            ])
            y.append(1)
            
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.model.fit(X, y)
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Classifies text features to determine phishing risk."""
        x_input = [features.get(name, self.baselines[name]) for name in self.feature_names]
        
        probs = self.model.predict_proba([x_input])[0]
        phish_prob = float(probs[1])
        
        classification = "benign"
        if phish_prob > 0.7:
            classification = "malicious"
        elif phish_prob > 0.4:
            classification = "suspicious"
            
        importances = self.model.feature_importances_
        attributions = {}
        for i, name in enumerate(self.feature_names):
            val = x_input[i]
            base = self.baselines[name]
            imp = importances[i]
            
            # Attributions: higher value than baseline increases risk
            if name in ["urgency_count", "url_count", "ip_in_url", "suspicious_domains", "caps_ratio"]:
                impact = (val - base) / (base + 1.0) * imp
            else:
                # Word count: shorter emails tend to be phishing templates
                impact = (base - val) / (base + 1.0) * imp
                
            attributions[name] = float(np.clip(impact, -1.0, 1.0))
            
        sorted_attr = sorted(attributions.items(), key=lambda item: abs(item[1]), reverse=True)
        
        return {
            "classification": classification,
            "confidence_score": phish_prob if classification != "benign" else float(probs[0]),
            "feature_attributions": dict(sorted_attr[:5])
        }
