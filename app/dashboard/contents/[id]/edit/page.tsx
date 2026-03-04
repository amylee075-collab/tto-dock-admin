import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContentForm from "@/components/contents/ContentForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditContentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("contents").select("*").eq("id", id).single();

  if (error || !data) notFound();

  const rawSection = data.section;
  const section =
    rawSection != null && typeof rawSection === "string" && rawSection.trim() !== ""
      ? rawSection.trim()
      : null;
  const rawBadges = data.badges;
  const badges: string[] =
    Array.isArray(rawBadges) && rawBadges.length > 0
      ? rawBadges.filter((b): b is string => typeof b === "string")
      : typeof rawBadges === "string"
        ? (() => {
            try {
              const p = JSON.parse(rawBadges);
              return Array.isArray(p) ? p.filter((b: unknown) => typeof b === "string") : [];
            } catch {
              return [];
            }
          })()
        : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">콘텐츠 수정</h1>
        <p className="mt-1 text-gray-600">제목, 설명, 섬네일, 분야/칩을 수정하세요.</p>
      </div>
      <ContentForm
        id={data.id}
        initialTitle={data.title}
        initialDescription={data.description}
        initialThumbnailUrl={data.thumbnail_url}
        initialType={data.type ?? "reading"}
        initialContent={data.content ?? ""}
        initialVocabulary={data.vocabulary ?? null}
        initialSection={section}
        initialBadges={badges.length > 0 ? badges : null}
      />
    </div>
  );
}
