import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// Replicate client (use typed `auth` field)
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  "nano-banana": "google/nano-banana",
  "nano-pro": "google/nano-banana-pro",
  "nano-2": "google/nano-banana-2",
  "flux-pro": "black-forest-labs/flux-2-pro",
  "seedream": "bytedance/seedream-5-lite",
} as const;

type EngineKey = keyof typeof MODELS;

export async function POST(req: NextRequest) {
  try {
    const { userInput, imageBase64, imagesBase64, engine = "nano-pro" } =
      (await req.json()) as {
        userInput: string;
        imageBase64?: string;
        imagesBase64?: string[];
        engine?: EngineKey;
      };

    const rawImages =
      imagesBase64 && imagesBase64.length > 0
        ? imagesBase64
        : imageBase64
          ? [imageBase64]
          : [];

    if (!userInput || rawImages.length === 0) {
      return NextResponse.json(
        { error: "Missing userInput or image data" },
        { status: 400 }
      );
    }

    const model = MODELS[engine] ?? MODELS["nano-pro"];

    // Ensure we have proper data URIs when needed
    const formattedImages = rawImages.map((img) =>
      img.startsWith("data:image") ? img : `data:image/jpeg;base64,${img}`
    );

    const primaryImage = formattedImages[0];

    console.log(`[TRANSFORM] Engine: ${engine} | Preset: ${userInput.slice(0, 60)}...`);

    let output: unknown;

    if (engine === "flux-pro") {
      // FLUX.2 [pro]: expects `input_images` as an array of image data URIs
      const input = {
        prompt: userInput,
        input_images: formattedImages,
        aspect_ratio: "match_input_image" as const,
        output_format: "jpg" as const,
        safety_tolerance: 2,
      };
      console.log("[TRANSFORM] Replicate Input (flux):", JSON.stringify(input));
      output = await replicate.run(model, { input });
    } else if (engine === "seedream") {
      // Seedream 5 Lite: image-to-image via `image_input` array with 2K size and single image
      const input = {
        prompt: userInput,
        image_input: formattedImages,
        size: "2K" as const,
        sequential_image_generation: "disabled" as const,
        output_format: "jpeg" as const,
      };
      console.log("[TRANSFORM] Replicate Input (seedream):", JSON.stringify(input));
      output = await replicate.run(model, { input });
    } else {
      // Nano Banana family: nano-banana, nano-pro, nano-2
      if (engine === "nano-banana") {
        // Standard Nano Banana: data URI in image_input array + negative prompt
        const input = {
          prompt: userInput,
          image_input: [primaryImage],
          negative_prompt: "blurry, low quality, distorted, deformed",
          output_format: "jpg" as const,
        };
        console.log("[TRANSFORM] Replicate Input (nano-banana):", JSON.stringify(input));
        output = await replicate.run(model, { input });
      } else if (engine === "nano-pro") {
        // Nano Banana Pro: image_input array with extended controls
        const input = {
          prompt: userInput,
          image_input: [primaryImage],
          resolution: "1K",
          aspect_ratio: "match_input_image",
          safety_filter_level: "block_only_high",
          allow_fallback_model: true,
          output_format: "jpg" as const,
        };
        console.log("[TRANSFORM] Replicate Input (nano-pro):", JSON.stringify(input));
        output = await replicate.run(model, { input });
      } else {
        // Nano Banana 2 (Fast): image_input array with 1K resolution and disabled search features
        const input = {
          prompt: userInput,
          image_input: [primaryImage],
          resolution: "1K",
          aspect_ratio: "match_input_image",
          google_search: false,
          image_search: false,
          output_format: "jpg" as const,
        };
        console.log("[TRANSFORM] Replicate Input (nano-2):", JSON.stringify(input));
        output = await replicate.run(model, { input });
      }
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
