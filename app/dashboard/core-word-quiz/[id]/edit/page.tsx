import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CoreWordQuizForm from "@/components/core-word-quiz/CoreWordQuizForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditCoreWordQuizPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const supabase = await createClient();
  const { data, error } = await supabase.from("core_word_quiz").select("*").eq("id", id).single();

  if (error || !data) notFound();

  // jsonb가 문자열로 올 수 있음 → 항상 배열/객체로 정규화 (저장 오류 방지)
  function toSelectableWords(v: unknown): string[] {
    if (v == null) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      try {
        const p = JSON.parse(v);
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    }
    return [];
  }
  function toFeedbackByWord(v: unknown): Record<string, string> {
    if (v == null) return {};
    if (typeof v === "object" && v !== null) return v as Record<string, string>;
    if (typeof v === "string") {
      try {
        const p = JSON.parse(v);
        return typeof p === "object" && p !== null ? p : {};
      } catch {
        return {};
      }
    }
    return {};
  }
  const selectableWords = toSelectableWords(data.selectable_words);
  const feedbackByWord = toFeedbackByWord(data.feedback_by_word);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">문해력 기초 훈련 문항 수정</h1>
        <p className="mt-1 text-gray-600">문장, 정답, 선택지, 단어별 피드백을 수정하세요.</p>
      </div>
      <CoreWordQuizForm
        id={data.id}
        initialSentence={data.sentence}
        initialCorrectAnswer={data.correct_answer}
        initialSelectableWords={selectableWords}
        initialFeedbackByWord={feedbackByWord}
        initialSortOrder={data.sort_order ?? null}
      />
    </div>
  );
}
