import { describe, expect, it } from "vitest";

import {
  buildExportFileName,
  getExportExtension,
  getExportMimeType,
  layoutTextLines,
} from "@/lib/export-cover";

describe("export helpers", () => {
  it("maps formats to mime types", () => {
    expect(getExportMimeType("png")).toBe("image/png");
    expect(getExportMimeType("jpg")).toBe("image/jpeg");
    expect(getExportMimeType("webp")).toBe("image/webp");
    expect(getExportMimeType("pdf")).toBe("application/pdf");
  });

  it("builds stable file names", () => {
    expect(buildExportFileName("The Last Lighthouse", "png")).toBe("the_last_lighthouse.png");
    expect(buildExportFileName("Ink & Ember Cover", "pdf")).toBe("ink_ember_cover.pdf");
  });

  it("uses jpg extension for jpeg exports", () => {
    expect(getExportExtension("jpg")).toBe("jpg");
  });

  it("preserves explicit line breaks when laying out text", () => {
    const ctx = {
      measureText: (value: string) => ({ width: value.length * 20 }),
    } as unknown as CanvasRenderingContext2D;

    expect(layoutTextLines(ctx, "The\nLighthouse\nArchive", 900, -1.6)).toEqual(["The", "Lighthouse", "Archive"]);
  });

  it("wraps oversized text without whitespace", () => {
    const ctx = {
      measureText: (value: string) => ({ width: value.length * 20 }),
    } as unknown as CanvasRenderingContext2D;

    expect(layoutTextLines(ctx, "长夜航灯归途", 80, 0)).toEqual(["长夜航灯", "归途"]);
  });
});
