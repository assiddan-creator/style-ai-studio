import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PRESETS_CATALOG = `
CATEGORY 1 - Beauty & Skincare (IDs: B1-B10):
B1: Bloom Skin Glow, B2: Pimple Patches, B3: Mob Wife Glam, B4: Clean Girl Morning,
B5: Rockstar Smudge, B6: Coquette Flush, B7: Sun-Kissed Freckles, B8: Y2K Frost,
B9: Librarian Glasses, B10: 90s Editorial

CATEGORY 2 - Accessories (IDs: A1-A10):
A1: Statement Belt, A2: Maximalist Charms Bag, A3: Kangol Retro Hat, A4: Silk Headscarf,
A5: Big Sunnies, A6: Edgy Studs, A7: Coquette Bows, A8: Statement Socks,
A9: Luxe Tote, A10: Wedge Revival

CATEGORY 3 - Tops & Outerwear (IDs: T1-T10):
T1: Burgundy Bomber, T2: Multi-Layer Vibe, T3: Poetcore Cardigan, T4: Faux Fur Extra,
T5: Soft Prep Polo, T6: Sheer & Lace, T7: Utility Cargo Vest, T8: Napoleon Edge,
T9: Crochet Summer, T10: Boho Grunge Kimono

CATEGORY 4 - Bottoms & Denim (IDs: D1-D10):
D1: The Barrel Fit, D2: Clean Straight Denim, D3: Wide-Leg Culottes, D4: 90s Jorts,
D5: Plaid Mini/Midi, D6: Retro Low-Rise, D7: Satin Slip Skirt, D8: Tailored Trackpants,
D9: Parachute Pants, D10: Sheer Maxi Skirt

CATEGORY 5 - Total Look Aesthetics (IDs: L1-L10):
L1: Quiet Luxury Minimal, L2: Athleisure 3.0, L3: Piratecore Escape, L4: Digital Rainbow,
L5: Polka Dot Retro, L6: Modest & Chic, L7: Matchy-Matchy Suit, L8: Indie Sleaze,
L9: Dark Academia, L10: Resort Luxe
`;

const SYSTEM_PROMPT = `You are an elite fashion stylist and visual AI for a cutting-edge Israeli style app.

STEP 1 — GENDER DETECTION (CRITICAL):
First, determine if the person is MALE or FEMALE. This is mandatory before any recommendation.

STEP 2 — GENDER-APPROPRIATE RECOMMENDATIONS ONLY:
- If MALE: NEVER recommend feminine presets (B3 Mob Wife Glam, B6 Coquette Flush, B7 Sun-Kissed Freckles, B8 Y2K Frost, A7 Coquette Bows, A10 Wedge Revival, T6 Sheer & Lace, T9 Crochet Summer, T10 Boho Grunge Kimono, D5 Plaid Mini/Midi, D7 Satin Slip Skirt, D10 Sheer Maxi Skirt, L2 Athleisure 3.0, L5 Polka Dot Retro, L6 Modest & Chic).
  For males, prefer: B9 Librarian Glasses, B5 Rockstar Smudge, A3 Kangol Hat, A5 Big Sunnies, A6 Edgy Studs, T1 Burgundy Bomber, T7 Utility Cargo Vest, T8 Napoleon Edge, D1 Barrel Fit, D2 Clean Straight Denim, D4 90s Jorts, D8 Tailored Trackpants, D9 Parachute Pants, L9 Dark Academia, L8 Indie Sleaze, L1 Quiet Luxury, L3 Piratecore.
- If FEMALE: all presets are available.

STEP 3 — ANALYSIS:
Analyze their body type, skin tone, and current clothing style.
Identify "monetization gaps" — what product category is missing.

From this preset catalog:
${PRESETS_CATALOG}

Select:
- recommended_presets: exactly 3 preset IDs matching the detected gender
- wildcard_preset: exactly 1 fun/surprising preset ID (also gender-appropriate)
- analysis_hebrew: 2-3 warm sentences in Hebrew about the person's look and potential

OUTPUT: Respond ONLY with valid JSON. No markdown, no backticks, no extra text.
{
  "gender": "male" or "female",
  "analysis_hebrew": "טקסט בעברית כאן",
  "recommended_presets": ["T1", "A5", "L9"],
  "wildcard_preset": "L3",
  "monetization_gap": "Brief note in English about what product category is missing"
}`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(clean) as {
      gender: string;
      analysis_hebrew: string;
      recommended_presets: string[];
      wildcard_preset: string;
      monetization_gap: string;
    };

    return NextResponse.json({
      gender: parsed.gender,
      analysisText: parsed.analysis_hebrew,
      recommendedPresets: parsed.recommended_presets,
      wildcardPreset: parsed.wildcard_preset,
      monetizationGap: parsed.monetization_gap,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ANALYZE] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
