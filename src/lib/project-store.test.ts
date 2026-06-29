import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { coverStudioDb, createProjectDraft, listStoredProjects, saveProject } from "@/lib/project-store";

describe("project storage", () => {
  beforeEach(async () => {
    await coverStudioDb.projects.clear();
  });

  it("stores and restores a project with selected variant and text layer settings", async () => {
    const project = createProjectDraft({
      title: "Ember Harbor",
      author: "Nora Vale",
    });

    project.selectedVariantId = "variant_a";
    project.variants = [
      {
        id: "variant_a",
        imageDataUrl: "data:image/png;base64,AAA",
        prompt: "prompt",
        createdAt: new Date().toISOString(),
      },
    ];
    project.textLayers.title.fontSize = 74;
    project.textLayers.author.letterSpacing = 4.2;

    await saveProject(project);
    const restored = await listStoredProjects();

    expect(restored).toHaveLength(1);
    expect(restored[0].selectedVariantId).toBe("variant_a");
    expect(restored[0].textLayers.title.fontSize).toBe(74);
    expect(restored[0].textLayers.author.letterSpacing).toBe(4.2);
  });
});
