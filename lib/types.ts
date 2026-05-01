export type ProviderLevel = "L1" | "L2" | "L3";

export type Provider = {
  slug: string;
  name: string;
  level: ProviderLevel;
  levelLabel: string;
  tags: string[];
  industry: string[];
  deliveryMin: number;
  deliveryMax: number;
  budgetMin: number;
  budgetMax: number;
  rating: number;
  caseCount: number;
  avatarUrl: string;
  description: string;
  techStack: string[];
  canInvoice: boolean;
  featured: boolean;
  sortOrder: number;
  responseTime: string;
  services: string[];
  reviews: string[];
};

export type CaseStudy = {
  slug: string;
  title: string;
  providerSlug: string;
  providerName: string;
  category: string;
  industry: string[];
  background: string;
  problem: string;
  solution: string;
  process: string;
  roiText: string;
  budgetText: string;
  aiLabel: string;
  featured: boolean;
  sortOrder: number;
};
