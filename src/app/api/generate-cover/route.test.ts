// @vitest-environment node

import OpenAI from "openai";
import { afterEach, describe, expect, it, vi } from "vitest";

const { createOpenAIClient, generateCoverVariants } = vi.hoisted(() => ({
  createOpenAIClient: vi.fn(),
  generateCoverVariants: vi.fn(),
}));

vi.mock("@/lib/openai", () => ({
  createOpenAIClient,
  generateCoverVariants,
}));

import { POST } from "@/app/api/generate-cover/route";

describe("POST /api/generate-cover", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns generated variants for a valid request", async () => {
    generateCoverVariants.mockResolvedValue({
      prompt: "prompt",
      variants: [
        {
          id: "variant_1",
          imageDataUrl: "data:image/png;base64,AAA",
          prompt: "prompt",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const response = await POST(
      new Request("http://localhost/api/generate-cover", {
        method: "POST",
        body: JSON.stringify({
          title: "The Last Lighthouse",
          author: "Evelyn Marlowe",
          sourceMode: "story_mood",
          sourceText: "Melancholic, windswept, and hopeful. Guidance in the face of loss.",
          artDirectionPresetId: "woodcut_noir",
          customStylePrompt: "",
          variantCount: 3,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      prompt: "prompt",
      variants: [{ id: "variant_1" }],
    });
    expect(createOpenAIClient).toHaveBeenCalledTimes(1);
    expect(generateCoverVariants).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-cover", {
        method: "POST",
        body: JSON.stringify({
          title: "",
          author: "",
          sourceMode: "story_mood",
          sourceText: "too short",
          artDirectionPresetId: "woodcut_noir",
          variantCount: 3,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid cover generation request.",
    });
  });

  it("propagates OpenAI API errors with upstream context", async () => {
    generateCoverVariants.mockRejectedValue(
      new OpenAI.APIError(429, { message: "rate limited" }, "rate limited", new Headers()),
    );

    const response = await POST(
      new Request("http://localhost/api/generate-cover", {
        method: "POST",
        body: JSON.stringify({
          title: "The Last Lighthouse",
          author: "Evelyn Marlowe",
          sourceMode: "story_mood",
          sourceText: "Melancholic, windswept, and hopeful. Guidance in the face of loss.",
          artDirectionPresetId: "woodcut_noir",
          customStylePrompt: "",
          variantCount: 3,
        }),
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: "OpenAI image generation failed.",
      upstreamStatus: 429,
    });
  });
});
