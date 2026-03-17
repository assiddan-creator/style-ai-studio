import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type GalleryResource = {
  url: string;
  resource_type: "image" | "video";
  created_at: string;
  public_id: string;
};

const mapResource = (
  r: { secure_url?: string; created_at?: string; public_id?: string },
  type: "image" | "video"
): GalleryResource => ({
  url: r.secure_url ?? "",
  resource_type: type,
  created_at: r.created_at ?? new Date().toISOString(),
  public_id: r.public_id ?? "",
});

/**
 * Fetches both images and videos from Cloudinary (gallery_photos + gallery_videos),
 * merges them, and sorts by most recent creation date.
 */
export async function getTodaysPhotos(): Promise<GalleryResource[]> {
  const [imagesSettled, videosSettled] = await Promise.allSettled([
    cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: "gallery_photos",
      max_results: 100,
    }),
    cloudinary.api.resources({
      type: "upload",
      resource_type: "video",
      prefix: "gallery_videos",
      max_results: 100,
    }),
  ]);

  const images: GalleryResource[] =
    imagesSettled.status === "fulfilled"
      ? (imagesSettled.value.resources ?? []).map((r: { secure_url?: string; created_at?: string; public_id?: string }) =>
          mapResource(r, "image")
        )
      : [];
  const videos: GalleryResource[] =
    videosSettled.status === "fulfilled"
      ? (videosSettled.value.resources ?? []).map((r: { secure_url?: string; created_at?: string; public_id?: string }) =>
          mapResource(r, "video")
        )
      : [];

  const merged = [...images, ...videos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return merged;
}
