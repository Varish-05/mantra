const API_BASE = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1') 
  : 'http://backend:8000/api/v1';


function getHeaders(isMultipart = false) {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mantra_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}


export async function request(endpoint: string, options: RequestInit = {}) {
  const headers = {
    ...getHeaders(options.body instanceof FormData),
    ...options.headers,
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 204) {
    return null;
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'An error occurred';
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}


export const api = {
  // Auth endpoints
  async login(email: string, password: string) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('mantra_token', data.access_token);
    localStorage.setItem('mantra_email', data.email);
    localStorage.setItem('mantra_role', data.role);
    return data;
  },
  
  async register(email: string, password: string, role = 'Viewer') {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },
  
  logout() {
    localStorage.removeItem('mantra_token');
    localStorage.removeItem('mantra_email');
    localStorage.removeItem('mantra_role');
  },
  
  getUserMe() {
    return request('/auth/me');
  },
  
  // Document endpoints
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },
  
  getDocuments() {
    return request('/documents');
  },
  
  deleteDocument(id: string) {
    return request(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
  
  semanticSearch(query: string, limit = 4) {
    return request('/documents/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  },
  
  chatRAG(query: string) {
    return request('/documents/chat', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
  
  // Threat Analysis endpoints
  runManualAnalysis(content: string, fileType: string, metadata?: any) {
    return request('/analysis/run', {
      method: 'POST',
      body: JSON.stringify({ content, file_type: fileType, metadata }),
    });
  },
  
  getAnalysisLogs() {
    return request('/analysis/results');
  },
  
  getDashboardStats() {
    return request('/analysis/dashboard/stats');
  },
  
  // PDF download helper
  async downloadReport(analysisId: string) {
    const token = localStorage.getItem('mantra_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}/reports/generate/${analysisId}`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate report PDF');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mantra_incident_report_${analysisId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};
