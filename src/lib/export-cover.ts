import { jsPDF } from "jspdf";

import { getFontStack } from "@/lib/art-direction";
import {
  EXPORT_COVER_HEIGHT,
  EXPORT_COVER_WIDTH,
  STUDIO_COVER_WIDTH,
  TEXT_LAYER_PADDING_X,
  TEXT_LAYER_PADDING_Y,
} from "@/lib/cover-stage";
import type { ExportFormat, TextLayer } from "@/lib/types";

const COVER_WIDTH = EXPORT_COVER_WIDTH;
const COVER_HEIGHT = EXPORT_COVER_HEIGHT;
const RENDER_SCALE = COVER_WIDTH / STUDIO_COVER_WIDTH;

export function getExportMimeType(format: ExportFormat) {
  switch (format) {
    case "png":
      return "image/png";
    case "jpg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "pdf":
      return "application/pdf";
  }
}

export function getExportExtension(format: ExportFormat) {
  return format === "jpg" ? "jpg" : format;
}

export function buildExportFileName(fileBaseName: string, format: ExportFormat) {
  const normalizedBase =
    fileBaseName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "cover_export";
  return `${normalizedBase}.${getExportExtension(format)}`;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load generated cover image."));
    image.src = source;
  });
}

function measureTrackedTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
) {
  if (text.length === 0) {
    return 0;
  }

  const glyphWidth = Array.from(text).reduce((sum, char) => sum + ctx.measureText(char).width, 0);
  return glyphWidth + Math.max(text.length - 1, 0) * letterSpacing;
}

function fitParagraphLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number,
) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [""];
  }

  if (!/\s/.test(trimmed)) {
    return fitCharacterLines(ctx, trimmed, maxWidth, letterSpacing);
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    const trial = `${current} ${word}`;
    if (measureTrackedTextWidth(ctx, trial, letterSpacing) <= maxWidth) {
      current = trial;
    } else {
      if (measureTrackedTextWidth(ctx, current, letterSpacing) > maxWidth) {
        lines.push(...fitCharacterLines(ctx, current, maxWidth, letterSpacing));
      } else {
        lines.push(current);
      }
      current = word;
    }
  }

  if (measureTrackedTextWidth(ctx, current, letterSpacing) > maxWidth) {
    lines.push(...fitCharacterLines(ctx, current, maxWidth, letterSpacing));
  } else {
    lines.push(current);
  }

  return lines;
}

function fitCharacterLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number,
) {
  const glyphs = Array.from(text);
  if (glyphs.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const glyph of glyphs) {
    const trial = `${current}${glyph}`;
    if (current.length === 0 || measureTrackedTextWidth(ctx, trial, letterSpacing) <= maxWidth) {
      current = trial;
    } else {
      lines.push(current);
      current = glyph;
    }
  }

  lines.push(current);
  return lines;
}

export function layoutTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number,
) {
  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split("\n");

  return paragraphs.flatMap((paragraph) => fitParagraphLines(ctx, paragraph, maxWidth, letterSpacing));
}

function drawTrackedLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  startX: number,
  y: number,
  letterSpacing: number,
) {
  if (letterSpacing === 0) {
    ctx.fillText(text, startX, y);
    return;
  }

  let cursorX = startX;
  for (const char of text) {
    ctx.fillText(char, cursorX, y);
    cursorX += ctx.measureText(char).width + letterSpacing;
  }
}

function drawLayer(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  const fontFamily = getFontStack(layer.fontFamily);
  const fontSize = layer.fontSize * RENDER_SCALE;
  const letterSpacing = layer.letterSpacing * RENDER_SCALE;
  const paddingX = TEXT_LAYER_PADDING_X * RENDER_SCALE;
  const paddingY = TEXT_LAYER_PADDING_Y * RENDER_SCALE;

  ctx.font = `${layer.fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = layer.color;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "top";

  const renderedText = layer.uppercase ? layer.text.toUpperCase() : layer.text;
  const boxWidth = layer.width * COVER_WIDTH;
  const maxWidth = Math.max(boxWidth - paddingX * 2, fontSize);
  const x = layer.x * COVER_WIDTH + paddingX;
  const y = layer.y * COVER_HEIGHT + paddingY;
  const lines = layoutTextLines(ctx, renderedText, maxWidth, letterSpacing);
  const lineHeightPx = fontSize * layer.lineHeight;

  lines.forEach((line, index) => {
    const currentY = y + index * lineHeightPx;
    const lineWidth = measureTrackedTextWidth(ctx, line, letterSpacing);
    const anchorX =
      layer.align === "center" ? x + maxWidth / 2 : layer.align === "right" ? x + maxWidth : x;
    const startX =
      layer.align === "center" ? anchorX - lineWidth / 2 : layer.align === "right" ? anchorX - lineWidth : anchorX;

    drawTrackedLine(ctx, line, startX, currentY, letterSpacing);
  });
}

export async function composeCoverCanvas(backgroundSrc: string, layers: TextLayer[]) {
  const image = await loadImage(backgroundSrc);
  const canvas = document.createElement("canvas");
  canvas.width = COVER_WIDTH;
  canvas.height = COVER_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  ctx.fillStyle = "#f5efe4";
  ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
  ctx.drawImage(image, 0, 0, COVER_WIDTH, COVER_HEIGHT);

  layers.forEach((layer) => drawLayer(ctx, layer));

  return canvas;
}

export async function renderCoverBlob(
  backgroundSrc: string,
  layers: TextLayer[],
  format: ExportFormat,
) {
  const canvas = await composeCoverCanvas(backgroundSrc, layers);

  if (format === "pdf") {
    const pdf = new jsPDF({
      unit: "px",
      format: [COVER_WIDTH, COVER_HEIGHT],
      orientation: "portrait",
      compress: true,
    });

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, COVER_WIDTH, COVER_HEIGHT);
    return pdf.output("blob");
  }

  const mimeType = getExportMimeType(format);
  const quality = format === "jpg" || format === "webp" ? 0.96 : undefined;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create export blob."));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}
