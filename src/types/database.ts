export type BillingStatus = "free" | "active" | "past_due" | "canceled";

export type PassportStatus = "draft" | "published";

export type BatteryCategory = "LMT" | "EV" | "industrial";

export type FieldCheckStatus = "found" | "missing" | "uncertain";

export interface ExtractedFieldRecord {
  status: FieldCheckStatus;
  value: string;
  sourceSnippet: string;
}

export type ExtractionResultMap = Record<string, ExtractedFieldRecord>;

export interface OrgSummary {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: "owner" | "member";
  billingStatus: BillingStatus;
  compEnabled: boolean;
}

export interface ProductRow {
  id: string;
  org_id: string;
  name: string;
  model_code: string;
  created_at: string;
}

export interface PassportRow {
  id: string;
  org_id: string;
  product_id: string;
  slug: string;
  status: PassportStatus;
  battery_category: BatteryCategory;
  working_fields: Record<string, string>;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PassportVersionRow {
  id: string;
  passport_id: string;
  org_id: string;
  version_number: number;
  battery_category: BatteryCategory;
  snapshot_all_fields: Record<string, string>;
  snapshot_public_fields: Record<string, string>;
  snapshot_legitimate_interest_fields?: Record<string, string>;
  snapshot_authorities_only_fields?: Record<string, string>;
  declared_accurate_by: string;
  declared_at: string;
  created_at: string;
}

export interface PublishedPassportRecord {
  slug: string;
  battery_category?: BatteryCategory;
  version_number: number;
  snapshot_public_fields: Record<string, string>;
  declared_at: string;
  published_at: string;
}
