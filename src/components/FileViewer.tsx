"use client";

import { useEffect, useState } from "react";

/**
 * 권한 검증 signed URL 로 미리보기/다운로드.
 *   - PDF: <iframe>, 이미지: <img> 로 인라인 미리보기
 *   - 그 외 형식(한글/워드 등)은 다운로드만 제공
 */
export function FileViewer({
  fileId,
  previewable,
  mime,
  fileName,
}: {
  fileId: string;
  previewable: boolean;
  mime: string | null;
  fileName: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(previewable);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!previewable) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/files/${fileId}/signed-url`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "failed");
        if (active) setPreviewUrl(json.url);
      } catch {
        if (active) setError("미리보기를 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fileId, previewable]);

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/files/${fileId}/signed-url?download=1`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "failed");
      // signed URL 로 이동시켜 다운로드 트리거
      const a = document.createElement("a");
      a.href = json.url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert("다운로드 링크 발급에 실패했습니다.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      {previewable ? (
        <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {loading && (
            <div className="flex h-80 items-center justify-center text-sm text-slate-400">
              미리보기 불러오는 중…
            </div>
          )}
          {error && (
            <div className="flex h-80 items-center justify-center text-sm text-red-500">
              {error}
            </div>
          )}
          {previewUrl && !error && (
            mime?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={fileName} className="mx-auto max-h-[70vh] w-auto" />
            ) : (
              <iframe src={previewUrl} title={fileName} className="h-[70vh] w-full" />
            )
          )}
        </div>
      ) : (
        <div className="mb-4 flex h-40 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          <span>이 형식은 사이트에서 미리볼 수 없습니다.</span>
          <span className="text-xs text-slate-400">다운로드해서 확인하세요.</span>
        </div>
      )}

      <button className="btn-primary w-full" onClick={download} disabled={downloading}>
        {downloading ? "링크 생성 중…" : "원본 다운로드"}
      </button>
    </div>
  );
}
