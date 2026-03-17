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

    if (!imageBase64A) {
      return NextResponse.json(
        { error: "Missing imageBase64A" },
        { status: 400 }
      );
    }

    const hasPreset = typeof presetPrompt === "string" && presetPrompt.trim().length > 0;
    const hasCustom = typeof customPrompt === "string" && customPrompt.trim().length > 0;
    const hasImageB = Boolean(imageBase64B);
    if (!hasPreset && !hasCustom && !hasImageB) {
      return NextResponse.json(
        { error: "Provide at least one of: presetPrompt, customPrompt, or imageBase64B" },
        { status: 400 }
      );
    }

    const finalCorePrompt = await buildFashionPrompt({
      imageBase64A,
      imageBase64B: imageBase64B ?? undefined,
      presetPrompt: hasPreset ? presetPrompt : undefined,
      customPrompt: customPrompt ?? undefined,
    });

    return NextResponse.json({ prompt: finalCorePrompt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[PROMPT] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

