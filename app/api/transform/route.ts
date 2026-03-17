import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  "nano-banana": "google/nano-banana-pro",
  "flux":        "black-forest-labs/flux-2-pro",
} as const;

type EngineKey = keyof typeof MODELS;

export async function POST(req: NextRequest) {
  try {
    const { userInput, imageBase64, engine = "nano-banana" } = await req.json() as {
      userInput: string;
      imageBase64: string;
      engine?: EngineKey;
    };

    if (!userInput || !imageBase64) {
      return NextResponse.json(
        { error: "Missing userInput or imageBase64" },
        { status: 400 }
      );
    }

    const model = MODELS[engine] ?? MODELS["nano-banana"];
    const dataUri = `data:image/jpeg;base64,${imageBase64}`;

    console.log(`[TRANSFORM] Engine: ${engine} | Preset: ${userInput.slice(0, 60)}...`);

    let output: unknown;

    if (engine === "flux") {
      // Flux 2 Pro: שדה input_images (מערך)
      output = await replicate.run(model, {
        input: {
          prompt: userInput,
          input_images: [dataUri],
          output_format: "webp",
          safety_tolerance: 2,
        },
      });
    } else {
      // Nano Banana Pro: שדה image_input (מערך)
      output = await replicate.run(model, {
        input: {
          prompt: userInput,
          image_input: [dataUri],
          output_format: "jpg",
        },
      });
    }

    // חילוץ URL מהתוצאה — שני המודלים מחזירים אובייקט עם .url()
    let resultUrl: string | null = null;

    if (output && typeof (output as { url?: () => string }).url === "function") {
      resultUrl = (output as { url: () => string }).url();
    } else if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      if (typeof first?.url === "function") resultUrl = first.url();
      else resultUrl = String(first);
    } else if (typeof output === "string") {
      resultUrl = output;
    }

    if (!resultUrl) {
      console.error("[TRANSFORM] Unexpected output shape:", output);
      return NextResponse.json({ error: "No image returned from model" }, { status: 502 });
    }

    console.log("[TRANSFORM] Success:", resultUrl);
    return NextResponse.json({ images: [{ url: resultUrl }] });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[TRANSFORM] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
