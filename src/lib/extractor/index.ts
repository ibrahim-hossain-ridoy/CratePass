import Anthropic from "@anthropic-ai/sdk";
import { siteConfig } from "../../config/site.ts";
import {
  buildExtractionPrompt,
  SUBMIT_EXTRACTION_TOOL,
} from "./prompt.ts";
import {
  validateAndNormalizeExtraction,
  type NormalizedExtractionOutput,
} from "./schema.ts";
import { runGeminiExtractor } from "./gemini.ts";
import { runMockDeterministicExtractor } from "./mock.ts";

export interface ExtractionUsageTelemetry {
  mode: "anthropic" | "gemini" | "mock";
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface FullExtractionResult extends NormalizedExtractionOutput {
  usage: ExtractionUsageTelemetry;
}

export type ExtractionProviderSelection =
  | { provider: "anthropic"; apiKey: string; model: string }
  | { provider: "gemini"; apiKey: string; model: string }
  | { provider: "mock"; apiKey: ""; model: "mock-deterministic" };

export interface ExtractBatteryOptions {
  pdfBytes?: Uint8Array;
  fetchImpl?: typeof fetch;
  env?: Record<string, string | undefined>;
}

/**
 * Resolve PDF extraction provider in strict priority order:
 * 1. ANTHROPIC_API_KEY (non-empty) -> Anthropic SDK
 * 2. GEMINI_API_KEY (non-empty)    -> Google Gemini REST API
 * 3. Neither set                   -> deterministic mock extractor
 */
export function resolveExtractionProvider(
  env: Record<string, string | undefined> = typeof process !== "undefined"
    ? process.env
    : {},
): ExtractionProviderSelection {
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    return {
      provider: "anthropic",
      apiKey: anthropicKey,
      model: env.ANTHROPIC_MODEL?.trim() || siteConfig.defaultAnthropicModel,
    };
  }

  const geminiKey = env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      model: env.GEMINI_MODEL?.trim() || siteConfig.defaultGeminiModel,
    };
  }

  return {
    provider: "mock",
    apiKey: "",
    model: "mock-deterministic",
  };
}

export async function extractBatteryFieldsFromText(
  untrustedText: string,
  fallbackFilename?: string,
  options?: ExtractBatteryOptions,
): Promise<FullExtractionResult> {
  const selected = resolveExtractionProvider(options?.env);

  if (selected.provider === "mock") {
    const mockResult = runMockDeterministicExtractor(
      untrustedText,
      fallbackFilename,
    );
    return {
      ...mockResult,
      usage: {
        mode: "mock",
        model: "mock-deterministic",
        inputTokens: 0,
        outputTokens: 0,
      },
    };
  }

  if (selected.provider === "gemini") {
    return runGeminiExtractor({
      apiKey: selected.apiKey,
      model: selected.model,
      untrustedText,
      pdfBytes: options?.pdfBytes,
      fetchImpl: options?.fetchImpl,
    });
  }

  const client = new Anthropic({ apiKey: selected.apiKey });
  const { systemPrompt, userPrompt } = buildExtractionPrompt(untrustedText);

  const response = await client.messages.create({
    model: selected.model,
    max_tokens: 4096,
    system: systemPrompt,
    tools: [SUBMIT_EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "submit_battery_extraction" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUseBlock = response.content.find(
    (block) =>
      block.type === "tool_use" && block.name === "submit_battery_extraction",
  );

  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("Extractor did not return structured JSON tool output.");
  }

  const validated = validateAndNormalizeExtraction(toolUseBlock.input);

  return {
    ...validated,
    usage: {
      mode: "anthropic",
      model: selected.model,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  };
}
