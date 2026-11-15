export type UserRole = 'admin' | 'auditor' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  company_id?: number;
  company_name?: string;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  full_name: string;
  email: string;
  company_name: string;
}

export interface ExtractedRecord {
  id: number;
  document_id: number;
  document_type: string;
  invoice_number?: string;
  transaction_ref?: string;
  vendor_name?: string;
  transaction_date?: string;
  due_date?: string;
  total_amount: number;
  tax_amount?: number;
  subtotal_amount?: number;
  currency: string;
  payment_status?: string;
  payment_method?: string;
  account_details?: string;
  description?: string;
  confidence_score: number;
  is_verified: boolean;
  verification_notes?: string;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  company_id: number;
  filename: string;
  file_type: string;
  category: string;
  file_size_bytes: number;
  upload_date: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  extracted_records_count: number;
  confidence_score: number;
  extracted_records?: ExtractedRecord[];
}

export interface TransactionItem {
  id: number;
  company_id: number;
  document_id?: number;
  vendor_id?: number;
  source_type: 'invoice' | 'bank_statement' | 'ledger' | 'receipt';
  transaction_type: 'expense' | 'income' | 'debit' | 'credit';
  transaction_date: string;
  amount: number;
  tax_amount: number;
  currency: string;
  vendor_name?: string;
  invoice_number?: string;
  reference_no?: string;
  description?: string;
  account_code?: string;
  match_status: 'matched' | 'unmatched' | 'partial' | 'discrepancy';
  is_duplicate: boolean;
  is_anomaly: boolean;
  has_missing_doc: boolean;
  created_at: string;
}

export interface TransactionMatchItem {
  id: number;
  primary_transaction_id: number;
  matched_transaction_id: number;
  match_type: 'exact' | 'fuzzy' | 'amount_mismatch' | 'date_mismatch' | 'manual';
  confidence_score: number;
  status: 'suggested' | 'confirmed' | 'rejected';
  amount_difference: number;
  date_difference_days: number;
  match_reasons?: string;
  auditor_notes?: string;
  created_at: string;
  updated_at: string;
  primary_transaction?: TransactionItem;
  matched_transaction?: TransactionItem;
}

export interface DiscrepancyItem {
  id: number;
  transaction_id: number;
  related_document_id?: number;
  discrepancy_type: string;
  expected_value: string;
  actual_value: string;
  difference_amount: number;
  risk_level: 'high' | 'medium' | 'low';
  explanation: string;
  status: 'unresolved' | 'resolved' | 'dismissed';
  resolution_notes?: string;
  created_at: string;
  transaction?: TransactionItem;
}

export interface DuplicateRecordItem {
  id: number;
  group_id: string;
  transaction_id: number;
  duplicate_type: string;
  confidence_score: number;
  flag_reason: string;
  status: 'flagged' | 'confirmed_duplicate' | 'false_positive' | 'resolved';
  resolution_notes?: string;
  created_at: string;
  transaction?: TransactionItem;
}

export interface DuplicateGroupItem {
  group_id: string;
  duplicate_type: string;
  confidence_score: number;
  flag_reason: string;
  status: string;
  records: DuplicateRecordItem[];
}

export interface AnomalyItem {
  id: number;
  transaction_id: number;
  anomaly_score: number;
  raw_isolation_score?: number;
  risk_level: 'high' | 'medium' | 'low';
  anomaly_factors: string;
  model_name: string;
  is_reviewed: boolean;
  auditor_disposition?: string;
  auditor_comments?: string;
  created_at: string;
  transaction?: TransactionItem;
}

export interface MissingDocItem {
  id: number;
  transaction_id: number;
  missing_document_type: string;
  explanation: string;
  risk_level: 'high' | 'medium' | 'low';
  is_resolved: boolean;
  attached_document_id?: number;
  resolved_at?: string;
  notes?: string;
  created_at: string;
  transaction?: TransactionItem;
}

export interface VendorItem {
  id: number;
  company_id: number;
  name: string;
  normalized_name: string;
  tax_id?: string;
  category: string;
  contact_email?: string;
  payment_terms: string;
  risk_rating: 'high' | 'medium' | 'low';
  risk_score: number;
  risk_reasons?: string;
  total_spend: number;
  transaction_count: number;
  duplicate_count: number;
  created_at: string;
  monthly_trend?: { month: string; amount: number }[];
}

export interface AuditReportItem {
  id: number;
  company_id: number;
  title: string;
  audit_period: string;
  total_transactions: number;
  documents_processed: number;
  discrepancies_count: number;
  duplicates_count: number;
  missing_docs_count: number;
  anomalies_count: number;
  high_risk_count: number;
  pdf_file_path?: string;
  file_size_bytes: number;
  executive_summary?: string;
  auditor_comments?: string;
  review_status: string;
  generated_by: string;
  created_at: string;
}

export interface DashboardStats {
  total_transactions: number;
  total_documents: number;
  total_discrepancies: number;
  total_duplicates: number;
  total_missing_docs: number;
  total_anomalies: number;
  total_spend: number;
  audit_health_score: number;
  overall_status: string;
  risk_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  type_distribution: {
    name: string;
    count: number;
    color: string;
  }[];
  monthly_trend: {
    month: string;
    income: number;
    expense: number;
    net: number;
  }[];
  high_risk_findings: {
    id: number;
    type: string;
    title: string;
    amount: number;
    vendor: string;
    risk_level: string;
    explanation: string;
    date: string;
  }[];
  recent_activities: {
    id: number;
    action: string;
    entity_type?: string;
    entity_id?: number;
    details?: string;
    timestamp: string;
    user_name?: string;
  }[];
}

export interface SampleFileItem {
  filename: string;
  size_bytes: number;
  file_type: string;
}
