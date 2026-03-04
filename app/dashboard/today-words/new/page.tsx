import TodayWordForm from "@/components/today-words/TodayWordForm";

export default function NewTodayWordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">오늘의 단어 추가</h1>
        <p className="mt-1 text-gray-600">단어, 유형, 뜻, 예문을 입력하세요.</p>
      </div>
      <TodayWordForm />
    </div>
  );
}
