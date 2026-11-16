import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  BLANK_DRAFT_AUDIT_ACTION,
  buildBlankDraftPayload,
} from "@/lib/workspace/blank-draft";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { slugifyPassportName } from "@/lib/workspace/helpers";

export async function POST(request: Request) {
  const ctx = await getWorkspaceContext();
  if (ctx.state === "unconfigured") {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 },
    );
  }
  if (ctx.state === "unauthenticated") {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }
  if (ctx.state === "error") {
    return NextResponse.json({ error: ctx.message }, { status: 500 });
  }

  let rawBody: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "Request body must be a JSON object." },
          { status: 400 },
        );
      }
      rawBody = parsed as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  let draftPayload;
  try {
    draftPayload = buildBlankDraftPayload({
      batteryCategory: rawBody.batteryCategory,
      productName: rawBody.productName,
      modelCode: rawBody.modelCode,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Invalid blank passport draft request.",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 503 },
      );
    }
    const slug = `${slugifyPassportName(draftPayload.productName)}-${randomBytes(3).toString("hex")}`;

    const { data: productRow, error: productErr } = await supabase
      .from("products")
      .insert({
        org_id: ctx.org.orgId,
        name: draftPayload.productName,
        model_code: draftPayload.modelCode,
      })
      .select("id")
      .single();

    if (productErr || !productRow) {
      return NextResponse.json(
        { error: "Could not create product record." },
        { status: 500 },
      );
    }

    let passportInsert = await supabase
      .from("passports")
      .insert({
        org_id: ctx.org.orgId,
        product_id: productRow.id,
        slug,
        status: "draft",
        battery_category: draftPayload.batteryCategory,
        working_fields: draftPayload.workingFields,
      })
      .select("id, slug")
      .single();

    if (passportInsert.error) {
      passportInsert = await supabase
        .from("passports")
        .insert({
          org_id: ctx.org.orgId,
          product_id: productRow.id,
          slug,
          status: "draft",
          working_fields: draftPayload.workingFields,
        })
        .select("id, slug")
        .single();
    }

    const { data: passportRow, error: passportErr } = passportInsert;
    if (passportErr || !passportRow) {
      return NextResponse.json(
        { error: "Could not create blank passport draft." },
        { status: 500 },
      );
    }

    // Write audit_log entry with action: "blank_draft_created".
    // Zero LLM calls are made and no row is inserted into `uploads`, so the
    // organization's daily PDF extraction cap is never incremented.
    await supabase.from("audit_log").insert({
      org_id: ctx.org.orgId,
      actor_user_id: ctx.user.id,
      action: BLANK_DRAFT_AUDIT_ACTION,
      target_type: "passport",
      target_id: passportRow.id,
      metadata: {
        battery_category: draftPayload.batteryCategory,
        product_name: draftPayload.productName,
        model_code: draftPayload.modelCode,
        llm_calls: 0,
        uploads_created: 0,
      },
    });

    return NextResponse.json({
      passportId: String(passportRow.id),
      slug: String(passportRow.slug),
      batteryCategory: draftPayload.batteryCategory,
      productName: draftPayload.productName,
      modelCode: draftPayload.modelCode,
      totalPages: 0,
      characterCount: 0,
      truncated: false,
      lowTextWarning: false,
      blankDraft: true,
      extraction: draftPayload.extraction,
      workingFields: draftPayload.workingFields,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Blank draft creation failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
