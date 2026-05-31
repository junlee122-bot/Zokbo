import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zokbo — 시험지 자료 보관소",
  description: "초대 기반 비공개 시험지·학습자료 아카이브",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
