"use client";

import { useState } from "react";
import { DownloadIcon, FileTypeBadge } from "@/components/icons";

export function FileViewer({
  fileId,
  previewable,
  hasFile,
  mime,
  fileName,
}: {
  fileId: string;
  previewable: boolean;
  hasFile: boolean;
  mime: string | null;
  fileName: string | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // 서버 프록시 인라인 URL (Notion URL 직접 노출 없이 스트리밍)
  const src = `/api/files/${fileId}/download?inline=1`;
  const isImage = !!mime?.startsWith("image/");

  if (!hasFile) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        첨부된 파일이 없습니다.
      </div>
    );
  }

  return (
    <div>
      {previewable ? (
        <div className="relative mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {!loaded && !error && (
            <div className="skeleton absolute inset-0 h-full w-full rounded-none" />
          )}
          {error ? (
            <div className="flex h-80 items-center justify-center text-sm text-red-500">
              미리보기를 불러오지 못했습니다.
            </div>
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={fileName ?? "preview"}
              className="mx-auto max-h-[70vh] w-auto"
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
            />
          ) : (
            <iframe
              src={src}
              title={fileName ?? "preview"}
              className="h-[70vh] w-full"
              onLoad={() => setLoaded(true)}
            />
          )}
        </div>
      ) : (
        <div className="mb-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <FileTypeBadge mime={mime} fileName={fileName} size="lg" />
          <div>
            <p className="text-sm font-medium text-slate-600">사이트에서 미리볼 수 없는 형식이에요</p>
            <p className="text-xs text-slate-400">다운로드해서 확인하세요.</p>
          </div>
        </div>
      )}

      <a className="btn-primary w-full" href={`/api/files/${fileId}/download`}>
        <DownloadIcon width={18} height={18} /> 원본 다운로드
      </a>
    </div>
  );
}
