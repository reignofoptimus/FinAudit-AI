const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('finaudit_token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('finaudit_token');
    localStorage.removeItem('finaudit_user');
    window.dispatchEvent(new Event('auth-unauthorized'));
    throw new Error('Session expired or unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'An error occurred with the request');
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request<any>('/auth/me'),

  // Dashboard
  getDashboardStats: () => request<any>('/dashboard/stats'),

  // Documents
  uploadDocuments: (formData: FormData) => request<any>('/documents/upload', { method: 'POST', body: formData }),
  listDocuments: (category?: string) => request<any>(`/documents${category ? `?category=${category}` : ''}`),
  getExtractedRecords: (docId: number) => request<any>(`/documents/${docId}/records`),
  updateExtractedRecord: (recId: number, data: any) => request<any>(`/documents/records/${recId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Transactions
  listTransactions: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/transactions${query ? `?${query}` : ''}`);
  },
  getTransaction: (id: number) => request<any>(`/transactions/${id}`),

  // Matching
  runMatching: () => request<any>('/matching/run', { method: 'POST' }),
  listMatches: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/matching/matches${query ? `?${query}` : ''}`);
  },
  reviewMatch: (id: number, data: { status: string; auditor_notes?: string }) =>
    request<any>(`/matching/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  manualMatch: (data: { primary_transaction_id: number; matched_transaction_id: number; auditor_notes?: string }) =>
    request<any>('/matching/manual', { method: 'POST', body: JSON.stringify(data) }),

  // Duplicates
  runDuplicateDetection: () => request<any>('/duplicates/run', { method: 'POST' }),
  listDuplicates: (status?: string) => request<any>(`/duplicates${status ? `?status=${status}` : ''}`),
  resolveDuplicate: (groupId: string, data: { action: string; resolution_notes: string }) =>
    request<any>(`/duplicates/${groupId}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  // Discrepancies
  runDiscrepancies: () => request<any>('/discrepancies/run', { method: 'POST' }),
  listDiscrepancies: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/discrepancies${query ? `?${query}` : ''}`);
  },
  resolveDiscrepancy: (id: number, data: { action: string; resolution_notes: string }) =>
    request<any>(`/discrepancies/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  // Missing Docs
  runMissingDocs: () => request<any>('/missing-docs/run', { method: 'POST' }),
  listMissingDocs: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/missing-docs${query ? `?${query}` : ''}`);
  },
  attachMissingDoc: (alertId: number, data: { document_id: number; notes?: string }) =>
    request<any>(`/missing-docs/${alertId}/attach`, { method: 'POST', body: JSON.stringify(data) }),
  resolveMissingDoc: (alertId: number, data: { action: string; resolution_notes: string }) =>
    request<any>(`/missing-docs/${alertId}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  // Anomalies
  runAnomalies: () => request<any>('/anomalies/run', { method: 'POST' }),
  listAnomalies: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/anomalies${query ? `?${query}` : ''}`);
  },
  reviewAnomaly: (id: number, data: { auditor_disposition: string; auditor_comments?: string }) =>
    request<any>(`/anomalies/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),

  // Vendors
  listVendors: () => request<any>('/vendors'),
  getVendor: (id: number) => request<any>(`/vendors/${id}`),

  // Reports
  generateReport: (data: any) => request<any>('/reports/generate', { method: 'POST', body: JSON.stringify(data) }),
  listReports: () => request<any>('/reports'),
  getReportDownloadUrl: (id: number) => `${API_BASE_URL}/reports/${id}/download`,

  // Seed / Sample Files
  reseedDatabase: () => request<any>('/seed/reseed', { method: 'POST' }),
  listSampleFiles: () => request<any>('/seed/sample-files'),
  getSampleFileUrl: (filename: string) => `${API_BASE_URL}/seed/sample-files/${filename}`,
};
