import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContentForm from "@/components/contents/ContentForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditContentPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contents")
    .select("id, title, description, thumbnail_url, type, content, vocabulary, section, badges, core_quiz, read_quizzes, summary_quiz, created_at, updated_at")
    .eq("id", id)
    .single();

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

  const rawCoreQuiz = data.core_quiz;
  const initialCoreQuiz =
    rawCoreQuiz && typeof rawCoreQuiz === "object" && !Array.isArray(rawCoreQuiz)
      ? (() => {
          const q = rawCoreQuiz as Record<string, unknown>;
          const wrongArray = Array.isArray(q.wrong_answers) ? (q.wrong_answers as unknown[]) : [];
          const wrong0 = typeof wrongArray[0] === "string" ? (wrongArray[0] as string) : "";
          const wrong1 = typeof wrongArray[1] === "string" ? (wrongArray[1] as string) : "";
          const similarArray = Array.isArray(q.similar_answers) ? (q.similar_answers as unknown[]) : [];
          const similar_answers = similarArray.filter((s): s is string => typeof s === "string");
          return {
            problem_sentence: String(q.problem_sentence ?? ""),
            correct_answer: String(q.correct_answer ?? ""),
            wrong_answers: [wrong0, wrong1] as [string, string],
            similar_answers,
          };
        })()
      : null;

  const rawReadQuizzes = data.read_quizzes;
  const initialReadQuizzes: { question: string; options: string[]; correct_answer: number }[] | null =
    Array.isArray(rawReadQuizzes) && rawReadQuizzes.length > 0
      ? rawReadQuizzes.slice(0, 5).map((q: Record<string, unknown>) => {
          const options = Array.isArray(q.options)
            ? (q.options as unknown[]).map((o) => String(o ?? ""))
            : [];
          const correctIdx = typeof q.correct_answer === "number" && q.correct_answer >= 0
            ? Math.min(q.correct_answer, Math.max(0, options.length - 1))
            : 0;
          return {
            question: String(q.question ?? ""),
            options: options.length >= 2 ? options : ["", ""],
            correct_answer: correctIdx,
          };
        })
      : null;

  const rawSummaryQuiz = data.summary_quiz;
  const initialSummaryQuiz: { question: string; model_answer: string }[] | null =
    Array.isArray(rawSummaryQuiz) && rawSummaryQuiz.length > 0
      ? rawSummaryQuiz.slice(0, 5).map((s: Record<string, unknown>) => ({
          question: String(s.question ?? ""),
          model_answer: String(s.model_answer ?? ""),
        }))
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">콘텐츠 수정</h1>
        <p className="mt-1 text-gray-600">제목, 설명, 섬네일, 분야/칩, 퀴즈를 수정하세요.</p>
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
        initialCoreQuiz={initialCoreQuiz}
        initialReadQuizzes={initialReadQuizzes || []}
        initialSummaryQuiz={initialSummaryQuiz}
      />
    </div>
  );
}
