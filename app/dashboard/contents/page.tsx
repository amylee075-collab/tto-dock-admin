import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/lib/types";
import ThumbnailImage from "@/components/contents/ThumbnailImage";

const TYPE_LABELS: Record<string, string> = {
  all: "전체",
  short: "짧은 글 읽기",
  long: "긴 글 읽기",
  category: "분야별 글 읽기",
  digital: "디지털 문해력",
};

const TYPE_VALUES = ["all", "short", "long", "category", "digital"] as const;

type Props = { searchParams: Promise<{ type?: string }> };

export default async function ContentsPage({ searchParams }: Props) {
  const { type: typeParam } = await searchParams;
  const currentType = typeParam && TYPE_VALUES.includes(typeParam as (typeof TYPE_VALUES)[number])
    ? (typeParam as (typeof TYPE_VALUES)[number])
    : "all";

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("contents")
    .select("*")
    .order("updated_at", { ascending: false });

  const allContents = (rows ?? []) as Content[];

  const countByType: Record<string, number> = {
    all: allContents.length,
    short: allContents.filter((c) => c.type === "short").length,
    long: allContents.filter((c) => c.type === "long").length,
    category: allContents.filter((c) => c.type === "category").length,
    digital: allContents.filter((c) => c.type === "digital").length,
  };

  const contents =
    currentType === "all"
      ? allContents
      : allContents.filter((c) => c.type === currentType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#212529]">콘텐츠 관리</h1>
          <p className="mt-1 text-gray-600">읽기 콘텐츠를 등록·수정·삭제합니다.</p>
        </div>
        <Link
          href="/dashboard/contents/new"
          className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#ff5700" }}
        >
          + 새 콘텐츠
        </Link>
      </div>

      {!error && allContents.length > 0 && (
        <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3" aria-label="콘텐츠 유형별 보기">
          {TYPE_VALUES.map((t) => (
            <Link
              key={t}
              href={t === "all" ? "/dashboard/contents" : `/dashboard/contents?type=${t}`}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                currentType === t
                  ? "bg-[#ff5700] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {TYPE_LABELS[t]} ({countByType[t]})
            </Link>
          ))}
        </nav>
      )}

      {error && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800">
          <p className="font-medium">테이블을 찾을 수 없습니다.</p>
          <p className="text-sm mt-1">Supabase에 &quot;contents&quot; 테이블을 만들고, Storage에 &quot;thumbnails&quot; 버킷을 추가해 주세요.</p>
        </div>
      )}

      {!error && allContents.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">등록된 콘텐츠가 없습니다.</p>
          <Link
            href="/dashboard/contents/new"
            className="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-xl font-medium text-[#ff5700] hover:bg-orange-50 transition"
          >
            첫 콘텐츠 등록하기
          </Link>
        </div>
      )}

      {!error && allContents.length > 0 && contents.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">이 유형에 해당하는 콘텐츠가 없습니다.</p>
          <Link
            href="/dashboard/contents"
            className="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-xl font-medium text-[#ff5700] hover:bg-orange-50 transition"
          >
            전체 보기
          </Link>
        </div>
      )}

      {!error && contents.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/contents/${c.id}/edit`}
                className="block rounded-2xl border-2 border-gray-100 bg-white overflow-hidden shadow-sm hover:border-[#ff5700]/50 hover:shadow-md transition"
              >
                <div className="aspect-video bg-gray-100 relative">
                  <ThumbnailImage
                    src={c.thumbnail_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#212529] truncate">{c.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{c.description ?? "—"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
