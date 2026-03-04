const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_THUMBNAILS_BUCKET ?? "thumbnails";

export function getThumbnailsBucket() {
  return BUCKET;
}

export function getPublicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return path;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
