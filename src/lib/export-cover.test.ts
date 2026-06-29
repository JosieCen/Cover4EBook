import { describe, expect, it } from "vitest";

import {
  buildExportFileName,
  getExportExtension,
  getExportMimeType,
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
});
