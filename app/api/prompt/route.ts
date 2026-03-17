import { NextRequest, NextResponse } from "next/server";
import { buildFashionPrompt } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      imageBase64A?: string;
      imageBase64B?: string | null;
      presetPrompt?: string;
      customPrompt?: string | null;
    };

    const { imageBase64A, imageBase64B, presetPrompt, customPrompt } = body;

    if (!imageBase64A || !presetPrompt) {
      return NextResponse.json(
        { error: "Missing imageBase64A or presetPrompt" },
        { status: 400 }
      );
    }

    const finalCorePrompt = await buildFashionPrompt({
      imageBase64A,
      imageBase64B: imageBase64B ?? undefined,
      presetPrompt,
      customPrompt: customPrompt ?? undefined,
    });

    return NextResponse.json({ prompt: finalCorePrompt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[PROMPT] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

