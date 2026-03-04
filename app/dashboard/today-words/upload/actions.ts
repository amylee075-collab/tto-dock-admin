"use server";

import { createClient } from "@/lib/supabase/server";

const TYPES = ["순우리말", "한자어", "외래어"] as const;

export type TodayWordRow = {
  word: string;
  meaning: string;
  example: string;
  type: string;
};

export async function insertTodayWordsBulk(rows: TodayWordRow[]) {
  const supabase = await createClient();
  const valid = rows
    .map((r) => ({
      word: String(r.word ?? "").trim(),
      meaning: String(r.meaning ?? "").trim(),
      example: String(r.example ?? "").trim(),
      type: TYPES.includes(r.type?.trim() as (typeof TYPES)[number]) ? r.type.trim() : "순우리말",
    }))
    .filter((r) => r.word.length > 0 && r.meaning.length > 0);
  if (valid.length === 0) return { ok: false, message: "등록할 유효한 행이 없습니다.", count: 0 };
  const { error } = await supabase.from("today_words").insert(valid);
  if (error) return { ok: false, message: error.message, count: 0 };
  return { ok: true, message: `${valid.length}건 등록되었습니다.`, count: valid.length };
}
