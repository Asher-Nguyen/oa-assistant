import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestHost } from "@tanstack/react-start/server";
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

function getProvider() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

/**
 * Reject cross-origin callers as a basic anti-abuse control on AI endpoints
 * that consume the server-side LOVABLE_API_KEY budget. Same-origin app
 * traffic (browser fetch from the deployed site) always sends Origin or
 * Referer matching the request host.
 */
function requireSameOrigin() {
  const host = getRequestHost();
  if (!host) throw new Response("Forbidden", { status: 403 });
  const origin = getRequestHeader("origin");
  const referer = getRequestHeader("referer");
  const source = origin ?? referer;
  if (!source) throw new Response("Forbidden", { status: 403 });
  try {
    const sourceHost = new URL(source).host;
    if (sourceHost !== host) throw new Response("Forbidden", { status: 403 });
  } catch {
    throw new Response("Forbidden", { status: 403 });
  }
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
    requireSameOrigin();
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
    requireSameOrigin();
    const provider = getProvider();
    const prompt = buildFinalReportPrompt(data.project as never);
    const result = await generateText({
      model: provider(MODEL),
      prompt,
    });
    return { report: result.text };
  });
