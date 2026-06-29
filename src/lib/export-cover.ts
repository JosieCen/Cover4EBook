import { jsPDF } from "jspdf";

import { getFontStack } from "@/lib/art-direction";
import type { ExportFormat, TextLayer } from "@/lib/types";

const COVER_WIDTH = 1600;
const COVER_HEIGHT = 2400;

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

function fitLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    const trial = `${current} ${word}`;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
    }
  }

  lines.push(current);
  return lines;
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
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${fontFamily}`;
  ctx.fillStyle = layer.color;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "top";

  const renderedText = layer.uppercase ? layer.text.toUpperCase() : layer.text;
  const maxWidth = layer.width * COVER_WIDTH;
  const x = layer.x * COVER_WIDTH;
  const y = layer.y * COVER_HEIGHT;
  const lines = fitLines(ctx, renderedText, maxWidth);
  const lineHeightPx = layer.fontSize * layer.lineHeight;

  lines.forEach((line, index) => {
    const currentY = y + index * lineHeightPx;
    const lineWidth = ctx.measureText(line).width + Math.max(line.length - 1, 0) * layer.letterSpacing;
    const anchorX =
      layer.align === "center" ? x + maxWidth / 2 : layer.align === "right" ? x + maxWidth : x;
    const startX =
      layer.align === "center" ? anchorX - lineWidth / 2 : layer.align === "right" ? anchorX - lineWidth : anchorX;

    drawTrackedLine(ctx, line, startX, currentY, layer.letterSpacing);
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
