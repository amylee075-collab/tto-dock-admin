import CoreWordQuizUploadForm from "./CoreWordQuizUploadForm";

export default function CoreWordQuizUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">문해력 기초 퀴즈 CSV 일괄 업로드</h1>
        <p className="mt-1 text-gray-600">CSV 파일을 올리면 여러 문항을 한 번에 등록할 수 있습니다.</p>
      </div>
      <CoreWordQuizUploadForm />
    </div>
  );
}
