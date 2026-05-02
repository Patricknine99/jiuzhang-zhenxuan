import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jiuzhang-zhenxuan.com";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/"
      },
      {
        userAgent: "*",
        disallow: ["/status", "/login", "/register", "/account"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
