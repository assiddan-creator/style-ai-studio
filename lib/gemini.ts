import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type BuildPromptParams = {
  imageBase64A: string;
  imageBase64B?: string | null;
  presetPrompt?: string | null;
  customPrompt?: string | null;
};

/**
 * Builds a high-end fashion prompt using Gemini based on:
 * - Image A (identity / face) – required
 * - Optional Image B (outfit reference)
 * - Optional free-text instructions
 * - Optional presetPrompt (base styling intent from the app)
 *
 * Returns a single formatted prompt string ready to be wrapped with
 * IDENTITY PREFIX / ARRI SUFFIX on the caller side.
 */
export async function buildFashionPrompt({
  imageBase64A,
  imageBase64B,
  presetPrompt,
  customPrompt,
}: BuildPromptParams): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const hasImageB = Boolean(imageBase64B);
  const hasText = typeof customPrompt === "string" && customPrompt.trim().length > 0;

  const SYSTEM_PROMPT = `
You are an elite, sassy Tel Aviv fashion stylist ("Ochcha") helping generate a FINAL SINGLE prompt for an image-to-image model.

IMAGE A: The user's face / identity. You MUST preserve identity and bone structure.
IMAGE B (optional): An outfit reference. Only use its clothing / shoes / accessories, ignore its background, pose and lighting.
TEXT (optional): Extra styling commands, written by the user or the product team.
PRESET PROMPT (optional): A base styling intent from the app's preset catalog. May be "(none)" if the user chose free-form.

SCENARIO RULES:
- If PRESET PROMPT is "(none)" or empty: Use ONLY IMAGE B (if provided) and/or USER FREE-TEXT to build the styling prompt. Do not invent a preset.
- If only IMAGE A + PRESET PROMPT + optional TEXT are provided:
  * Do NOT describe any outfit swap between different people.
  * Take the PRESET PROMPT as the main styling intent.
  * If TEXT exists, refine / extend the PRESET PROMPT with that text.
  * Output a single, clean, production-ready fashion prompt that describes how to style IMAGE A.

- If IMAGE B is also provided:
  * CRITICAL: You must describe the clothing from IMAGE B as an EXACT 1:1 REPLICA.
  * Extract ONLY the outfit, shoes and accessories from IMAGE B. Apply that outfit onto IMAGE A's body, keeping IMAGE A's identity, body proportions and pose.
  * Analyze and explicitly describe any visible logos, brand marks, typography, precise fabric patterns, textures, and specific stitching.
  * Include strict negative commands in your description to prevent the image model from hallucinating or altering the garment design.
  * Do NOT invent, alter, or add any styling elements that are not explicitly present in Image B.
  * Append these exact technical keywords to the end of your generated prompt: "exact 1:1 garment replica, precise brand logo placement, identical fabric pattern, strictly no AI hallucinations on the clothing".
  * Use the PRESET PROMPT as a soft bias for overall vibe, not as a second outfit. If TEXT exists, append those instructions before the technical keywords (for color tweaks, makeup, vibe, etc.).

OUTPUT FORMAT:
Respond ONLY with valid JSON (no markdown, no backticks), shaped as:
{
  "final_prompt": "single line, English, production-ready prompt here"
}
`;

  const parts: Array<
    | string
    | {
        inlineData: {
          mimeType: string;
          data: string;
        };
      }
  > = [];

  parts.push(SYSTEM_PROMPT.trim());

  const presetText = (presetPrompt ?? "").trim();
  parts.push(
    `PRESET PROMPT (optional):\n${presetText || "(none)"}\n\n` +
      `USER FREE-TEXT (may be empty):\n${(customPrompt || "").trim()}`
  );

  // Image A is always required
  parts.push({
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64A,
    },
  });

  // Image B is optional
  if (hasImageB && imageBase64B) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64B,
      },
    });
  }

  const result = await model.generateContent(parts);
  const text = result.response.text().trim();
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(clean) as { final_prompt?: string };
    if (parsed.final_prompt && typeof parsed.final_prompt === "string") {
      return parsed.final_prompt.trim();
    }
  } catch {
    // fall through to raw text
  }

  // Fallback: use the raw text as-is if JSON parsing fails
  return clean;
}

