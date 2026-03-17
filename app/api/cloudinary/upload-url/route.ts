import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// הגדרות קלאודינרי מה-.env.local שלך
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, taskId } = await req.json();

    if (!fileUrl || !taskId) {
      return NextResponse.json({ error: "Missing fileUrl or taskId" }, { status: 400 });
    }

    console.log(`[CLOUDINARY] Starting upload for task: ${taskId}`);

    // העלאה ישירה מה-URL של PoYo לקלאודינרי
    const uploadRes = await cloudinary.uploader.upload(fileUrl, {
      resource_type: "video",
      public_id: taskId, // חשוב! הגלריה תחפש לפי ה-ID הזה
      folder: "booth_videos",
      tags: ["booth-ai", taskId],
      overwrite: true,
    });

    console.log(`[CLOUDINARY] Success! Video available at: ${uploadRes.secure_url}`);

    return NextResponse.json({ success: true, url: uploadRes.secure_url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CLOUDINARY] Upload failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
