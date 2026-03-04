"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getThumbnailsBucket } from "@/lib/supabase/storage";
import ThumbnailImage from "@/components/contents/ThumbnailImage";

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

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        thumbnail_url: finalThumbnailUrl,
        type,
        content: content.trim() || null,
        vocabulary: vocabularyToSave.length > 0 ? vocabularyToSave : null,
        section: sectionValue,
        badges: badgesValue,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { error: updateError } = await supabase.from("contents").update(payload).eq("id", id);
        if (updateError) throw updateError;
        router.push("/dashboard/contents");
      } else {
        const { error: insertError } = await supabase.from("contents").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });
        if (insertError) throw insertError;
        router.push("/dashboard/contents");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
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
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-[#ff5700] file:text-white file:cursor-pointer hover:file:opacity-90"
              />
              <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, GIF (최대 {MAX_IMAGE_SIZE_MB}MB). Supabase Storage thumbnails 버킷에 업로드 후 Public URL이 thumbnail_url에 저장됩니다.</p>
            </div>
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
