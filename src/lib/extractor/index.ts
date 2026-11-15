import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicModel } from "../../config/site.ts";
import {
  buildExtractionPrompt,
  SUBMIT_EXTRACTION_TOOL,
} from "./prompt.ts";
import {
  validateAndNormalizeExtraction,
  type NormalizedExtractionOutput,
} from "./schema.ts";
import { runMockDeterministicExtractor } from "./mock.ts";

export interface ExtractionUsageTelemetry {
  mode: "anthropic" | "mock";
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface FullExtractionResult extends NormalizedExtractionOutput {
  usage: ExtractionUsageTelemetry;
}

export async function extractBatteryFieldsFromText(
  untrustedText: string,
  fallbackFilename?: string,
): Promise<FullExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
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

  const model = getAnthropicModel();
  const client = new Anthropic({ apiKey });
  const { systemPrompt, userPrompt } = buildExtractionPrompt(untrustedText);

  const response = await client.messages.create({
    model,
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
      model,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  };
}
