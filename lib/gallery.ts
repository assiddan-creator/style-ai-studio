export type VideoItem = {
  id: string;
  url: string;
  createdAt: number;
};

let gallery: VideoItem[] = [];

export function addVideo(item: VideoItem) {
  gallery.unshift(item);
  gallery = gallery.slice(0, 200);
}

export function getGallery() {
  return gallery;
}
