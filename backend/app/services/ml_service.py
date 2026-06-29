from typing import Dict, Any, Optional
import os

from app.ml.models.anomaly_detector import AnomalyDetector
from app.ml.models.phishing_detector import PhishingDetector
from app.ml.models.malware_classifier import MalwareClassifier
from app.ml.utils.feature_extraction import (
    extract_phishing_features,
    extract_malware_features,
    extract_network_features
)

# Initialize models globally (with default paths)
anomaly_detector = AnomalyDetector()
phishing_detector = PhishingDetector()
malware_classifier = MalwareClassifier()


def analyze_threat(
    content: str, 
    file_type: str, 
    meta_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main entry point for ML analysis. Decides which model pipeline to trigger 
    based on the input file type (e.g. eml, log, csv, json, bin).
    """
    file_type = file_type.lower().strip(".")
    
    # 1. PHISHING ANALYSIS (EML / Text email contents)
    if file_type == "eml" or (file_type in ["txt", "html"] and "subject:" in content.lower()):
        features = extract_phishing_features(content)
        prediction = phishing_detector.predict(features)
        
        # Calculate risk score (0-100)
        risk_score = round(prediction["confidence_score"] * 100) if prediction["classification"] != "benign" else round((1 - prediction["confidence_score"]) * 20)
        
        return {
            "analysis_type": "phishing",
            "classification": prediction["classification"],
            "confidence_score": prediction["confidence_score"],
            "risk_score": float(risk_score),
            "predictions_details": {
                "extracted_features": features,
                "explanations": prediction["feature_attributions"]
            }
        }
        
    # 2. MALWARE PE CLASSIFICATION (JSON metadata or PE info)
    elif file_type == "json" and meta_info and "entropy" in meta_info:
        features = extract_malware_features(meta_info)
        prediction = malware_classifier.predict(features)
        risk_score = round(prediction["confidence_score"] * 100) if prediction["classification"] != "benign" else round((1 - prediction["confidence_score"]) * 20)
        
        return {
            "analysis_type": "malware",
            "classification": prediction["classification"],
            "confidence_score": prediction["confidence_score"],
            "risk_score": float(risk_score),
            "predictions_details": {
                "extracted_features": features,
                "explanations": prediction["feature_attributions"]
            }
        }
        
    # 3. NETWORK ANOMALY DETECTION (CSV packet summaries or Log patterns)
    elif file_type in ["csv", "log"]:
        # If it's a CSV row/log, let's parse features.
        # If meta_info has flow metrics, use them, otherwise default to parsing the first line of log.
        flow_data = meta_info if meta_info else {}
        if not flow_data and "," in content:
            # Simple parse csv fields if header matches standard log
            parts = content.split("\n")[0].split(",")
            if len(parts) >= 8:
                try:
                    flow_data = {
                        "destination_port": float(parts[0]),
                        "flow_duration": float(parts[1]),
                        "total_fwd_packets": float(parts[2]),
                        "total_bwd_packets": float(parts[3]),
                        "fwd_packet_length_max": float(parts[4]),
                        "flow_iat_mean": float(parts[5]),
                        "packet_length_mean": float(parts[6]),
                    }
                except ValueError:
                    pass
                    
        features = extract_network_features(flow_data)
        prediction = anomaly_detector.predict(features)
        risk_score = round(prediction["confidence_score"] * 100) if prediction["classification"] != "benign" else round((1 - prediction["confidence_score"]) * 20)
        
        return {
            "analysis_type": "network_anomaly",
            "classification": prediction["classification"],
            "confidence_score": prediction["confidence_score"],
            "risk_score": float(risk_score),
            "predictions_details": {
                "extracted_features": features,
                "explanations": prediction["feature_attributions"]
            }
        }
        
    # Default fallback analysis (metadata based risk score)
    else:
        # Default safety scoring based on simple keyword search (indicators of compromise)
        ioc_keywords = ["malware", "ransomware", "hacktool", "mimikatz", "cobalt strike", "exploit", "cve-"]
        content_lower = content.lower()
        ioc_hits = sum(1 for kw in ioc_keywords if kw in content_lower)
        
        confidence = min(0.3 + (ioc_hits * 0.2), 0.95) if ioc_hits > 0 else 0.05
        classification = "benign"
        if confidence > 0.6:
            classification = "malicious"
        elif confidence > 0.2:
            classification = "suspicious"
            
        risk_score = round(confidence * 100)
        
        return {
            "analysis_type": "generic_security",
            "classification": classification,
            "confidence_score": confidence,
            "risk_score": float(risk_score),
            "predictions_details": {
                "ioc_hits": ioc_hits,
                "explanations": {"keyword_matches": float(ioc_hits)}
            }
        }
