import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  normalizePhone,
  isValidEmail,
  isValidPhone,
  validatePassword
} from "@/lib/auth";

describe("auth utilities", () => {
  describe("normalizeEmail", () => {
    it("trims and lowercases email", () => {
      expect(normalizeEmail("  Test@Example.COM  ")).toBe("test@example.com");
    });
  });

  describe("normalizePhone", () => {
    it("removes spaces and dashes", () => {
      expect(normalizePhone("138-0013-8000")).toBe("13800138000");
      expect(normalizePhone("138 0013 8000")).toBe("13800138000");
    });
  });

  describe("isValidEmail", () => {
    it("accepts valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name+tag@example.co.uk")).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(isValidEmail("not-an-email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isValidPhone", () => {
    it("accepts valid Chinese mobile numbers", () => {
      expect(isValidPhone("13800138000")).toBe(true);
      expect(isValidPhone("15912345678")).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      expect(isValidPhone("12345678901")).toBe(false); // invalid prefix
      expect(isValidPhone("1380013800")).toBe(false); // too short
      expect(isValidPhone("")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("accepts strong passwords", () => {
      expect(validatePassword("Hello1!").valid).toBe(false); // too short
      expect(validatePassword("HelloWorld1!").valid).toBe(true);
    });

    it("rejects short passwords", () => {
      const result = validatePassword("short");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("8 位");
    });

    it("rejects passwords without letters", () => {
      const result = validatePassword("12345678!");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("字母");
    });

    it("rejects passwords without digits", () => {
      const result = validatePassword("HelloWorld!");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("数字");
    });

    it("rejects passwords without special characters", () => {
      const result = validatePassword("HelloWorld1");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("特殊字符");
    });
  });
});
