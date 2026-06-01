"use client";

import { useEffect, useState } from "react";

export function FileViewer({
  fileId,
  previewable,
  hasFile,
}: {
  fileId: string;
  previewable: boolean;
  hasFile: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mime, setMime] = useState<string | null>(null);
  const [loading, setLoading] = useState(previewable);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewable) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/files/${fileId}/url`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "failed");
        if (active) {
          setPreviewUrl(json.url);
          setMime(json.mime);
        }
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

  if (!hasFile) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        첨부된 파일이 없습니다.
      </div>
    );
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
            <div className="flex h-80 items-center justify-center text-sm text-red-500">{error}</div>
          )}
          {previewUrl && !error && (
            mime?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="preview" className="mx-auto max-h-[70vh] w-auto" />
            ) : (
              <iframe src={previewUrl} title="preview" className="h-[70vh] w-full" />
            )
          )}
        </div>
      ) : (
        <div className="mb-4 flex h-40 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          <span>이 형식은 사이트에서 미리볼 수 없습니다.</span>
          <span className="text-xs text-slate-400">다운로드해서 확인하세요.</span>
        </div>
      )}

      <a className="btn-primary w-full" href={`/api/files/${fileId}/download`}>
        원본 다운로드
      </a>
    </div>
  );
}
