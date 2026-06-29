// @vitest-environment node

import type OpenAI from "openai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { generateCoverVariants } from "@/lib/openai";

const originalImageModel = process.env.OPENAI_IMAGE_MODEL;

describe("generateCoverVariants", () => {
  afterEach(() => {
    if (originalImageModel === undefined) {
      delete process.env.OPENAI_IMAGE_MODEL;
    } else {
      process.env.OPENAI_IMAGE_MODEL = originalImageModel;
    }
  });

  it("uses gpt-image-2 when OPENAI_IMAGE_MODEL is not configured", async () => {
    delete process.env.OPENAI_IMAGE_MODEL;
    const generate = vi.fn().mockResolvedValue({
      data: [{ b64_json: "AAA" }],
    });
    const client = { images: { generate } } as unknown as Pick<OpenAI, "images">;

    await generateCoverVariants(client, {
      title: "The Secret Garden",
      author: "Frances Hodgson Burnett",
      sourceMode: "story_mood",
      sourceText: "A hidden garden in soft spring light, mysterious but hopeful.",
      artDirectionPresetId: "quiet_literary",
      customStylePrompt: "",
      variantCount: 1,
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-image-2",
      }),
    );
  });
});
