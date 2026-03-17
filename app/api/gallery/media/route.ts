import { NextResponse } from "next/server";
import { getTodaysPhotos } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

/**
 * GET /api/gallery/media — returns merged images + videos from Cloudinary, sorted by newest.
 */
export async function GET() {
  try {
    const items = await getTodaysPhotos();
    return NextResponse.json(items);
  } catch (err) {
    console.error("Gallery media error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
