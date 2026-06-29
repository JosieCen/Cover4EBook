import type { ArtDirectionPresetId, FontFamilyId, LayoutPresetId } from "@/lib/types";

export interface ArtDirectionPreset {
  id: ArtDirectionPresetId;
  label: string;
  summary: string;
  promptDescriptor: string;
  accent: string;
  preview: string;
}

export interface FontOption {
  id: FontFamilyId;
  label: string;
  cssStack: string;
}

export const artDirectionPresets: ArtDirectionPreset[] = [
  {
    id: "woodcut_noir",
    label: "Woodcut Noir",
    summary: "Etched shadows, storm tone, dramatic contrast.",
    promptDescriptor:
      "monochrome literary woodcut, etched line work, storm-lit atmosphere, dramatic negative space, tactile paper grain",
    accent: "#cf8b49",
    preview: "linear-gradient(145deg, #11140f 0%, #343126 42%, #efe4d2 100%)",
  },
  {
    id: "cinematic_watercolor",
    label: "Cinematic Watercolor",
    summary: "Luminous washes, soft horizon, atmospheric motion.",
    promptDescriptor:
      "cinematic watercolor illustration, luminous mist, layered sea spray, painterly depth, restrained brush bloom",
    accent: "#7c8e86",
    preview: "linear-gradient(145deg, #d5e1dd 0%, #91a79e 45%, #faf3e8 100%)",
  },
  {
    id: "mythic_minimalism",
    label: "Mythic Minimalism",
    summary: "Graphic silhouettes, sacred geometry, quiet scale.",
    promptDescriptor:
      "mythic minimal poster design, restrained shapes, symbolic silhouette, spacious composition, elegant tonal restraint",
    accent: "#b89b63",
    preview: "linear-gradient(145deg, #0e1b1b 0%, #3c5148 48%, #f3e8d0 100%)",
  },
  {
    id: "retro_pulp",
    label: "Retro Pulp",
    summary: "Bold ink, sharp diagonals, vintage adventure energy.",
    promptDescriptor:
      "retro pulp cover painting, bold spotlighting, vivid focal color, adventurous tension, classic paperback drama",
    accent: "#b2572f",
    preview: "linear-gradient(145deg, #23150f 0%, #7f311f 50%, #f0ddc2 100%)",
  },
  {
    id: "quiet_literary",
    label: "Quiet Literary",
    summary: "Elegant realism, stillness, reflective mood.",
    promptDescriptor:
      "quiet literary cover illustration, restrained realism, contemplative composition, subtle texture, refined natural palette",
    accent: "#6f7860",
    preview: "linear-gradient(145deg, #ede6d8 0%, #c9ccb7 52%, #fbf8f3 100%)",
  },
];

export const fontOptions: FontOption[] = [
  {
    id: "ivory_display",
    label: "Ivory Display",
    cssStack: "\"Baskerville Old Face\", Baskerville, \"Times New Roman\", serif",
  },
  {
    id: "lighthouse_serif",
    label: "Lighthouse Serif",
    cssStack: "\"Palatino Linotype\", Palatino, Garamond, serif",
  },
  {
    id: "narrative_sans",
    label: "Narrative Sans",
    cssStack: "\"Avenir Next\", \"Segoe UI\", Arial, sans-serif",
  },
  {
    id: "pulp_display",
    label: "Pulp Display",
    cssStack: "\"Trebuchet MS\", Verdana, sans-serif",
  },
  {
    id: "quiet_grotesk",
    label: "Quiet Grotesk",
    cssStack: "\"Gill Sans\", \"Segoe UI\", sans-serif",
  },
  {
    id: "ancient_kaiti",
    label: "Ancient Kai",
    cssStack: "\"STKaiti\", KaiTi, \"Kaiti SC\", serif",
  },
  {
    id: "scholar_fangsong",
    label: "Scholar FangSong",
    cssStack: "\"FangSong\", STFangsong, serif",
  },
  {
    id: "seal_song",
    label: "Seal Song",
    cssStack: "\"SimSun\", \"Songti SC\", serif",
  },
  {
    id: "western_roman",
    label: "Western Roman",
    cssStack: "\"Georgia\", \"Book Antiqua\", Garamond, serif",
  },
  {
    id: "editorial_modern",
    label: "Editorial Modern",
    cssStack: "\"Constantia\", \"Cambria\", serif",
  },
  {
    id: "storybook_script",
    label: "Storybook Script",
    cssStack: "\"Brush Script MT\", \"Segoe Script\", cursive",
  },
  {
    id: "poster_black",
    label: "Poster Black",
    cssStack: "\"Arial Black\", Impact, sans-serif",
  },
];

export const layoutPresets: Array<{ id: LayoutPresetId; label: string; description: string }> = [
  { id: "stacked_center", label: "Stacked Center", description: "Centered title block with supporting author line." },
  { id: "low_center", label: "Low Center", description: "Title in the lower third with a balanced breathing margin." },
  { id: "top_band", label: "Top Band", description: "Title-led composition anchored near the upper edge." },
  { id: "author_forward", label: "Author Forward", description: "Stronger author treatment for established names." },
];

export function getArtDirectionPreset(id: ArtDirectionPresetId) {
  return artDirectionPresets.find((preset) => preset.id === id) ?? artDirectionPresets[0];
}

export function getFontStack(id: FontFamilyId) {
  return fontOptions.find((font) => font.id === id)?.cssStack ?? fontOptions[0].cssStack;
}
