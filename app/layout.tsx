import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer } from "@/components/shared/Footer";
import { Navbar } from "@/components/shared/Navbar";
import { FloatingSupport } from "@/components/support/FloatingSupport";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jiuzhang-zhenxuan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "九章甄选 — AI 商业服务的严选平台",
    template: "%s | 九章甄选"
  },
  description:
    "九章甄选帮助企业发现、评估并对接经过真实商业验证的 AI 创作者与独立工作室，提供服务商筛选、案例参考、需求诊断与标准验收。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "九章甄选"
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false
  },
  openGraph: {
    title: "九章甄选 — AI 商业服务的严选平台",
    description:
      "发现、评估并对接经过商业验证的 AI 服务商，让企业知道找谁、花多少、怎么验收。",
    images: ["/og-image.svg"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafaf9"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <FloatingSupport />
      </body>
    </html>
  );
}
