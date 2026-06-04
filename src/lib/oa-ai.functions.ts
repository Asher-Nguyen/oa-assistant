import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import {
  buildArtifactPrompt,
  buildFinalReportPrompt,
  buildGuidedSystemPrompt,
} from "./oa-prompts";

const MODEL = "openai/gpt-5-mini";

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  problemStatement: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
  steps: z.record(z.string(), z.any()),
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

function getProvider() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

export const oaGuidedTurn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      project: ProjectSchema,
      stepId: z.number().int().min(1).max(8),
      messages: z.array(MessageSchema),
    }),
  )
  .handler(async ({ data }) => {
    const provider = getProvider();
    const system = buildGuidedSystemPrompt(data.project as never, data.stepId);
    const messages =
      data.messages.length === 0
        ? [{ role: "user" as const, content: "Begin Step " + data.stepId + ". Ask your first question." }]
        : data.messages;

    const result = await generateText({
      model: provider(MODEL),
      system,
      messages,
    });
    const text = result.text.trim();
    return { text, complete: /^STEP_COMPLETE\s*$/i.test(text) };
  });

export const oaGenerateArtifact = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      project: ProjectSchema,
      stepId: z.number().int().min(1).max(8),
    }),
  )
  .handler(async ({ data }) => {
    const provider = getProvider();
    const prompt = buildArtifactPrompt(data.project as never, data.stepId);
    const result = await generateText({
      model: provider(MODEL),
      prompt,
    });
    return { artifact: result.text };
  });

export const oaFinalReport = createServerFn({ method: "POST" })
  .inputValidator(z.object({ project: ProjectSchema }))
  .handler(async ({ data }) => {
    const provider = getProvider();
    const prompt = buildFinalReportPrompt(data.project as never);
    const result = await generateText({
      model: provider(MODEL),
      prompt,
    });
    return { report: result.text };
  });
