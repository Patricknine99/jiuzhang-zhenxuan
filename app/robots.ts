import type { MetadataRoute } from "next";

const baseUrl = "https://jiuzhang-zhenxuan.example.com";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
