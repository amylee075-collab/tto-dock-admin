"use server";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export type CoreWordQuizRow = {
  sentence: string;
  correct_answer: string;
  selectable_words: string[];
  feedback_by_word: Record<string, string>;
  sort_order: number | null;
};

export async function insertCoreWordQuizBulk(rows: CoreWordQuizRow[]) {
  const supabase = await createClient();
  const valid = rows
    .map((r) => ({
      sentence: String(r.sentence ?? "").trim(),
      correct_answer: String(r.correct_answer ?? "").trim(),
      selectable_words: Array.isArray(r.selectable_words) ? r.selectable_words : [],
      feedback_by_word: r.feedback_by_word && typeof r.feedback_by_word === "object" ? r.feedback_by_word : {},
      sort_order: r.sort_order ?? null,
    }))
    .filter((r) => r.sentence.length > 0 && r.correct_answer.length > 0);
  if (valid.length === 0) return { ok: false, message: "등록할 유효한 문항이 없습니다.", count: 0 };
  const withId = valid.map((r) => ({ ...r, id: randomUUID() }));
  const { error } = await supabase.from("core_word_quiz").insert(withId);
  if (error) return { ok: false, message: error.message, count: 0 };
  return { ok: true, message: `${valid.length}건 등록되었습니다.`, count: valid.length };
}
