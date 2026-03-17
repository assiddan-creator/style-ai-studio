import { NextResponse } from "next/server";
import { getGallery } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    videos: getGallery(),
  });
}
