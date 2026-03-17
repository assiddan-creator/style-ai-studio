import { NextResponse } from "next/server";

/** Base URL for public video CDN — replace with your actual CDN or Cloudinary base. */
const CDN_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://yoursite.com";
const SHARE_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://yoursite.com";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const videoUrl = `${CDN_BASE.replace(/\/$/, "")}/${id}.mp4`;
  const shareUrl = `${SHARE_BASE.replace(/\/$/, "")}/v/${id}`;

  return NextResponse.json({
    video: videoUrl,
    share: shareUrl,
  });
}
