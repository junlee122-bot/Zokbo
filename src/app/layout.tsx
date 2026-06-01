import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zokbo — 시험지 자료 보관소",
  description: "개인 시험지·학습자료 아카이브",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
