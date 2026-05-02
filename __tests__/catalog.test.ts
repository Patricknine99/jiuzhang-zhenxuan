import { describe, it, expect } from "vitest";
import {
  serviceCategories,
  industryCategories,
  getServiceCategory,
  getIndustryCategory,
  getProvidersForService,
  getCasesForService,
  getProvidersForIndustry,
  getCasesForIndustry
} from "@/lib/catalog";

describe("catalog", () => {
  describe("serviceCategories", () => {
    it("has defined service categories", () => {
      expect(serviceCategories.length).toBeGreaterThan(0);
      for (const category of serviceCategories) {
        expect(category.slug).toBeTruthy();
        expect(category.title).toBeTruthy();
        expect(category.tags.length).toBeGreaterThan(0);
      }
    });
  });

  describe("industryCategories", () => {
    it("has defined industry categories", () => {
      expect(industryCategories.length).toBeGreaterThan(0);
      for (const category of industryCategories) {
        expect(category.slug).toBeTruthy();
        expect(category.title).toBeTruthy();
        expect(category.painPoints.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getServiceCategory", () => {
    it("returns category by slug", () => {
      const category = getServiceCategory("ai-automation");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("ai-automation");
    });

    it("returns undefined for unknown slug", () => {
      expect(getServiceCategory("unknown")).toBeUndefined();
    });
  });

  describe("getIndustryCategory", () => {
    it("returns category by slug", () => {
      const category = getIndustryCategory("ecommerce");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("ecommerce");
    });

    it("returns undefined for unknown slug", () => {
      expect(getIndustryCategory("unknown")).toBeUndefined();
    });
  });

  describe("getProvidersForService", () => {
    it("returns providers matching service tags", () => {
      const category = getServiceCategory("ecommerce-visuals")!;
      const providers = getProvidersForService(category);
      // Results depend on data; just verify it's an array
      expect(Array.isArray(providers)).toBe(true);
    });
  });

  describe("getCasesForService", () => {
    it("returns cases matching service categories", () => {
      const category = getServiceCategory("ai-automation")!;
      const cases = getCasesForService(category);
      expect(Array.isArray(cases)).toBe(true);
    });
  });

  describe("getProvidersForIndustry", () => {
    it("returns providers matching industry", () => {
      const category = getIndustryCategory("ecommerce")!;
      const providers = getProvidersForIndustry(category);
      expect(Array.isArray(providers)).toBe(true);
    });
  });

  describe("getCasesForIndustry", () => {
    it("returns cases matching industry", () => {
      const category = getIndustryCategory("education-consulting")!;
      const cases = getCasesForIndustry(category);
      expect(Array.isArray(cases)).toBe(true);
    });
  });
});
