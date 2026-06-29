import { getArtDirectionPreset } from "@/lib/art-direction";
import type { GenerateCoverRequest } from "@/lib/types";

function getSourceLabel(sourceMode: GenerateCoverRequest["sourceMode"]) {
  switch (sourceMode) {
    case "story_mood":
      return "Mood brief";
    case "excerpt":
      return "Story excerpt";
    case "direct_description":
      return "Direct visual brief";
  }
}

function summarizeSourceText(sourceMode: GenerateCoverRequest["sourceMode"], sourceText: string) {
  const trimmed = sourceText.trim().replace(/\s+/g, " ");
  if (sourceMode === "excerpt" && trimmed.length > 900) {
    return `${trimmed.slice(0, 900)}...`;
  }
  return trimmed;
}

export function buildCoverPrompt(input: GenerateCoverRequest) {
  const preset = getArtDirectionPreset(input.artDirectionPresetId);
  const authorLine = input.author.trim() ? `Author context: ${input.author.trim()}.` : "Author context: omitted.";
  const customStyle = input.customStylePrompt?.trim()
    ? `Additional style direction: ${input.customStylePrompt.trim()}.`
    : "Additional style direction: none.";

  return [
    "Create a beautiful front cover illustration for an ebook.",
    "The result must be a vertical 2:3 book cover artwork with no visible title text, no visible author text, no typography, no letters, and no logo.",
    "Leave intentional negative space where a title and author can be overlaid later by the web app.",
    `Book title for thematic guidance only: ${input.title.trim()}.`,
    authorLine,
    `Art direction preset: ${preset.label}.`,
    `Preset style descriptor: ${preset.promptDescriptor}.`,
    `${getSourceLabel(input.sourceMode)}: ${summarizeSourceText(input.sourceMode, input.sourceText)}.`,
    customStyle,
    "Aim for a refined literary cover, composition-first, emotionally specific, high contrast where appropriate, and suitable for a premium novel cover.",
    "Avoid stock-photo clichés, extra border frames, mockup devices, and any readable text.",
  ].join(" ");
}
