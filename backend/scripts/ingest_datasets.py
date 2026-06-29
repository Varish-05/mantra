import os
import sys
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score

# Add root folder to python path to resolve imports correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def train_anomaly_model():
    print("--------------------------------------------------")
    print("Training Network Anomaly Model (CIC-IDS2017 style)...")
    np.random.seed(42)
    
    # Feature format matches anomaly_detector.py
    # destination_port, flow_duration, total_fwd_packets, total_backward_packets,
    # fwd_packet_length_max, fwd_packet_length_min, flow_iat_mean, flow_iat_max,
    # packet_length_mean, packet_rate
    
    X = []
    y = []
    
    # Benign flows (1000 samples)
    for _ in range(1000):
        port = np.random.choice([80, 443, 53, 123])
        flow_duration = np.random.uniform(5, 500)
        fwd_pkts = np.random.randint(1, 15)
        bwd_pkts = np.random.randint(1, 15)
        fwd_max = np.random.uniform(40, 250)
        fwd_min = 0.0
        iat_mean = np.random.uniform(1, 50)
        iat_max = np.random.uniform(5, 100)
        pkt_mean = np.random.uniform(30, 100)
        pkt_rate = (fwd_pkts + bwd_pkts) / (flow_duration / 1000.0)
        X.append([port, flow_duration, fwd_pkts, bwd_pkts, fwd_max, fwd_min, iat_mean, iat_max, pkt_mean, pkt_rate])
        y.append(0)
        
    # Malicious/Anomaly flows (1000 samples)
    for _ in range(1000):
        port = np.random.randint(1024, 65535)
        flow_duration = np.random.uniform(2000, 30000)
        fwd_pkts = np.random.randint(20, 800)
        bwd_pkts = np.random.randint(20, 800)
        fwd_max = np.random.uniform(500, 1500)
        fwd_min = 0.0
        iat_mean = np.random.uniform(100, 600)
        iat_max = np.random.uniform(1000, 8000)
        pkt_mean = np.random.uniform(400, 1200)
        pkt_rate = (fwd_pkts + bwd_pkts) / (flow_duration / 1000.0)
        X.append([port, flow_duration, fwd_pkts, bwd_pkts, fwd_max, fwd_min, iat_mean, iat_max, pkt_mean, pkt_rate])
        y.append(1)

    X = np.array(X)
    y = np.array(y)

    # STRICT FEATURIZATION ORDERING: Split before model fit
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf.fit(X_train, y_train)
    
    preds = clf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
    print(f"F1 Score: {f1_score(y_test, preds):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, preds, target_names=["Benign", "Malicious"]))
    
    # Save model weights
    out_dir = "app/ml/weights"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "anomaly_detector.pkl")
    with open(out_path, "wb") as f:
        pickle.dump(clf, f)
    print(f"Successfully saved anomaly model to {out_path}")


def train_phishing_model():
    print("--------------------------------------------------")
    print("Training Phishing Detection Model (Enron/Nazario style)...")
    np.random.seed(42)
    
    # Feature format matches phishing_detector.py
    # urgency_count, url_count, ip_in_url, suspicious_domains, word_count, caps_ratio
    X = []
    y = []
    
    # Benign emails (1000 samples)
    for _ in range(1000):
        urgency = np.random.choice([0, 1], p=[0.8, 0.2])
        urls = np.random.randint(0, 3)
        ip = 0.0
        susp_domains = 0.0
        word_count = np.random.randint(60, 500)
        caps = np.random.uniform(0.01, 0.07)
        X.append([urgency, urls, ip, susp_domains, word_count, caps])
        y.append(0)
        
    # Phishing emails (1000 samples)
    for _ in range(1000):
        urgency = np.random.randint(2, 7)
        urls = np.random.randint(1, 10)
        ip = np.random.choice([0.0, 1.0], p=[0.75, 0.25])
        susp_domains = np.random.randint(1, 5)
        word_count = np.random.randint(20, 220)
        caps = np.random.uniform(0.08, 0.3)
        X.append([urgency, urls, ip, susp_domains, word_count, caps])
        y.append(1)

    X = np.array(X)
    y = np.array(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    clf.fit(X_train, y_train)
    
    preds = clf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
    print(f"F1 Score: {f1_score(y_test, preds):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, preds, target_names=["Benign", "Phishing"]))
    
    out_path = "app/ml/weights/phishing_detector.pkl"
    with open(out_path, "wb") as f:
        pickle.dump(clf, f)
    print(f"Successfully saved phishing model to {out_path}")


def train_malware_model():
    print("--------------------------------------------------")
    print("Training Malware PE Classifier Model (EMBER style)...")
    np.random.seed(42)
    
    # Feature format matches malware_classifier.py
    # file_size, num_sections, entropy, imports_count, exports_count, suspicious_api_count, has_wx_sections
    X = []
    y = []
    
    # Benign files (1000 samples)
    for _ in range(1000):
        size = np.random.uniform(100000, 15000000)
        sections = np.random.randint(2, 6)
        entropy = np.random.uniform(3.0, 5.8)
        imports = np.random.randint(15, 80)
        exports = np.random.randint(0, 30)
        susp_apis = np.random.randint(0, 2)
        wx_sect = 0.0
        X.append([size, sections, entropy, imports, exports, susp_apis, wx_sect])
        y.append(0)
        
    # Malware files (1000 samples)
    for _ in range(1000):
        size = np.random.uniform(15000, 2500000)
        sections = np.random.randint(5, 12)
        entropy = np.random.uniform(6.6, 7.99)
        imports = np.random.randint(5, 180)
        exports = 0.0
        susp_apis = np.random.randint(2, 9)
        wx_sect = np.random.choice([0.0, 1.0], p=[0.6, 0.4])
        X.append([size, sections, entropy, imports, exports, susp_apis, wx_sect])
        y.append(1)

    X = np.array(X)
    y = np.array(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf.fit(X_train, y_train)
    
    preds = clf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
    print(f"F1 Score: {f1_score(y_test, preds):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, preds, target_names=["Benign", "Malicious"]))
    
    out_path = "app/ml/weights/malware_classifier.pkl"
    with open(out_path, "wb") as f:
        pickle.dump(clf, f)
    print(f"Successfully saved malware model to {out_path}")


if __name__ == "__main__":
    print("Initializing MANTRA Dataset Ingestion & Model Training Pipeline...")
    train_anomaly_model()
    train_phishing_model()
    train_malware_model()
    print("--------------------------------------------------")
    print("All MANTRA Machine Learning Models Trained Successfully!")
