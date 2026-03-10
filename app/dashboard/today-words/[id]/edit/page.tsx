import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TodayWordForm from "@/components/today-words/TodayWordForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditTodayWordPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const supabase = await createClient();
  const { data, error } = await supabase.from("today_words").select("*").eq("id", id).single();

  if (error || !data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">오늘의 단어 수정</h1>
        <p className="mt-1 text-gray-600">단어, 유형, 뜻, 예문을 수정하세요.</p>
      </div>
      <TodayWordForm
        id={data.id}
        initialWord={data.word}
        initialMeaning={data.meaning}
        initialExample={data.example}
        initialType={data.type}
      />
    </div>
  );
}
