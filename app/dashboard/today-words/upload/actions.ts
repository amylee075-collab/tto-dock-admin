"use server";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

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

  const { data: existing } = await supabase.from("today_words").select("word");
  const existingWords = new Set((existing ?? []).map((r: { word: string }) => r.word));

  const toInsert = valid.filter((r) => !existingWords.has(r.word));
  const toUpdate = valid.filter((r) => existingWords.has(r.word));

  if (toInsert.length > 0) {
    const withId = toInsert.map((r) => ({ ...r, id: randomUUID() }));
    const { error: insertErr } = await supabase.from("today_words").insert(withId);
    if (insertErr) return { ok: false, message: insertErr.message, count: 0 };
  }

  for (const r of toUpdate) {
    const { error: updateErr } = await supabase
      .from("today_words")
      .update({ meaning: r.meaning, example: r.example, type: r.type })
      .eq("word", r.word);
    if (updateErr) return { ok: false, message: updateErr.message, count: 0 };
  }

  const inserted = toInsert.length;
  const updated = toUpdate.length;
  const parts: string[] = [];
  if (inserted > 0) parts.push(`${inserted}건 신규 등록`);
  if (updated > 0) parts.push(`${updated}건 기존 수정`);
  const message = parts.length > 0 ? parts.join(", ") + "되었습니다." : "변경된 행이 없습니다.";
  return { ok: true, message, count: inserted + updated };
}
