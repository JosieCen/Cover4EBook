import { describe, expect, it } from "vitest";

import { buildCoverPrompt } from "@/lib/cover-prompt";

describe("buildCoverPrompt", () => {
  it("builds a mood-based prompt with the selected preset", () => {
    const prompt = buildCoverPrompt({
      title: "The Last Lighthouse",
      author: "Evelyn Marlowe",
      sourceMode: "story_mood",
      sourceText: "Melancholic, windswept, and hopeful. Guidance in the face of loss.",
      artDirectionPresetId: "woodcut_noir",
      customStylePrompt: "",
      variantCount: 3,
    });

    expect(prompt).toContain("Art direction preset: Woodcut Noir.");
    expect(prompt).toContain("Mood brief:");
    expect(prompt).toContain("no visible title text");
  });

  it("includes custom style overrides for direct descriptions", () => {
    const prompt = buildCoverPrompt({
      title: "Ashes of Winter",
      author: "",
      sourceMode: "direct_description",
      sourceText: "A lone rider crossing a frozen valley at dusk.",
      artDirectionPresetId: "quiet_literary",
      customStylePrompt: "more horizon space, no characters near the camera",
      variantCount: 3,
    });

    expect(prompt).toContain("Direct visual brief:");
    expect(prompt).toContain("Additional style direction: more horizon space, no characters near the camera.");
    expect(prompt).toContain("quiet literary cover illustration");
  });

  it("trims long excerpts without losing the excerpt label", () => {
    const prompt = buildCoverPrompt({
      title: "Sea Archive",
      author: "M. Hall",
      sourceMode: "excerpt",
      sourceText: "storm ".repeat(250),
      artDirectionPresetId: "cinematic_watercolor",
      customStylePrompt: "",
      variantCount: 3,
    });

    expect(prompt).toContain("Story excerpt:");
    expect(prompt).toContain("cinematic watercolor illustration");
    expect(prompt.endsWith("readable text.")).toBe(true);
  });
});
