import OpenAI from "openai";
import { NextResponse } from "next/server";

import { generateCoverRequestSchema } from "@/lib/cover-schema";
import { createOpenAIClient, generateAcceptanceMockCoverVariants, generateCoverVariants } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = generateCoverRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid cover generation request.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    if (process.env.COVER4EBOOK_ACCEPTANCE_MOCK === "1") {
      return NextResponse.json(generateAcceptanceMockCoverVariants(parsed.data), { status: 200 });
    }

    const response = await generateCoverVariants(createOpenAIClient(), parsed.data);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: "OpenAI image generation failed.",
          upstreamStatus: error.status ?? 502,
          details: error.message,
        },
        { status: error.status && error.status < 500 ? error.status : 502 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Cover generation failed.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Unexpected server failure." }, { status: 500 });
  }
}
