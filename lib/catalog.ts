import { getCases, getProviders } from "@/lib/data";

export type ServiceCategory = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  tags: string[];
  caseCategories: string[];
  outcomes: string[];
};

export type IndustryCategory = {
  slug: string;
  title: string;
  description: string;
  painPoints: string[];
};

export const serviceCategories: ServiceCategory[] = [
  {
    slug: "ai-automation",
    title: "AI 自动化与 Agent",
    shortTitle: "自动化 Agent",
    description: "适合想把客服、内部流程、资料检索和运营动作接入 AI 的企业。",
    tags: ["客服 Agent", "自动化流程", "企业知识库", "RAG 架构", "办公提效"],
    caseCategories: ["企业 AI", "自动化流程"],
    outcomes: ["减少重复沟通", "形成可验收流程", "沉淀企业知识资产"]
  },
  {
    slug: "ecommerce-visuals",
    title: "电商视觉与商品图",
    shortTitle: "电商视觉",
    description: "适合高频上新、素材成本高、需要多平台图片和短视频素材的团队。",
    tags: ["商品图自动化", "短视频工作流", "数字人", "商品图", "短视频"],
    caseCategories: ["电商视觉"],
    outcomes: ["降低素材制作成本", "缩短上新周期", "统一品牌视觉风格"]
  },
  {
    slug: "content-pipeline",
    title: "AI 内容生产流程",
    shortTitle: "内容生产",
    description: "适合需要稳定生产图文、选题、营销素材和品牌知识库的内容团队。",
    tags: ["选题策划", "图文内容", "品牌知识库", "内容创作"],
    caseCategories: ["内容创作"],
    outcomes: ["提升内容产能", "统一品牌表达", "降低编辑返工"]
  },
  {
    slug: "private-knowledge",
    title: "私有知识库与 RAG",
    shortTitle: "私有知识库",
    description: "适合资料多、权限复杂、需要溯源问答和内部知识复用的专业服务团队。",
    tags: ["企业知识库", "私有数据微调", "RAG 架构", "品牌知识库"],
    caseCategories: ["企业 AI"],
    outcomes: ["提升检索效率", "保留文档溯源", "减少新人培训成本"]
  }
];

export const industryCategories: IndustryCategory[] = [
  {
    slug: "ecommerce",
    title: "电商与跨境电商",
    description: "围绕商品图、上新素材、客服问答和投放内容，优先关注成本、周期和素材一致性。",
    painPoints: ["高频上新素材压力", "外拍和设计成本高", "多平台规格适配复杂"]
  },
  {
    slug: "education-consulting",
    title: "教育与咨询",
    description: "围绕知识库、培训、资料检索和交付模板，重点解决知识资产难复用的问题。",
    painPoints: ["资料分散", "新人培训周期长", "专家经验难沉淀"]
  },
  {
    slug: "local-life-content",
    title: "本地生活与内容品牌",
    description: "围绕图文生产、选题排期、门店素材和私域内容，让 AI 进入真实运营节奏。",
    painPoints: ["内容风格不稳定", "热点跟进慢", "门店素材难复用"]
  },
  {
    slug: "professional-services",
    title: "制造、法律与财税",
    description: "围绕私有数据、权限、流程自动化和内部工具 PoC，优先控制边界和合规风险。",
    painPoints: ["数据权限敏感", "流程依赖人工", "系统边界难定义"]
  }
];

const industryAliases: Record<string, string[]> = {
  ecommerce: ["电商", "跨境电商", "MCN", "广告"],
  "education-consulting": ["教育", "咨询"],
  "local-life-content": ["本地生活", "文旅", "广告"],
  "professional-services": ["制造", "法律", "财税"]
};

export function getServiceCategory(slug: string) {
  return serviceCategories.find((category) => category.slug === slug);
}

export function getIndustryCategory(slug: string) {
  return industryCategories.find((category) => category.slug === slug);
}

export function getProvidersForService(category: ServiceCategory) {
  return getProviders().filter((provider) => provider.tags.some((tag) => category.tags.includes(tag)));
}

export function getCasesForService(category: ServiceCategory) {
  return getCases().filter((caseStudy) => category.caseCategories.includes(caseStudy.category));
}

export function getProvidersForIndustry(category: IndustryCategory) {
  const aliases = industryAliases[category.slug] || [category.title];
  return getProviders().filter((provider) => provider.industry.some((item) => aliases.includes(item)));
}

export function getCasesForIndustry(category: IndustryCategory) {
  const aliases = industryAliases[category.slug] || [category.title];
  return getCases().filter((caseStudy) => caseStudy.industry.some((item) => aliases.includes(item)));
}
