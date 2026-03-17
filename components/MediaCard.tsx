"use client";

type GalleryResource = {
  url: string;
  resource_type: "image" | "video";
  created_at: string;
  public_id: string;
};

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url) || url.includes("/video/");
}

export function MediaCard({ item, className = "" }: { item: GalleryResource; className?: string }) {
  const isVideo = item.resource_type === "video" || isVideoUrl(item.url);

  if (isVideo) {
    return (
      <div className={`overflow-hidden rounded-xl bg-zinc-900 ${className}`}>
        <video
          src={item.url}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover aspect-square"
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl bg-zinc-900 ${className}`}>
      <img src={item.url} alt="" className="w-full h-full object-cover aspect-square" />
    </div>
  );
}
