export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "admin" | "board_member" | "owner";
  phone: string;
  date_joined: string;
}

export interface Property {
  id: number;
  name: string;
  address: string;
  minimum_lease_term_months: number;
  require_screening_for_approval: boolean;
  unit_count: number;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: number;
  hoa_property: number;
  property_name: string;
  unit_number: string;
  address_line: string;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  occupancy_status: "owner_occupied" | "rented" | "vacant";
  current_owner_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface Lease {
  id: number;
  unit_number: string;
  owner: number;
  owner_name: string;
  tenants: Tenant[];
  tenant_full_name: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: string;
  lease_terms: string;
  term_months: number;
  days_until_expiration: number | null;
  status: LeaseStatus;
  submitted_at: string | null;
  approved_at: string | null;
  denied_at: string | null;
  activated_at: string | null;
  expired_at: string | null;
  terminated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LeaseStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "active"
  | "denied"
  | "expired"
  | "terminated";

export interface LeaseReview {
  id: number;
  lease: number;
  reviewer: number;
  reviewer_name: string;
  decision: "approved" | "denied" | "returned";
  comments: string;
  created_at: string;
}

export interface LeaseAmendment {
  id: number;
  lease: number;
  amended_by: number;
  amended_by_name: string;
  previous_end_date: string | null;
  new_end_date: string | null;
  previous_monthly_rent: string | null;
  new_monthly_rent: string | null;
  reason: string;
  requires_board_approval: boolean;
  approved: boolean | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
}

export interface Document {
  id: number;
  category: number;
  category_name: string;
  title: string;
  file: string;
  file_size: number;
  mime_type: string;
  version: number;
  is_current_version: boolean;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
}

export interface ScreeningRecord {
  id: number;
  lease: number;
  all_checks_completed: boolean;
  verified_by: number | null;
  verified_by_name: string | null;
  verified_at: string | null;
  notes: string;
  check_results: ScreeningCheckResult[];
  created_at: string;
  updated_at: string;
}

export interface ScreeningCheckResult {
  id: number;
  checklist_item: number;
  checklist_item_name: string;
  is_required: boolean;
  status: "pending" | "completed" | "waived";
  completed_at: string | null;
  notes: string;
}

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  active_leases: number;
  pending_reviews: number;
  expiring_30_days: number;
  expiring_60_days: number;
  expiring_90_days: number;
  occupancy: {
    total: number;
    owner_occupied: number;
    rented: number;
    vacant: number;
  };
}

export interface ComplianceRecord {
  lease_id: number;
  unit_number: string;
  tenant_name: string;
  owner_name: string;
  status: LeaseStatus;
  term_months: number;
  term_compliant: boolean;
  screening_complete: boolean;
  screening_verified: boolean;
  document_count: number;
}

export interface CommunicationLog {
  id: number;
  lease: number;
  sender: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
