import os
import pickle
import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import RandomForestClassifier


class AnomalyDetector:
    def __init__(self, model_path: str = "app/ml/weights/anomaly_detector.pkl"):
        self.model_path = model_path
        self.model = None
        self.feature_names = [
            "destination_port", "flow_duration", "total_fwd_packets", "total_backward_packets",
            "fwd_packet_length_max", "fwd_packet_length_min", "flow_iat_mean", "flow_iat_max",
            "packet_length_mean", "packet_rate"
        ]
        # Baseline reference averages for computing contributions (feature attributions)
        self.baselines = {
            "destination_port": 80.0,
            "flow_duration": 500.0,
            "total_fwd_packets": 5.0,
            "total_backward_packets": 5.0,
            "fwd_packet_length_max": 100.0,
            "fwd_packet_length_min": 0.0,
            "flow_iat_mean": 50.0,
            "flow_iat_max": 100.0,
            "packet_length_mean": 64.0,
            "packet_rate": 20.0
        }
        self.load_model()

    def load_model(self):
        """Loads model weights, or trains a fallback model if not found."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
                return
            except Exception:
                pass
        self._train_fallback_model()

    def _train_fallback_model(self):
        """Trains a fallback Random Forest classifier on synthetic CIC-IDS2017 features."""
        np.random.seed(42)
        X = []
        y = []
        # Benign network logs
        for _ in range(100):
            X.append([
                float(np.random.choice([80, 443])),
                float(np.random.uniform(5, 200)),
                float(np.random.randint(1, 10)),
                float(np.random.randint(1, 10)),
                float(np.random.uniform(40, 150)),
                0.0,
                float(np.random.uniform(1, 20)),
                float(np.random.uniform(5, 50)),
                float(np.random.uniform(30, 80)),
                float(np.random.uniform(20, 200))
            ])
            y.append(0)
        # Malicious logs (port scanning / DDoS signals)
        for _ in range(100):
            X.append([
                float(np.random.randint(1024, 65535)),
                float(np.random.uniform(1000, 15000)),
                float(np.random.randint(50, 500)),
                float(np.random.randint(50, 500)),
                float(np.random.uniform(500, 1400)),
                0.0,
                float(np.random.uniform(50, 300)),
                float(np.random.uniform(500, 4000)),
                float(np.random.uniform(400, 900)),
                float(np.random.uniform(1, 15))
            ])
            y.append(1)
            
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.model.fit(X, y)
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Runs inference on extracted network flow features."""
        # Convert features dictionary to sorted list
        x_input = [features.get(name, self.baselines[name]) for name in self.feature_names]
        
        # Predict probability
        probs = self.model.predict_proba([x_input])[0]
        malicious_prob = float(probs[1])
        
        classification = "benign"
        if malicious_prob > 0.7:
            classification = "malicious"
        elif malicious_prob > 0.4:
            classification = "suspicious"
            
        # Compute local feature attributions
        # Based on: (feature_value - baseline) * feature_importance
        importances = self.model.feature_importances_
        attributions = {}
        for i, name in enumerate(self.feature_names):
            val = x_input[i]
            base = self.baselines[name]
            imp = importances[i]
            
            # Simple normalization of impact direction
            # If value is higher than baseline for malicious-indicators, it adds risk.
            if name in ["destination_port", "flow_duration", "total_fwd_packets", "fwd_packet_length_max", "flow_iat_max"]:
                impact = (val - base) / (base + 1.0) * imp
            else:
                impact = (base - val) / (base + 1.0) * imp
                
            attributions[name] = float(np.clip(impact, -1.0, 1.0))
            
        # Sort features by impact strength
        sorted_attr = sorted(attributions.items(), key=lambda item: abs(item[1]), reverse=True)
        
        return {
            "classification": classification,
            "confidence_score": malicious_prob if classification != "benign" else float(probs[0]),
            "feature_attributions": dict(sorted_attr[:5]) # top 5 explanations
        }
