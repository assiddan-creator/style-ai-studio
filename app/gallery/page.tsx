"use client";

import { useEffect, useState } from "react";
import ShareQR from "@/components/ShareQR";

type VideoItem = {
  id: string;
  url: string;
  createdAt: number;
};

export default function GalleryPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data) => setVideos(Array.isArray(data?.videos) ? data.videos : []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setShareUrl(typeof window !== "undefined" ? window.location.href : "");
  }, []);

  return (
    <main className="min-h-screen bg-[#040406] text-white p-4 md:p-8" dir="rtl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
          גלריה
        </h1>
        <p className="text-zinc-500 text-sm mt-2">סרטוני AI מהאירוע</p>
      </header>

      {shareUrl ? (
        <div className="flex justify-center mb-8">
          <ShareQR url={shareUrl} />
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-2 border-t-violet-500 border-zinc-700 rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p>עדיין אין סרטונים בגלריה.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex flex-col"
            >
              <video
                src={video.url}
                controls
                playsInline
                muted
                className="w-full aspect-video object-cover bg-black"
              />
              <div className="p-3 flex gap-2 flex-wrap">
                <a
                  href={video.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-center"
                >
                  ⬇️ הורדה
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.share?.({
                      title: "My AI Event Video",
                      url: typeof window !== "undefined" ? window.location.href : video.url,
                      text: "Check out my AI event video!",
                    });
                  }}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 text-center"
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
