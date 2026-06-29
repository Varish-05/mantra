import pytest
from app.ml.utils.feature_extraction import (
    extract_phishing_features,
    extract_malware_features,
    extract_network_features
)
from app.services import ml_service


def test_feature_extraction_phishing():
    """Verify phishing text signals are correctly extracted."""
    text = "URGENT: Please verify your bank account login credentials immediately at www.temp-login-secure.tk"
    features = extract_phishing_features(text)
    
    assert features["urgency_count"] >= 2
    assert features["url_count"] == 1
    assert features["suspicious_domains"] == 1


def test_feature_extraction_malware():
    """Verify structural PE metadata features are extracted."""
    metadata = {
        "file_size": 50000,
        "num_sections": 8,
        "entropy": 7.85,
        "imports_count": 45,
        "exports_count": 0,
        "imported_apis": ["VirtualAlloc", "WriteProcessMemory", "CreateRemoteThread"],
        "has_wx_sections": True
    }
    features = extract_malware_features(metadata)
    
    assert features["file_size"] == 50000
    assert features["num_sections"] == 8
    assert features["entropy"] == 7.85
    assert features["suspicious_api_count"] == 3
    assert features["has_wx_sections"] == 1.0


def test_ml_threat_analysis_routing():
    """Verify threat analysis routes correct models and returns risk scores and attributions."""
    # 1. Test phishing email text payload
    content = "Subject: Urgent Update required. Reset your email portal credentials."
    phish_res = ml_service.analyze_threat(content, "eml")
    
    assert phish_res["analysis_type"] == "phishing"
    assert "classification" in phish_res
    assert "confidence_score" in phish_res
    assert "predictions_details" in phish_res
    assert "explanations" in phish_res["predictions_details"]
    
    # 2. Test PE json payload
    pe_meta = {
        "file_size": 25000,
        "num_sections": 6,
        "entropy": 7.9,
        "imported_apis": ["VirtualAlloc"]
    }
    mal_res = ml_service.analyze_threat("", "json", pe_meta)
    assert mal_res["analysis_type"] == "malware"
    assert mal_res["risk_score"] >= 0
