import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import {
  buildArtifactPrompt,
  buildExpertArtifactPrompt,
  buildFinalReportPrompt,
  buildGuidedSystemPrompt,
} from "./oa-prompts";

const MODEL = "openai/gpt-5-mini";

const ProjectSchema = z.object({
  id: z.string().max(128),
  name: z.string().max(200),
  problemStatement: z.string().max(4000).default(""),
  createdAt: z.string().max(64),
  updatedAt: z.string().max(64),
  steps: z.record(z.string().max(8), z.any()),
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

function getProviderAndModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return { provider: createLovableAiGatewayProvider(key), model: MODEL };
}


export const oaGuidedTurn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      project: ProjectSchema,
      stepId: z.number().int().min(1).max(8),
      messages: z.array(MessageSchema).max(60),
    }),
  )
  .handler(async ({ data }) => {
    requireSameOrigin();
    const { provider, model } = getProviderAndModel();
    const system = buildGuidedSystemPrompt(data.project as never, data.stepId);
    const messages =
      data.messages.length === 0
        ? [{ role: "user" as const, content: "Begin Step " + data.stepId + ". Ask your first question." }]
        : data.messages;

    const result = await generateText({
      model: provider(model),
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
      mode: z.enum(["standard", "expert"]).default("standard"),
    }),
  )
  .handler(async ({ data }) => {
    requireSameOrigin();
    const { provider, model } = getProviderAndModel();
    const expert =
      data.mode === "expert" ? buildExpertArtifactPrompt(data.project as never, data.stepId) : null;
    const prompt = expert ?? buildArtifactPrompt(data.project as never, data.stepId);
    const result = await generateText({
      model: provider(model),
      prompt,
    });
    return { artifact: result.text, mode: expert ? "expert" : "standard" };
  });

export const oaFinalReport = createServerFn({ method: "POST" })
  .inputValidator(z.object({ project: ProjectSchema }))
  .handler(async ({ data }) => {
    requireSameOrigin();
    const { provider, model } = getProviderAndModel();
    const prompt = buildFinalReportPrompt(data.project as never);
    const result = await generateText({
      model: provider(model),
      prompt,
    });
    return { report: result.text };
  });
