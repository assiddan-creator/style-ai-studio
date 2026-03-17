"use client";

import { MediaCard } from "@/components/MediaCard";

type GalleryResource = {
  url: string;
  resource_type: "image" | "video";
  created_at: string;
  public_id: string;
};

export function TodayCarousel({ items }: { items: GalleryResource[] }) {
  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <h2 className="text-lg font-bold text-zinc-400 mb-4 px-1">קרוסלת היום</h2>
      <div className="overflow-x-auto pb-4 -mx-4 px-4 flex gap-4 snap-x snap-mandatory">
        {items.map((item) => (
          <div key={item.public_id || item.url} className="flex-shrink-0 w-[280px] snap-center">
            <MediaCard item={item} className="w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
