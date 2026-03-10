/**
 * 문해력 기초 훈련 샘플 CSV 다운로드
 * UTF-8 BOM + 올바른 Content-Type으로 한글이 깨지지 않도록 응답
 */
const UTF8_BOM = "\uFEFF";

const SAMPLE_CSV = `${UTF8_BOM}sentence,correct_answer,selectable_words,feedback_by_word,sort_order
"우리는 학교나 마을에서 여러 사람과 어울려 살아가는데, 이때 서로를 한 식구처럼 아끼고 돕는 마음가짐을 공동체 의식이라고 부릅니다.",공동체 의식,학교|마을|한 식구|공동체 의식,"{""공동체 의식"":""공동체를 한 식구처럼 생각하는 마음""}",1
"바람이나 물의 힘을 이용해 전기를 만드는 방식을 재생 에너지라고 합니다.",재생 에너지,화석 연료|원자력|재생 에너지|태양열,"{""재생 에너지"":""바람·물·태양 등으로 만드는 친환경 전기""}",2
`;

export async function GET() {
  return new Response(SAMPLE_CSV, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="core-word-quiz-sample.csv"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
