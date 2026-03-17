"use client";

import { QRCodeSVG } from "qrcode.react";

export default function ShareQR({ url }: { url: string }) {
  return (
    <div className="p-5 bg-white rounded-2xl inline-block">
      <QRCodeSVG value={url} size={180} level="M" />
      <p className="text-center text-sm text-zinc-600 mt-3">Scan to download</p>
    </div>
  );
}
