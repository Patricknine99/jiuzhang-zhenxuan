import { describe, it, expect } from "vitest";
import { getProviders, getFeaturedProviders, getProvider, getCases, getFeaturedCases, getCase, formatCurrencyRange } from "@/lib/data";

describe("data layer", () => {
  describe("getProviders", () => {
    it("returns providers sorted by level then rating", () => {
      const providers = getProviders();
      expect(providers.length).toBeGreaterThan(0);
      // L3 should come before L2
      const l3Index = providers.findIndex((p) => p.level === "L3");
      const l2Index = providers.findIndex((p) => p.level === "L2");
      if (l3Index >= 0 && l2Index >= 0) {
        expect(l3Index).toBeLessThan(l2Index);
      }
    });

    it("returns valid provider objects", () => {
      const providers = getProviders();
      for (const provider of providers) {
        expect(provider.slug).toBeTruthy();
        expect(provider.name).toBeTruthy();
        expect(["L1", "L2", "L3"]).toContain(provider.level);
        expect(typeof provider.rating).toBe("number");
        expect(provider.rating).toBeGreaterThanOrEqual(0);
        expect(provider.rating).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("getFeaturedProviders", () => {
    it("returns only featured providers", () => {
      const featured = getFeaturedProviders();
      expect(featured.every((p) => p.featured)).toBe(true);
    });

    it("returns at most 6 providers", () => {
      const featured = getFeaturedProviders();
      expect(featured.length).toBeLessThanOrEqual(6);
    });
  });

  describe("getProvider", () => {
    it("returns provider by slug", () => {
      const provider = getProvider("spark-ai-automation");
      expect(provider).toBeDefined();
      expect(provider?.slug).toBe("spark-ai-automation");
    });

    it("returns undefined for unknown slug", () => {
      expect(getProvider("non-existent")).toBeUndefined();
    });
  });

  describe("getCases", () => {
    it("returns cases sorted by sortOrder", () => {
      const cases = getCases();
      for (let i = 1; i < cases.length; i++) {
        expect(cases[i].sortOrder).toBeGreaterThanOrEqual(cases[i - 1].sortOrder);
      }
    });
  });

  describe("getFeaturedCases", () => {
    it("returns only featured cases", () => {
      const featured = getFeaturedCases();
      expect(featured.every((c) => c.featured)).toBe(true);
    });

    it("returns at most 2 cases", () => {
      const featured = getFeaturedCases();
      expect(featured.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getCase", () => {
    it("returns case by slug", () => {
      const caseStudy = getCase("b2b-consulting-rag-system");
      expect(caseStudy).toBeDefined();
      expect(caseStudy?.slug).toBe("b2b-consulting-rag-system");
    });

    it("returns undefined for unknown slug", () => {
      expect(getCase("non-existent")).toBeUndefined();
    });
  });

  describe("formatCurrencyRange", () => {
    it("formats currency range correctly", () => {
      expect(formatCurrencyRange(5000, 20000)).toBe("¥5,000 - 20,000");
    });
  });
});
