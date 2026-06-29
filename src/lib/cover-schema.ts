import { z } from "zod";

export const sourceModeSchema = z.enum(["story_mood", "excerpt", "direct_description"]);
export const artDirectionPresetIdSchema = z.enum([
  "woodcut_noir",
  "cinematic_watercolor",
  "mythic_minimalism",
  "retro_pulp",
  "quiet_literary",
]);

export const generateCoverRequestSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  author: z.string().trim().max(80).default(""),
  sourceMode: sourceModeSchema,
  sourceText: z.string().trim().min(20, "Add more source text so the art direction has enough material.").max(6000),
  artDirectionPresetId: artDirectionPresetIdSchema,
  customStylePrompt: z.string().trim().max(300).optional().or(z.literal("")),
  variantCount: z.number().int().min(1).max(3).default(3),
});
