import Dexie, { type EntityTable } from "dexie";

import type { CoverProject, LayoutPresetId, TextLayer } from "@/lib/types";

const DEFAULT_TIMESTAMP = () => new Date().toISOString();

export class CoverStudioDatabase extends Dexie {
  projects!: EntityTable<CoverProject, "id">;

  constructor() {
    super("cover4ebook_studio");
    this.version(1).stores({
      projects: "id, updatedAt, createdAt",
    });
  }
}

export const coverStudioDb = new CoverStudioDatabase();

function baseTextLayers(title: string, author: string): Record<"title" | "author", TextLayer> {
  return {
    title: {
      key: "title",
      text: title,
      x: 0.12,
      y: 0.56,
      width: 0.74,
      fontFamily: "ivory_display",
      fontSize: 66,
      fontWeight: 700,
      letterSpacing: -1.6,
      lineHeight: 0.98,
      color: "#f7f0e4",
      align: "center",
      uppercase: false,
    },
    author: {
      key: "author",
      text: author,
      x: 0.2,
      y: 0.82,
      width: 0.6,
      fontFamily: "quiet_grotesk",
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: 3.6,
      lineHeight: 1,
      color: "#d3a15f",
      align: "center",
      uppercase: true,
    },
  };
}

export function applyLayoutPreset(
  layoutPresetId: LayoutPresetId,
  titleLayer: TextLayer,
  authorLayer: TextLayer,
) {
  switch (layoutPresetId) {
    case "low_center":
      return {
        title: { ...titleLayer, x: 0.12, y: 0.63, width: 0.76, align: "center" as const },
        author: { ...authorLayer, x: 0.23, y: 0.85, width: 0.54, align: "center" as const },
      };
    case "top_band":
      return {
        title: { ...titleLayer, x: 0.1, y: 0.12, width: 0.8, align: "left" as const },
        author: { ...authorLayer, x: 0.1, y: 0.29, width: 0.52, align: "left" as const },
      };
    case "author_forward":
      return {
        title: { ...titleLayer, x: 0.12, y: 0.6, width: 0.72, align: "center" as const },
        author: { ...authorLayer, x: 0.18, y: 0.78, width: 0.64, fontSize: 28, align: "center" as const },
      };
    case "stacked_center":
    default:
      return {
        title: { ...titleLayer, x: 0.12, y: 0.56, width: 0.74, align: "center" as const },
        author: { ...authorLayer, x: 0.2, y: 0.82, width: 0.6, align: "center" as const },
      };
  }
}

export function createProjectDraft(partial?: Partial<CoverProject>): CoverProject {
  const createdAt = partial?.createdAt ?? DEFAULT_TIMESTAMP();
  const updatedAt = partial?.updatedAt ?? createdAt;
  const title = partial?.title ?? "The Last Lighthouse";
  const author = partial?.author ?? "Evelyn Marlowe";
  const layoutPresetId = partial?.layoutPresetId ?? "stacked_center";
  const layers = partial?.textLayers ?? baseTextLayers(title, author);
  const presetLayers = applyLayoutPreset(layoutPresetId, layers.title, layers.author);

  return {
    id: partial?.id ?? crypto.randomUUID(),
    name: partial?.name ?? (title || "Untitled Cover"),
    title,
    author,
    coverCreationMode: partial?.coverCreationMode ?? "ai_generate",
    sourceMode: partial?.sourceMode ?? "story_mood",
    sourceText:
      partial?.sourceText ??
      "Melancholic, windswept, and hopeful. A lone lighthouse stands against a stormy sea. Themes of guidance, resilience, and the human spirit.",
    artDirectionPresetId: partial?.artDirectionPresetId ?? "woodcut_noir",
    customStylePrompt: partial?.customStylePrompt ?? "",
    uploadedBackgroundDataUrl: partial?.uploadedBackgroundDataUrl ?? null,
    variants: partial?.variants ?? [],
    selectedVariantId: partial?.selectedVariantId ?? null,
    textLayers: {
      title: presetLayers.title,
      author: presetLayers.author,
    },
    layoutPresetId,
    exportSettings: partial?.exportSettings ?? {
      format: "png",
      quality: "print",
      fileBaseName: title.toLowerCase().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "cover_export",
    },
    createdAt,
    updatedAt,
  };
}

export async function listStoredProjects() {
  return coverStudioDb.projects.orderBy("updatedAt").reverse().toArray();
}

export async function saveProject(project: CoverProject) {
  const normalized = {
    ...project,
    name: project.title.trim() || project.name,
    updatedAt: DEFAULT_TIMESTAMP(),
  };

  await coverStudioDb.projects.put(normalized);
  return normalized;
}
