import cases from "../data/cases.json" with { type: "json" };
import providers from "../data/providers.json" with { type: "json" };

const errors = [];
const providerSlugs = new Set();

for (const provider of providers) {
  if (providerSlugs.has(provider.slug)) errors.push(`Duplicate provider slug: ${provider.slug}`);
  providerSlugs.add(provider.slug);
  for (const key of ["slug", "name", "level", "description"]) {
    if (!provider[key]) errors.push(`Provider ${provider.slug || provider.name} missing ${key}`);
  }
  if (!["L1", "L2", "L3"].includes(provider.level)) errors.push(`Provider ${provider.slug} invalid level ${provider.level}`);
  if (typeof provider.rating !== "number" || provider.rating < 0 || provider.rating > 5) {
    errors.push(`Provider ${provider.slug} invalid rating`);
  }
}

const caseSlugs = new Set();
for (const caseStudy of cases) {
  if (caseSlugs.has(caseStudy.slug)) errors.push(`Duplicate case slug: ${caseStudy.slug}`);
  caseSlugs.add(caseStudy.slug);
  for (const key of ["slug", "title", "providerSlug", "problem", "solution"]) {
    if (!caseStudy[key]) errors.push(`Case ${caseStudy.slug || caseStudy.title} missing ${key}`);
  }
  if (!providerSlugs.has(caseStudy.providerSlug)) {
    errors.push(`Case ${caseStudy.slug} references missing provider ${caseStudy.providerSlug}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Data integrity ok: ${providers.length} providers, ${cases.length} cases.`);
