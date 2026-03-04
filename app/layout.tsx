import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "또독 관리자",
  description: "TTO-DOCK 관리자 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased bg-white text-[#212529] font-sans">
        {children}
      </body>
    </html>
  );
}
