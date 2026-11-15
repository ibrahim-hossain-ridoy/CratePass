import { BATTERY_FIELDS } from "../config/battery-fields.ts";
import {
  normalizeFieldValues,
  projectPublicPassportFields,
  type FieldValueMap,
} from "./passport-projection.ts";
import type { BillingStatus } from "../types/database.ts";

export const ACCURACY_DECLARATION_TEXT =
  "I confirm this information is accurate and I am responsible for it";

export interface BillingGateInput {
  billingEnabled: boolean;
  billingStatus: BillingStatus;
  compEnabled: boolean;
}

export function canOrgPublish({
  billingEnabled,
  billingStatus,
  compEnabled,
}: BillingGateInput): boolean {
  if (!billingEnabled) return true;
  if (compEnabled) return true;
  return billingStatus === "active";
}

export interface PreparePublishInput {
  workingFields: Record<string, unknown>;
  declarationAccepted: boolean;
}

export interface PreparedSnapshots {
  snapshotAllFields: FieldValueMap;
  snapshotPublicFields: FieldValueMap;
  missingRequiredKeys: string[];
}

export function preparePublishSnapshots({
  workingFields,
  declarationAccepted,
}: PreparePublishInput): PreparedSnapshots {
  if (!declarationAccepted) {
    throw new Error(
      `Accuracy declaration required: "${ACCURACY_DECLARATION_TEXT}".`,
    );
  }

  const snapshotAllFields = normalizeFieldValues(workingFields);
  if (Object.keys(snapshotAllFields).length === 0) {
    throw new Error("At least one passport field must be populated before publishing.");
  }

  const snapshotPublicFields = projectPublicPassportFields(snapshotAllFields);
  const missingRequiredKeys = BATTERY_FIELDS.filter(
    (f) => f.required && !snapshotAllFields[f.key],
  ).map((f) => f.key);

  return {
    snapshotAllFields,
    snapshotPublicFields,
    missingRequiredKeys,
  };
}
