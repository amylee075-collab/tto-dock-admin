import ContentForm from "@/components/contents/ContentForm";

export default function NewContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">새 콘텐츠</h1>
        <p className="mt-1 text-gray-600">제목, 설명, 섬네일을 입력하세요.</p>
      </div>
      <ContentForm />
    </div>
  );
}
