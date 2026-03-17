import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type BuildPromptParams = {
  imageBase64A: string;
  imageBase64B?: string | null;
  presetPrompt: string;
  customPrompt?: string | null;
};

/**
 * Builds a high-end fashion prompt using Gemini based on:
 * - Image A (identity / face) – required
 * - Optional Image B (outfit reference)
 * - Optional free-text instructions
 * - Required presetPrompt (base styling intent from the app)
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
PRESET PROMPT: A base styling intent coming from the app's preset catalog.

SCENARIO RULES:
- If only IMAGE A + PRESET PROMPT + optional TEXT are provided:
  * Do NOT describe any outfit swap between different people.
  * Take the PRESET PROMPT as the main styling intent.
  * If TEXT exists, refine / extend the PRESET PROMPT with that text.
  * Output a single, clean, production-ready fashion prompt that describes how to style IMAGE A.

- If IMAGE B is also provided:
  * Extract ONLY the outfit, shoes and accessories from IMAGE B.
  * Apply that outfit onto IMAGE A's body, keeping IMAGE A's identity, body proportions and pose.
  * Use the PRESET PROMPT as a soft bias for overall vibe, not as a second outfit.
  * If TEXT exists, append those instructions at the end (for color tweaks, makeup, vibe, etc.).

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

  parts.push(
    `PRESET PROMPT:\n${presetPrompt.trim()}\n\n` +
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

