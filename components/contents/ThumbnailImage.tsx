"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt?: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
};

/**
 * Supabase Storage 등 외부 URL 이미지 표시.
 * 로드 실패 시(엑박) placeholder 표시.
 */
export default function ThumbnailImage({ src, alt = "", fill, className, sizes }: Props) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={fill ? "absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-4xl" : "flex items-center justify-center bg-gray-100 text-gray-400 text-2xl min-h-[120px]"}
        aria-hidden
      >
        📷
      </div>
    );
  }

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        sizes={sizes}
        onError={() => setError(true)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
