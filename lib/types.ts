/** 글 읽기 단어 설명 1개 (TTO-DOCK2 vocabulary 툴팁용) */
export type ContentVocabularyItem = {
  word: string;
  meaning: string;
  example: string;
};

/** 단어 퀴즈 1개 (contents.core_quiz) */
export type CoreQuiz = {
  problem_sentence: string;
  correct_answer: string;
  wrong_answers: [string, string];
  similar_answers: string[];
} | null;

/** 독해 퀴즈 1문항 (문제, 보기 4개, 정답 인덱스) */
export type ReadQuizItem = {
  question: string;
  options: [string, string, string, string];
  correct_answer: number;
};

/** 요약 퀴즈 1문항 */
export type SummaryQuizItem = {
  question: string;
  model_answer: string;
};

/** TTO-DOCK2 읽기와 연동: type이 short | category | digital 이면 해당 목록에서 노출 */
export type Content = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  type: string;
  /** 본문 텍스트 (TTO-DOCK2 읽기 화면에 표시) */
  content: string | null;
  /** 단어 설명 목록 (읽기 화면에서 단어 클릭 시 툴팁 등으로 표시) */
  vocabulary: ContentVocabularyItem[] | null;
  /** 분야별 글: 과학 | 역사 | 사회 (카드 분류·칩용) */
  section: string | null;
  /** 카드 칩 라벨 */
  badges: string[] | null;
  /** 단어 퀴즈 (문제 문장, 정답 단어, 오답 2개, 유사 정답 배열) */
  core_quiz?: CoreQuiz;
  /** 독해 퀴즈 (문제·보기 4개·정답 세트 최대 5개) */
  read_quizzes?: ReadQuizItem[] | null;
  /** 요약 퀴즈 (문제·모범답안 세트 최대 5개) */
  summary_quiz?: SummaryQuizItem[] | null;
  created_at: string;
  updated_at: string;
};

export type LearnerStats = {
  id: string;
  name: string;
  email: string;
  total_reading_count: number;
  total_reading_minutes: number;
  last_activity_at: string | null;
};

export type DailyActivity = {
  date: string;
  count: number;
  minutes: number;
};

/** 오늘의 단어 (TTO-DOCK2 HeroWordQuiz 연동) */
export type TodayWord = {
  id: string;
  word: string;
  meaning: string;
  example: string;
  type: "순우리말" | "한자어" | "외래어";
  created_at?: string;
};

/** 문해력 기초 훈련 - 핵심 단어 찾기 퀴즈 (TTO-DOCK2 CoreWordPractice 연동) */
export type CoreWordQuizItem = {
  id: string;
  sentence: string;
  correct_answer: string;
  selectable_words: string[];
  feedback_by_word: Record<string, string>;
  sort_order?: number;
  created_at?: string;
};
