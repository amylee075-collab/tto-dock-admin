"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getThumbnailsBucket } from "@/lib/supabase/storage";
import ThumbnailImage from "@/components/contents/ThumbnailImage";
import type { CoreQuiz, ReadQuizItem, SummaryQuizItem } from "@/lib/types";

type VocabularyItem = { word: string; meaning: string; example: string };

/** 분야 (복수 선택) */
const FIELD_OPTIONS = [
  "문학", "비문학", "과학", "역사", "사회", "예술", "기술·AI", "디지털", "신문 기사", "미디어 비판",
] as const;
/** 난이도 (1개만 선택) */
const DIFFICULTY_OPTIONS = ["★☆☆", "★★☆", "★★★"] as const;
/** 분야별 목록 그룹용: 과학·역사·사회 (section 컬럼 호환) */
const SECTION_LEGACY = ["과학", "역사", "사회"];

type ContentFormProps = {
  id?: string;
  initialTitle?: string;
  initialDescription?: string | null;
  initialThumbnailUrl?: string | null;
  initialType?: string;
  initialContent?: string | null;
  initialVocabulary?: VocabularyItem[] | null;
  initialSection?: string | null;
  initialBadges?: string[] | null;
  initialCoreQuiz?: CoreQuiz;
  initialReadQuizzes?: ReadQuizItem[] | null;
  initialSummaryQuiz?: SummaryQuizItem[] | null;
};

const emptyVocab = (): VocabularyItem => ({ word: "", meaning: "", example: "" });

export default function ContentForm({
  id,
  initialTitle = "",
  initialDescription = "",
  initialThumbnailUrl = null,
  initialType = "reading",
  initialContent = "",
  initialVocabulary = null,
  initialSection = null,
  initialBadges = null,
  initialCoreQuiz = null,
  initialReadQuizzes = null,
  initialSummaryQuiz = null,
}: ContentFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [content, setContent] = useState(initialContent ?? "");
  const [type, setType] = useState(initialType);
  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    if (!initialBadges?.length) return [];
    return initialBadges.filter((b) => FIELD_OPTIONS.includes(b as (typeof FIELD_OPTIONS)[number]));
  });
  const [difficulty, setDifficulty] = useState<string>(() => {
    const fromBadges = initialBadges?.find((b) => DIFFICULTY_OPTIONS.includes(b as (typeof DIFFICULTY_OPTIONS)[number]));
    return fromBadges ?? DIFFICULTY_OPTIONS[0];
  });
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(
    initialVocabulary && initialVocabulary.length > 0 ? initialVocabulary : [emptyVocab()]
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialThumbnailUrl);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultCoreQuiz = (): NonNullable<CoreQuiz> => ({
    problem_sentence: "",
    correct_answer: "",
    wrong_answers: ["", ""],
    similar_answers: [],
  });
  const defaultReadQuiz = (): ReadQuizItem => ({
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
  });
  const defaultSummaryItem = (): SummaryQuizItem => ({ question: "", model_answer: "" });

  const [coreQuiz, setCoreQuiz] = useState<NonNullable<CoreQuiz>>(() =>
    initialCoreQuiz && (initialCoreQuiz.problem_sentence || initialCoreQuiz.correct_answer)
      ? {
          problem_sentence: initialCoreQuiz.problem_sentence ?? "",
          correct_answer: initialCoreQuiz.correct_answer ?? "",
          wrong_answers: Array.isArray(initialCoreQuiz.wrong_answers) && initialCoreQuiz.wrong_answers.length >= 2
            ? [initialCoreQuiz.wrong_answers[0] ?? "", initialCoreQuiz.wrong_answers[1] ?? ""]
            : ["", ""],
          similar_answers: Array.isArray(initialCoreQuiz.similar_answers) ? initialCoreQuiz.similar_answers : [],
        }
      : defaultCoreQuiz()
  );
  const [readQuizzes, setReadQuizzes] = useState<ReadQuizItem[]>(() => {
    if (initialReadQuizzes && initialReadQuizzes.length > 0) {
      return initialReadQuizzes.slice(0, 5).map((q) => {
        const options = Array.isArray(q.options) && q.options.length >= 2
          ? q.options.map((o) => String(o ?? ""))
          : ["", ""];
        const correct_answer =
          typeof q.correct_answer === "number" && q.correct_answer >= 0
            ? Math.min(q.correct_answer, options.length - 1)
            : 0;
        return { question: q.question ?? "", options, correct_answer };
      });
    }
    return [defaultReadQuiz()];
  });
  const [summaryQuiz, setSummaryQuiz] = useState<SummaryQuizItem[]>(() => {
    if (initialSummaryQuiz && initialSummaryQuiz.length > 0) {
      return initialSummaryQuiz.slice(0, 5).map((s) => ({
        question: s.question ?? "",
        model_answer: s.model_answer ?? "",
      }));
    }
    return [defaultSummaryItem()];
  });
  const [accordionOpen, setAccordionOpen] = useState<"core" | "read" | "summary" | null>("core");

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((c) => c !== field) : [...prev, field]
    );
  };

  const addVocabularyRow = () => setVocabulary((prev) => [...prev, emptyVocab()]);
  const removeVocabularyRow = (index: number) =>
    setVocabulary((prev) => (prev.length <= 1 ? [emptyVocab()] : prev.filter((_, i) => i !== index)));
  const updateVocabularyRow = (index: number, field: keyof VocabularyItem, value: string) =>
    setVocabulary((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const addReadQuiz = () => setReadQuizzes((prev) => (prev.length < 5 ? [...prev, defaultReadQuiz()] : prev));
  const removeReadQuiz = (index: number) =>
    setReadQuizzes((prev) => (prev.length <= 1 ? [defaultReadQuiz()] : prev.filter((_, i) => i !== index)));
  const updateReadQuiz = (index: number, field: keyof ReadQuizItem, value: string | number | string[]) =>
    setReadQuizzes((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const addSummaryItem = () => setSummaryQuiz((prev) => (prev.length < 5 ? [...prev, defaultSummaryItem()] : prev));
  const removeSummaryItem = (index: number) =>
    setSummaryQuiz((prev) => (prev.length <= 1 ? [defaultSummaryItem()] : prev.filter((_, i) => i !== index)));
  const updateSummaryItem = (index: number, field: keyof SummaryQuizItem, value: string) =>
    setSummaryQuiz((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const addSimilarAnswer = () => setCoreQuiz((prev) => ({ ...prev, similar_answers: [...prev.similar_answers, ""] }));
  const removeSimilarAnswer = (i: number) =>
    setCoreQuiz((prev) => ({ ...prev, similar_answers: prev.similar_answers.filter((_, idx) => idx !== i) }));
  const updateSimilarAnswer = (i: number, v: string) =>
    setCoreQuiz((prev) => ({
      ...prev,
      similar_answers: prev.similar_answers.map((s, idx) => (idx === i ? v : s)),
    }));

  const vocabularyToSave = vocabulary
    .map((v) => ({ word: v.word.trim(), meaning: v.meaning.trim(), example: v.example.trim() }))
    .filter((v) => v.word || v.meaning || v.example);

  const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_IMAGE_SIZE_MB = 5;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("이미지 파일만 업로드할 수 있습니다. (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`이미지 크기는 ${MAX_IMAGE_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }
    setError(null);
    setThumbnailFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearThumbnail = () => {
    setThumbnailFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setThumbnailUrl(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const bucket = getThumbnailsBucket();

    try {
      let finalThumbnailUrl: string | null = thumbnailUrl ?? null;

      if (thumbnailFile) {
        const ext = thumbnailFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
        const path = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, thumbnailFile, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadError) {
          setError("섬네일 업로드 실패: " + uploadError.message);
          setLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        finalThumbnailUrl = urlData.publicUrl;
      }

      let sectionValue: string | null = null;
      let badgesValue: string[] | null = null;
      if (type === "category" || type === "digital" || type === "short" || type === "long") {
        badgesValue = [...selectedFields, difficulty].filter(Boolean);
        if (type === "category" && selectedFields.length > 0) {
          const firstLegacy = selectedFields.find((f) => SECTION_LEGACY.includes(f));
          if (firstLegacy) sectionValue = firstLegacy;
        }
      }

      const hasCoreQuiz =
        coreQuiz.problem_sentence.trim() ||
        coreQuiz.correct_answer.trim() ||
        coreQuiz.wrong_answers.some((w) => w.trim()) ||
        coreQuiz.similar_answers.some((s) => s.trim());
      const coreQuizPayload = hasCoreQuiz
        ? {
            problem_sentence: coreQuiz.problem_sentence.trim(),
            correct_answer: coreQuiz.correct_answer.trim(),
            wrong_answers: [coreQuiz.wrong_answers[0]?.trim() ?? "", coreQuiz.wrong_answers[1]?.trim() ?? ""],
            similar_answers: coreQuiz.similar_answers.map((s) => s.trim()).filter(Boolean),
          }
        : null;

      const readQuizzesPayload = readQuizzes
        .filter((q) => q.question.trim() || q.options.some((o) => o.trim()))
        .slice(0, 5)
        .map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correct_answer: q.correct_answer,
        }));
      const summaryQuizPayload = summaryQuiz
        .filter((s) => s.question.trim() || s.model_answer.trim())
        .slice(0, 5)
        .map((s) => ({ question: s.question.trim(), model_answer: s.model_answer.trim() }));

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        thumbnail_url: finalThumbnailUrl ?? "",
        type,
        content: content.trim() || null,
        vocabulary: vocabularyToSave.length > 0 ? vocabularyToSave : null,
        section: sectionValue,
        badges: badgesValue,
        core_quiz: coreQuizPayload,
        read_quizzes: readQuizzesPayload.length > 0 ? readQuizzesPayload : null,
        summary_quiz: summaryQuizPayload.length > 0 ? summaryQuizPayload : null,
        updated_at: new Date().toISOString(),
      };

      // 확인용: Supabase에 전송되는 payload 로그
      console.log("[ContentForm] Supabase payload (저장 시 전송 데이터):", JSON.stringify(payload, null, 2));

      if (id) {
        const { error: updateError } = await supabase.from("contents").update(payload).eq("id", id);
        if (updateError) throw updateError;
        router.push("/dashboard/contents");
      } else {
        const slug =
          title
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 80) || "content";
        const uniqueId = `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { error: insertError } = await supabase.from("contents").insert({
          id: uniqueId,
          ...payload,
          created_at: new Date().toISOString(),
        });
        if (insertError) throw insertError;
        router.push("/dashboard/contents");
      }
      router.refresh();
    } catch (err: unknown) {
      const anyErr = err as { message?: string };
      const msg = typeof anyErr?.message === "string" ? anyErr.message : "";
      if (msg.includes("core_quiz") || msg.includes("read_quizzes") || msg.includes("summary_quiz") || msg.includes("schema cache")) {
        setError(
          "contents 테이블에 퀴즈 컬럼이 없습니다. Supabase 대시보드 → SQL Editor에서 아래를 실행한 뒤 다시 저장해 주세요.\n\n" +
            "ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS core_quiz jsonb;\n" +
            "ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS read_quizzes jsonb;\n" +
            "ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS summary_quiz jsonb;"
        );
      } else {
        setError(msg || "저장에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-[#212529] mb-1.5">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition"
            placeholder="콘텐츠 제목"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-[#212529] mb-1.5">설명</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition resize-none"
            placeholder="간단한 설명 (선택)"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#212529] mb-1.5">유형 (TTO-DOCK2 노출 위치)</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] outline-none transition"
          >
            <option value="reading">읽기(기본)</option>
            <option value="short">짧은 글</option>
            <option value="long">긴 글</option>
            <option value="category">분야별(과학/역사/사회)</option>
            <option value="digital">디지털 문해력</option>
          </select>
        </div>

        {(type === "category" || type === "digital" || type === "short" || type === "long") && (
          <div className="rounded-xl border-2 border-orange-100 bg-orange-50/50 p-4 space-y-4">
            <p className="text-sm font-semibold text-[#212529]">칩 구분</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">분야 (복수 선택)</label>
              <div className="flex flex-wrap gap-2">
                {FIELD_OPTIONS.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleField(field)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      selectedFields.includes(field)
                        ? "bg-[#ff5700] text-white"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#ff5700]/50"
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">난이도 (1개만 선택)</label>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      difficulty === d
                        ? "bg-[#ff5700] text-white"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#ff5700]/50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              카드에 분야·난이도 칩으로 노출됩니다. {selectedFields.length > 0 && `분야: ${selectedFields.join(", ")}`} / 난이도: {difficulty}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-[#212529] mb-1.5">본문 (TTO-DOCK2 읽기 화면에 표시)</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition resize-y min-h-[200px]"
            placeholder="읽기 본문 텍스트를 입력하세요. 줄바꿈은 그대로 반영됩니다."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#212529] mb-1.5">단어 설명 (읽기 화면에서 단어 클릭 시 툴팁으로 표시)</label>
          <p className="text-xs text-gray-500 mb-2">단어, 뜻, 예문을 입력하면 TTO-DOCK2 읽기 화면에서 해당 단어에 마우스를 올렸을 때 설명이 표시됩니다.</p>
          <div className="space-y-3">
            {vocabulary.map((row, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                <input
                  type="text"
                  value={row.word}
                  onChange={(e) => updateVocabularyRow(index, "word", e.target.value)}
                  placeholder="단어"
                  className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                />
                <input
                  type="text"
                  value={row.meaning}
                  onChange={(e) => updateVocabularyRow(index, "meaning", e.target.value)}
                  placeholder="뜻"
                  className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                />
                <input
                  type="text"
                  value={row.example}
                  onChange={(e) => updateVocabularyRow(index, "example", e.target.value)}
                  placeholder="예문"
                  className="flex-[2] min-w-0 h-10 px-3 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeVocabularyRow(index)}
                  className="shrink-0 h-10 px-3 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 border border-gray-200 text-sm font-medium"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addVocabularyRow}
              className="w-full sm:w-auto h-10 px-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 hover:border-[#ff5700] hover:text-[#ff5700] text-sm font-medium transition"
            >
              + 단어 설명 추가
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#212529] mb-1.5">섬네일</label>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-48 aspect-video rounded-xl border-2 border-gray-200 bg-gray-50 overflow-hidden relative shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <ThumbnailImage src={thumbnailUrl} alt="" fill className="object-cover" />
              )}
              {(previewUrl || thumbnailUrl) && (
                <button
                  type="button"
                  onClick={handleClearThumbnail}
                  className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white text-xs font-bold hover:bg-black/80"
                  aria-label="섬네일 삭제"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-[#ff5700] file:text-white file:cursor-pointer hover:file:opacity-90"
              />
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP, GIF (최대 {MAX_IMAGE_SIZE_MB}MB). Supabase Storage thumbnails 버킷에 업로드 후 Public URL이 thumbnail_url에 저장됩니다.
              </p>
              <p className="text-xs text-gray-400">
                섬네일을 제거하려면 우측 상단 <span className="font-semibold">×</span> 버튼을 눌러 삭제할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-hidden">
        <p className="p-4 text-sm font-semibold text-[#212529] border-b border-gray-100">퀴즈 등록</p>
        <div className="divide-y divide-gray-100">
          <div>
            <button
              type="button"
              onClick={() => setAccordionOpen((o) => (o === "core" ? null : "core"))}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-orange-50/50 transition"
            >
              <span>단어 퀴즈 (core_quiz)</span>
              <span className="text-gray-400">{accordionOpen === "core" ? "▲" : "▼"}</span>
            </button>
            {accordionOpen === "core" && (
              <div className="px-4 pb-4 pt-0 space-y-3 bg-gray-50/50">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">문제 문장</label>
                  <input
                    type="text"
                    value={coreQuiz.problem_sentence}
                    onChange={(e) => setCoreQuiz((p) => ({ ...p, problem_sentence: e.target.value }))}
                    placeholder="빈칸에 들어갈 단어를 고르는 문장"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">정답 단어</label>
                  <input
                    type="text"
                    value={coreQuiz.correct_answer}
                    onChange={(e) => setCoreQuiz((p) => ({ ...p, correct_answer: e.target.value }))}
                    placeholder="정답"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">오답 2개</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coreQuiz.wrong_answers[0]}
                      onChange={(e) => setCoreQuiz((p) => ({ ...p, wrong_answers: [e.target.value, p.wrong_answers[1]] }))}
                      placeholder="오답 1"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={coreQuiz.wrong_answers[1]}
                      onChange={(e) => setCoreQuiz((p) => ({ ...p, wrong_answers: [p.wrong_answers[0], e.target.value] }))}
                      placeholder="오답 2"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">유사 정답 (선택)</label>
                  <div className="space-y-2">
                    {coreQuiz.similar_answers.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={s}
                          onChange={(e) => updateSimilarAnswer(i, e.target.value)}
                          placeholder="유사 정답"
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                        />
                        <button type="button" onClick={() => removeSimilarAnswer(i)} className="shrink-0 px-2 text-gray-500 hover:text-red-600 text-sm">
                          삭제
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addSimilarAnswer} className="text-sm text-[#ff5700] font-medium hover:underline">
                      + 유사 정답 추가
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setAccordionOpen((o) => (o === "read" ? null : "read"))}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-orange-50/50 transition"
            >
              <span>독해 퀴즈 (read_quizzes) · 최대 5개</span>
              <span className="text-gray-400">{accordionOpen === "read" ? "▲" : "▼"}</span>
            </button>
            {accordionOpen === "read" && (
              <div className="px-4 pb-4 pt-0 space-y-4 bg-gray-50/50">
                {readQuizzes.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500">문항 {idx + 1}</span>
                      {readQuizzes.length > 1 && (
                        <button type="button" onClick={() => removeReadQuiz(idx)} className="text-xs text-red-600 hover:underline">
                          삭제
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateReadQuiz(idx, "question", e.target.value)}
                      placeholder="문제"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                    />
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`read-correct-${idx}`}
                          checked={q.correct_answer === oi}
                          onChange={() => updateReadQuiz(idx, "correct_answer", oi)}
                          className="text-[#ff5700]"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...q.options];
                            next[oi] = e.target.value;
                            updateReadQuiz(idx, "options", next);
                          }}
                          placeholder={`보기 ${oi + 1}`}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ))}
                {readQuizzes.length < 5 && (
                  <button type="button" onClick={addReadQuiz} className="text-sm text-[#ff5700] font-medium hover:underline">
                    + 독해 문항 추가
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setAccordionOpen((o) => (o === "summary" ? null : "summary"))}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-orange-50/50 transition"
            >
              <span>요약 퀴즈 (summary_quiz) · 최대 5개</span>
              <span className="text-gray-400">{accordionOpen === "summary" ? "▲" : "▼"}</span>
            </button>
            {accordionOpen === "summary" && (
              <div className="px-4 pb-4 pt-0 space-y-4 bg-gray-50/50">
                {summaryQuiz.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500">문항 {idx + 1}</span>
                      {summaryQuiz.length > 1 && (
                        <button type="button" onClick={() => removeSummaryItem(idx)} className="text-xs text-red-600 hover:underline">
                          삭제
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={s.question}
                      onChange={(e) => updateSummaryItem(idx, "question", e.target.value)}
                      placeholder="문제"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm"
                    />
                    <textarea
                      value={s.model_answer}
                      onChange={(e) => updateSummaryItem(idx, "model_answer", e.target.value)}
                      placeholder="모범 답안"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#ff5700] outline-none text-sm resize-none"
                    />
                  </div>
                ))}
                {summaryQuiz.length < 5 && (
                  <button type="button" onClick={addSummaryItem} className="text-sm text-[#ff5700] font-medium hover:underline">
                    + 요약 문항 추가
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="h-12 px-6 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#ff5700" }}
        >
          {loading ? "저장 중…" : id ? "수정하기" : "등록하기"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-12 px-6 rounded-xl font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition"
        >
          취소
        </button>
      </div>
    </form>
  );
}
