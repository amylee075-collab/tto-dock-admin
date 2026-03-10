-- contents 테이블에 퀴즈 컬럼 추가 (콘텐츠 수정 페이지 퀴즈 등록 기능용)
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS core_quiz jsonb;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS read_quizzes jsonb;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS summary_quiz jsonb;

-- core_quiz: { problem_sentence, correct_answer, wrong_answers: [string, string], similar_answers: string[] }
-- read_quizzes: [ { question, options: [string, string, string, string], correct_answer: 0..3 } ] (최대 5개)
-- summary_quiz: [ { question, model_answer } ] (최대 5개)
