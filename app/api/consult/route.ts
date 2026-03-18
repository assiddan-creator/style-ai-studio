import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      imageBase64A?: string;
      occasion?: string;
    };

    const { imageBase64A, occasion } = body;
    if (!imageBase64A) {
      return NextResponse.json({ error: "Missing imageBase64A" }, { status: 400 });
    }
    if (!occasion || typeof occasion !== "string" || occasion.trim().length === 0) {
      return NextResponse.json({ error: "Missing occasion" }, { status: 400 });
    }

    const systemPrompt =
      `You are an elite, sassy Tel Aviv fashion stylist ('Ochcha'). The user is dressing up for: ${occasion.trim()}. ` +
      `Analyze their current outfit in the image. Give them a funny, slightly roasting, but helpful consultation in Israeli Hebrew slang. ` +
      `Tell them why their current look does or doesn't work for this specific occasion, and recommend what style/vibe they should buy and wear instead from our store's ${occasion.trim()} department. ` +
      `Return ONLY a JSON object: { "consultation": "your hebrew text here" }.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64A,
        },
      },
    ]);

    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as { consultation?: string };

    return NextResponse.json({
      consultation: parsed.consultation ?? "",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CONSULT] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

