import Link from "next/link";
import { FileUploader } from "@/components/FileUploader";
import { ArrowLeft } from "@/components/icons";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800">
        <ArrowLeft width={16} height={16} /> 목록으로
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">파일 업로드</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        시험지·학습자료(PDF·이미지·한글/워드 등)를 올리고 분류 정보를 입력하세요. 파일은 Notion에 안전하게 보관됩니다.
      </p>
      <FileUploader />
    </div>
  );
}
