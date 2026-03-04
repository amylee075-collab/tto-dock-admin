import CoreWordQuizForm from "@/components/core-word-quiz/CoreWordQuizForm";

export default function NewCoreWordQuizPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">문해력 기초 훈련 문항 추가</h1>
        <p className="mt-1 text-gray-600">문장, 정답, 선택지, 단어별 피드백을 입력하세요.</p>
      </div>
      <CoreWordQuizForm />
    </div>
  );
}
