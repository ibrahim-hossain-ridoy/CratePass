import {
  FREE_PLAN_LIMITS,
  PLAN_CATALOG,
  PRO_PLAN_LIMITS,
  type PlanId,
  type PlanLimits,
} from "../config/plans.ts";
import type { BillingStatus } from "../types/database.ts";

export interface WorkspaceEntitlementInput {
  billingStatus: BillingStatus;
  compEnabled: boolean;
}

export function resolveWorkspacePlan({
  billingStatus,
  compEnabled,
}: WorkspaceEntitlementInput): PlanId {
  if (billingStatus === "active" || compEnabled) {
    return "pro";
  }
  return "free";
}

export function getWorkspacePlanLimits(
  input: WorkspaceEntitlementInput,
): PlanLimits {
  const plan = resolveWorkspacePlan(input);
  return plan === "pro" ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS;
}

export function hasProFeatureAccess(
  input: WorkspaceEntitlementInput,
): boolean {
  return resolveWorkspacePlan(input) === "pro";
}

export interface PublishEntitlementInput extends WorkspaceEntitlementInput {
  publishedPassportsCount: number;
  isAlreadyPublished: boolean;
  action: "publish" | "publish_new_version" | "unpublish";
}

export interface PublishEntitlementResult {
  allowed: boolean;
  plan: PlanId;
  code?: "PLAN_LIMIT_REACHED";
  reason?: string;
  limit: number | null;
  current: number;
}

/**
 * Server-side & UI entitlement check for publishing a battery passport.
 * - Pro / comped workspaces: unlimited live published passports.
 * - Free workspaces: up to 3 live published passports; updating an already-published
 *   passport (v1 -> v2) or unpublishing is always allowed so users can manage their 3 slots.
 */
export function checkPublishEntitlement({
  billingStatus,
  compEnabled,
  publishedPassportsCount,
  isAlreadyPublished,
  action,
}: PublishEntitlementInput): PublishEntitlementResult {
  const plan = resolveWorkspacePlan({ billingStatus, compEnabled });
  const limits = PLAN_CATALOG[plan].limits;

  if (action === "unpublish" || plan === "pro") {
    return {
      allowed: true,
      plan,
      limit: limits.maxPublishedPassports,
      current: publishedPassportsCount,
    };
  }

  // Updating an already-live passport does not consume an extra live slot.
  if (isAlreadyPublished) {
    return {
      allowed: true,
      plan,
      limit: limits.maxPublishedPassports,
      current: publishedPassportsCount,
    };
  }

  const maxLive = limits.maxPublishedPassports ?? 3;
  if (publishedPassportsCount >= maxLive) {
    return {
      allowed: false,
      plan,
      code: "PLAN_LIMIT_REACHED",
      reason: `Free plan includes up to ${maxLive} live published battery passports (${publishedPassportsCount}/${maxLive} currently live). Upgrade to Pro (€79/mo) for unlimited live passports.`,
      limit: maxLive,
      current: publishedPassportsCount,
    };
  }

  return {
    allowed: true,
    plan,
    limit: maxLive,
    current: publishedPassportsCount,
  };
}

export interface SerializedUnitsEntitlementInput
  extends WorkspaceEntitlementInput {
  currentUnitsCount: number;
  incomingUnitsCount: number;
}

export interface SerializedUnitsEntitlementResult {
  allowed: boolean;
  plan: PlanId;
  code?: "PLAN_LIMIT_REACHED";
  reason?: string;
  limit: number | null;
  current: number;
  remaining: number | null;
}

/**
 * Server-side & UI entitlement check for serialized item-level unit QR records.
 * - Pro / comped workspaces: unlimited.
 * - Free workspaces: up to 25 serialized unit QR codes total across the workspace.
 */
export function checkSerializedUnitsEntitlement({
  billingStatus,
  compEnabled,
  currentUnitsCount,
  incomingUnitsCount,
}: SerializedUnitsEntitlementInput): SerializedUnitsEntitlementResult {
  const plan = resolveWorkspacePlan({ billingStatus, compEnabled });
  const limits = PLAN_CATALOG[plan].limits;

  if (plan === "pro" || limits.maxSerializedUnits === null) {
    return {
      allowed: true,
      plan,
      limit: null,
      current: currentUnitsCount,
      remaining: null,
    };
  }

  const maxUnits = limits.maxSerializedUnits;
  const remaining = Math.max(0, maxUnits - currentUnitsCount);
  if (currentUnitsCount + incomingUnitsCount > maxUnits) {
    return {
      allowed: false,
      plan,
      code: "PLAN_LIMIT_REACHED",
      reason: `Free plan includes up to ${maxUnits} serialized unit QR codes across your workspace (${currentUnitsCount} used, ${remaining} remaining). Upgrade to Pro (€79/mo) for unlimited bulk CSV serialization.`,
      limit: maxUnits,
      current: currentUnitsCount,
      remaining,
    };
  }

  return {
    allowed: true,
    plan,
    limit: maxUnits,
    current: currentUnitsCount,
    remaining: maxUnits - (currentUnitsCount + incomingUnitsCount),
  };
}

export interface DailyExtractionEntitlementResult {
  allowed: boolean;
  plan: PlanId;
  limit: number | null;
  used: number;
  remaining: number | null;
}

export function checkDailyExtractionEntitlement({
  billingStatus,
  compEnabled,
  dailyUsed,
}: WorkspaceEntitlementInput & {
  dailyUsed: number;
}): DailyExtractionEntitlementResult {
  const plan = resolveWorkspacePlan({ billingStatus, compEnabled });
  const limit = PLAN_CATALOG[plan].limits.dailyPdfExtractions;

  if (limit === null) {
    return {
      allowed: true,
      plan,
      limit: null,
      used: dailyUsed,
      remaining: null,
    };
  }

  return {
    allowed: dailyUsed < limit,
    plan,
    limit,
    used: dailyUsed,
    remaining: Math.max(0, limit - dailyUsed),
  };
}
