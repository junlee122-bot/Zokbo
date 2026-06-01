import { FileUploader } from "@/components/FileUploader";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">파일 업로드</h1>
      <p className="mb-6 text-sm text-slate-500">
        시험지·학습자료(PDF·이미지·한글/워드 등)를 올리고 분류 정보를 입력하세요.
        파일은 Notion에 안전하게 보관됩니다.
      </p>
      <FileUploader />
    </div>
  );
}
