import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Newscrap | 오늘의 신문, 더 넓은 시선으로",
  description: "오늘의 지면 뉴스를 읽고 나만의 스크랩북에 모아보세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
