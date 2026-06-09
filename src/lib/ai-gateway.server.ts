import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export function createOllamaProvider(baseURL: string) {
  const normalized = baseURL.replace(/\/+$/, "");
  const url = /\/v1$/.test(normalized) ? normalized : `${normalized}/v1`;
  return createOpenAICompatible({
    name: "ollama",
    baseURL: url,
    headers: {
      Authorization: "Bearer ollama",
    },
  });
}
