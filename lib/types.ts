/** 글 읽기 단어 설명 1개 (TTO-DOCK2 vocabulary 툴팁용) */
export type ContentVocabularyItem = {
  word: string;
  meaning: string;
  example: string;
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
  /** 카드 칩 라벨: 분야별 [과학|역사|사회, 쉬움|어려움], 디지털 [디지털, 신문기사, 미디어 비판, 쉬움, 어려움] 등 */
  badges: string[] | null;
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
