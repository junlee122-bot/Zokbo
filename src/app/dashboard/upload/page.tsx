import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { FileUploader } from "@/components/FileUploader";

export default async function UploadPage() {
  const profile = await requireProfile();

  // 열람자는 업로드 불가
  if (profile.role === "viewer") redirect("/dashboard?error=forbidden");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">파일 업로드</h1>
      <p className="mb-6 text-sm text-slate-500">
        시험지·학습자료(PDF·이미지·한글/워드 등)를 올리고 분류 정보를 입력하세요.
        기본값은 <b>비공개</b>이며, 업로드 후 상세 화면에서 공유로 전환할 수 있습니다.
      </p>
      <FileUploader userId={profile.id} />
    </div>
  );
}
