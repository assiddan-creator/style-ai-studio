import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// Replicate client (use typed `auth` field)
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  "nano-banana": "google/nano-banana",
  "nano-pro": "google/nano-banana-pro",
  "flux-pro": "black-forest-labs/flux-2-pro",
  "seedream": "bytedance/seedream-5-lite",
} as const;

type EngineKey = keyof typeof MODELS;

export async function POST(req: NextRequest) {
  try {
    const { userInput, imageBase64, engine = "nano-pro" } = await req.json() as {
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

    const model = MODELS[engine] ?? MODELS["nano-pro"];

    // Ensure we have a proper data URI when needed
    let formattedImage = imageBase64;
    if (!formattedImage.startsWith("data:image")) {
      formattedImage = `data:image/jpeg;base64,${imageBase64}`;
    }

    const dataUri = formattedImage;

    console.log(`[TRANSFORM] Engine: ${engine} | Preset: ${userInput.slice(0, 60)}...`);

    let output: unknown;

    if (engine === "flux-pro") {
      // FLUX.2 [pro]: single image is passed as `input_image`
      const input = {
        prompt: userInput,
        input_image: dataUri,
        output_format: "webp" as const,
        safety_tolerance: 2,
      };
      console.log("[TRANSFORM] Replicate Input (flux):", JSON.stringify(input));
      output = await replicate.run(model, { input });
    } else if (engine === "seedream") {
      // Seedream 5 Lite: image-to-image via `image_input` array
      const input = {
        prompt: userInput,
        image_input: [dataUri],
        size: "2K" as const,
      };
      console.log("[TRANSFORM] Replicate Input (seedream):", JSON.stringify(input));
      output = await replicate.run(model, { input });
    } else {
      // Nano Banana & Nano Banana Pro: both expect `image_input` as an array of data URI images
      const input = {
        prompt: userInput,
        image_input: [formattedImage],
        output_format: "jpg" as const,
      };
      console.log("[TRANSFORM] Replicate Input (nano):", JSON.stringify(input));
      output = await replicate.run(model, { input });
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
