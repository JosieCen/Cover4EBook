export type SourceMode = "story_mood" | "excerpt" | "direct_description";
export type CoverCreationMode = "ai_generate" | "upload_background";

export type ArtDirectionPresetId =
  | "woodcut_noir"
  | "cinematic_watercolor"
  | "mythic_minimalism"
  | "retro_pulp"
  | "quiet_literary";

export type ExportFormat = "png" | "jpg" | "webp" | "pdf";

export type TextLayerKey = "title" | "author";

export type TextAlign = "left" | "center" | "right";

export type LayoutPresetId = "stacked_center" | "low_center" | "top_band" | "author_forward";

export type FontFamilyId =
  | "ivory_display"
  | "lighthouse_serif"
  | "narrative_sans"
  | "pulp_display"
  | "quiet_grotesk"
  | "ancient_kaiti"
  | "scholar_fangsong"
  | "seal_song"
  | "western_roman"
  | "editorial_modern"
  | "storybook_script"
  | "poster_black";

export interface TextLayer {
  key: TextLayerKey;
  text: string;
  x: number;
  y: number;
  width: number;
  fontFamily: FontFamilyId;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  color: string;
  align: TextAlign;
  uppercase: boolean;
}

export interface CoverVariant {
  id: string;
  imageDataUrl: string;
  prompt: string;
  revisedPrompt?: string;
  createdAt: string;
  sourceType?: "openai" | "upload" | "acceptance_mock";
}

export interface ExportSettings {
  format: ExportFormat;
  quality: "web" | "print";
  fileBaseName: string;
}

export interface CoverProject {
  id: string;
  name: string;
  title: string;
  author: string;
  coverCreationMode: CoverCreationMode;
  sourceMode: SourceMode;
  sourceText: string;
  artDirectionPresetId: ArtDirectionPresetId;
  customStylePrompt: string;
  uploadedBackgroundDataUrl?: string | null;
  variants: CoverVariant[];
  selectedVariantId: string | null;
  textLayers: Record<TextLayerKey, TextLayer>;
  layoutPresetId: LayoutPresetId;
  exportSettings: ExportSettings;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCoverRequest {
  title: string;
  author: string;
  sourceMode: SourceMode;
  sourceText: string;
  artDirectionPresetId: ArtDirectionPresetId;
  customStylePrompt?: string;
  variantCount: number;
}

export interface GenerateCoverResponse {
  prompt: string;
  variants: CoverVariant[];
}
