import type { MetadataRoute } from "next";
import { getCases, getProviders } from "@/lib/data";
import { industryCategories, serviceCategories } from "@/lib/catalog";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jiuzhang-zhenxuan.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/buyers",
    "/creators",
    "/providers",
    "/cases",
    "/services",
    "/industries",
    "/diagnosis",
    "/login",
    "/register",
    "/account",
    "/status",
    "/post-demand",
    "/join",
    "/sla",
    "/terms",
    "/privacy",
    "/provider-agreement"
  ];

  return [
    ...staticRoutes.map((route) => entry(route, "weekly")),
    ...getProviders().map((provider) => entry(`/providers/${provider.slug}`, "weekly")),
    ...getCases().map((caseStudy) => entry(`/cases/${caseStudy.slug}`, "weekly")),
    ...serviceCategories.map((category) => entry(`/services/${category.slug}`, "weekly")),
    ...industryCategories.map((category) => entry(`/industries/${category.slug}`, "weekly")),
    ...serviceCategories.flatMap((service) =>
      industryCategories.map((industry) => entry(`/solutions/${service.slug}/${industry.slug}`, "weekly"))
    )
  ];
}

function entry(path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) {
  return {
    url: `${baseUrl}${path}`,
    lastModified: new Date("2026-05-01"),
    changeFrequency,
    priority: path === "" ? 1 : 0.7
  };
}
