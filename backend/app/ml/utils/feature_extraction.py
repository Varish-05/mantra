import re
from typing import Dict, Any, List
import numpy as np


def extract_phishing_features(text: str) -> Dict[str, Any]:
    """
    Extracts security-relevant features from email text body.
    Features look at spelling/grammar signals, links, urgency, and domain counts.
    """
    text_lower = text.lower()
    
    # 1. Look for urgent/sensitive keywords
    urgent_keywords = [
        "urgent", "action required", "verify your account", "suspend", 
        "security alert", "password reset", "billing", "unauthorized",
        "immediate", "confirm", "login", "bank", "update", "sign in"
    ]
    urgency_count = sum(1 for word in urgent_keywords if word in text_lower)
    
    # 2. Link/URL counts
    # Find any http or https URLs
    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text_lower)
    url_count = len(urls)
    
    # Check for IP address in URL (highly suspicious in emails)
    ip_in_url = 1 if any(re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url) for url in urls) else 0
    
    # Check for link mismatch clues (e.g. href text != actual link domain)
    # Since we are scanning raw text, count domains that seem suspicious (e.g. free hosting, double extension)
    suspicious_domains = 0
    for url in urls:
        if any(bad in url for bad in [".tk", ".ml", ".cf", ".gq", "freehost", "temp", "login-", "secure-"]):
            suspicious_domains += 1
            
    # 3. Text statistics
    word_count = len(text.split())
    char_count = len(text)
    
    # Check for excessive capitalization (shouting)
    caps_ratio = 0.0
    if char_count > 0:
        caps_letters = sum(1 for c in text if c.isupper())
        caps_ratio = caps_letters / char_count

    return {
        "urgency_count": float(urgency_count),
        "url_count": float(url_count),
        "ip_in_url": float(ip_in_url),
        "suspicious_domains": float(suspicious_domains),
        "word_count": float(word_count),
        "caps_ratio": float(caps_ratio)
    }


def extract_malware_features(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts numerical features from PE (Portable Executable) metadata.
    Matches standard fields from EMBER malware metadata dataset.
    """
    # Extract structural PE details from metadata dict
    file_size = float(metadata.get("file_size", 1024))
    num_sections = float(metadata.get("num_sections", 3))
    entropy = float(metadata.get("entropy", 4.5))  # Entropy is 0-8 scale
    
    # Count of imports
    imports_count = float(metadata.get("imports_count", 15))
    exports_count = float(metadata.get("exports_count", 0))
    
    # Count of suspicious APIs used commonly by malware (e.g., packers, injection)
    suspicious_apis = [
        "virtualalloc", "writeprocessmemory", "createremotethread", 
        "loadlibrary", "getprocaddress", "ntunmapviewofsection",
        "setwindowshook", "isdebuggerpresent", "regcreatekey"
    ]
    api_list = [api.lower() for api in metadata.get("imported_apis", [])]
    suspicious_api_count = sum(1 for api in suspicious_apis if any(api in imported for imported in api_list))
    
    # Section characteristics: check if we have write+execute sections (highly suspicious)
    has_wx_sections = 1.0 if metadata.get("has_wx_sections", False) else 0.0

    return {
        "file_size": file_size,
        "num_sections": num_sections,
        "entropy": entropy,
        "imports_count": imports_count,
        "exports_count": exports_count,
        "suspicious_api_count": float(suspicious_api_count),
        "has_wx_sections": has_wx_sections
    }


def extract_network_features(flow_log: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts features from netflow packets representing CIC-IDS2017 features.
    """
    dest_port = float(flow_log.get("destination_port", 80))
    flow_duration = float(flow_log.get("flow_duration", 1000))  # in ms
    total_fwd_packets = float(flow_log.get("total_fwd_packets", 5))
    total_bwd_packets = float(flow_log.get("total_bwd_packets", 5))
    
    fwd_len_max = float(flow_log.get("fwd_packet_length_max", 128))
    fwd_len_min = float(flow_log.get("fwd_packet_length_min", 0))
    
    flow_iat_mean = float(flow_log.get("flow_iat_mean", 100))
    flow_iat_max = float(flow_log.get("flow_iat_max", 500))
    
    pkt_len_mean = float(flow_log.get("packet_length_mean", 64))
    
    # Synthesize rates
    pkt_rate = (total_fwd_packets + total_bwd_packets) / (flow_duration / 1000.0) if flow_duration > 0 else 0.0

    return {
        "destination_port": dest_port,
        "flow_duration": flow_duration,
        "total_fwd_packets": total_fwd_packets,
        "total_backward_packets": total_bwd_packets,
        "fwd_packet_length_max": fwd_len_max,
        "fwd_packet_length_min": fwd_len_min,
        "flow_iat_mean": flow_iat_mean,
        "flow_iat_max": flow_iat_max,
        "packet_length_mean": pkt_len_mean,
        "packet_rate": pkt_rate
    }
