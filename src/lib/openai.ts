import OpenAI from "openai";

import { getArtDirectionPreset } from "@/lib/art-direction";
import { buildCoverPrompt } from "@/lib/cover-prompt";
import type { CoverVariant, GenerateCoverRequest } from "@/lib/types";

export function createOpenAIClient(apiKey = process.env.OPENAI_API_KEY) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

export async function generateCoverVariants(
  client: Pick<OpenAI, "images">,
  input: GenerateCoverRequest,
) {
  const prompt = buildCoverPrompt(input);
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const quality = process.env.OPENAI_IMAGE_QUALITY ?? "high";

  const response = await client.images.generate({
    model,
    prompt,
    n: input.variantCount,
    size: "1024x1536",
    quality: quality as "auto" | "high" | "low" | "medium",
    output_format: "png",
  });

  const variants: CoverVariant[] = (response.data ?? []).map((image) => {
    if (!image.b64_json) {
      throw new Error("OpenAI did not return base64 image data.");
    }

    return {
      id: crypto.randomUUID(),
      imageDataUrl: `data:image/png;base64,${image.b64_json}`,
      prompt,
      revisedPrompt: image.revised_prompt,
      createdAt: new Date().toISOString(),
      sourceType: "openai",
    };
  });

  if (variants.length === 0) {
    throw new Error("OpenAI did not return any images.");
  }

  return {
    prompt,
    variants: variants.slice(0, input.variantCount),
  };
}

function buildMockSvgDataUrl(
  background: string,
  accent: string,
  silhouette: "lighthouse" | "moon" | "wave",
) {
  const artwork =
    silhouette === "moon"
      ? `<circle cx="520" cy="340" r="180" fill="${accent}" opacity="0.92" />
         <rect x="496" y="500" width="48" height="470" rx="20" fill="#111" />
         <circle cx="520" cy="470" r="78" fill="#111" />`
      : silhouette === "wave"
        ? `<path d="M0 1020 C220 890 370 1120 620 1010 C840 920 980 840 1024 770 L1024 1536 L0 1536 Z" fill="#141414" opacity="0.86"/>
           <path d="M0 1180 C220 1080 350 1250 560 1180 C780 1100 910 970 1024 930" stroke="${accent}" stroke-width="20" fill="none" opacity="0.75"/>`
        : `<path d="M348 1040 L432 640 L592 640 L676 1040 Z" fill="#141414"/>
           <rect x="414" y="590" width="196" height="60" rx="18" fill="#141414"/>
           <circle cx="512" cy="532" r="124" fill="${accent}" opacity="0.88"/>
           <rect x="480" y="330" width="64" height="250" rx="22" fill="#141414"/>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${background.split(" ")[0] ?? "#111"}"/>
          <stop offset="100%" stop-color="${background.split(" ").at(-1) ?? "#efe4d2"}"/>
        </linearGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="1" stitchTiles="stitch"/>
          <feColorMatrix values="1 0 0 0 0
                                 0 1 0 0 0
                                 0 0 1 0 0
                                 0 0 0 0.04 0"/>
        </filter>
      </defs>
      <rect width="1024" height="1536" fill="url(#bg)"/>
      <rect width="1024" height="1536" filter="url(#grain)"/>
      <path d="M0 240 C220 160 420 310 700 230 C860 180 940 140 1024 100" stroke="#f6ebdc" stroke-width="44" fill="none" opacity="0.17"/>
      ${artwork}
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function generateAcceptanceMockCoverVariants(input: GenerateCoverRequest) {
  const prompt = buildCoverPrompt(input);
  const preset = getArtDirectionPreset(input.artDirectionPresetId);
  const mockBackgrounds = [
    { background: "#11140f #343126 #efe4d2", accent: preset.accent, silhouette: "lighthouse" as const },
    { background: "#d3dfda #8ea59b #faf3e8", accent: preset.accent, silhouette: "wave" as const },
    { background: "#0f1b1b #31463d #f4ead2", accent: preset.accent, silhouette: "moon" as const },
  ];

  return {
    prompt,
    variants: mockBackgrounds.slice(0, input.variantCount).map((item) => ({
      id: crypto.randomUUID(),
      imageDataUrl: buildMockSvgDataUrl(item.background, item.accent, item.silhouette),
      prompt,
      revisedPrompt: "acceptance mock",
      createdAt: new Date().toISOString(),
      sourceType: "acceptance_mock" as const,
    })),
  };
}
