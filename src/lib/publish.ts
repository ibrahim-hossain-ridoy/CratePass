import {
  BATTERY_FIELDS,
  isStaticBlockingFieldForCategory,
  type BatteryCategory,
} from "../config/battery-fields.ts";
import {
  projectTieredPassportSnapshots,
  type FieldValueMap,
} from "./passport-projection.ts";
import { checkPublishEntitlement } from "./entitlements.ts";
import type { BillingStatus } from "../types/database.ts";

export const ACCURACY_DECLARATION_TEXT =
  "I confirm this information is accurate and I am responsible for it";

export interface BillingGateInput {
  billingEnabled: boolean;
  billingStatus: BillingStatus;
  compEnabled: boolean;
  publishedPassportsCount?: number;
  isAlreadyPublished?: boolean;
  action?: "publish" | "publish_new_version" | "unpublish";
}

export function canOrgPublish({
  billingStatus,
  compEnabled,
  publishedPassportsCount = 0,
  isAlreadyPublished = false,
  action = "publish",
}: BillingGateInput): boolean {
  return checkPublishEntitlement({
    billingStatus,
    compEnabled,
    publishedPassportsCount,
    isAlreadyPublished,
    action,
  }).allowed;
}

export interface PreparePublishInput {
  workingFields: Record<string, unknown>;
  declarationAccepted: boolean;
  batteryCategory?: BatteryCategory;
}

export interface PreparedSnapshots {
  snapshotAllFields: FieldValueMap;
  snapshotPublicFields: FieldValueMap;
  snapshotLegitimateInterestFields: FieldValueMap;
  snapshotAuthoritiesOnlyFields: FieldValueMap;
  missingRequiredKeys: string[];
}

export function preparePublishSnapshots({
  workingFields,
  declarationAccepted,
  batteryCategory = "LMT",
}: PreparePublishInput): PreparedSnapshots {
  if (!declarationAccepted) {
    throw new Error(
      `Accuracy declaration required: "${ACCURACY_DECLARATION_TEXT}".`,
    );
  }

  const tiered = projectTieredPassportSnapshots(workingFields);
  if (Object.keys(tiered.snapshotAllFields).length === 0) {
    throw new Error(
      "At least one passport field must be populated before publishing.",
    );
  }

  // Only static fields required for the chosen category count as missing-required;
  // dynamic BMS telemetry fields (Points 51–71) are never required or blocking for publishing.
  const missingRequiredKeys = BATTERY_FIELDS.filter(
    (f) =>
      isStaticBlockingFieldForCategory(f, batteryCategory) &&
      !tiered.snapshotAllFields[f.key],
  ).map((f) => f.key);

  return {
    ...tiered,
    missingRequiredKeys,
  };
}
