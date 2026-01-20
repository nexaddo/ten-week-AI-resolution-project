import { describe, it, expect } from "vitest";
import { categoryColors, categoryIcons } from "./categories";
import { categories, type Category } from "@shared/schema";

describe("categoryColors", () => {
  it("has colors defined for all categories", () => {
    categories.forEach((category) => {
      expect(categoryColors[category]).toBeDefined();
      expect(categoryColors[category].bg).toBeDefined();
      expect(categoryColors[category].text).toBeDefined();
    });
  });

  it("Health & Fitness has emerald colors", () => {
    expect(categoryColors["Health & Fitness"].bg).toContain("emerald");
    expect(categoryColors["Health & Fitness"].text).toContain("emerald");
  });

  it("Career has blue colors", () => {
    expect(categoryColors["Career"].bg).toContain("blue");
    expect(categoryColors["Career"].text).toContain("blue");
  });

  it("Learning has purple colors", () => {
    expect(categoryColors["Learning"].bg).toContain("purple");
    expect(categoryColors["Learning"].text).toContain("purple");
  });

  it("Finance has amber colors", () => {
    expect(categoryColors["Finance"].bg).toContain("amber");
    expect(categoryColors["Finance"].text).toContain("amber");
  });

  it("Relationships has pink colors", () => {
    expect(categoryColors["Relationships"].bg).toContain("pink");
    expect(categoryColors["Relationships"].text).toContain("pink");
  });

  it("Personal Growth has indigo colors", () => {
    expect(categoryColors["Personal Growth"].bg).toContain("indigo");
    expect(categoryColors["Personal Growth"].text).toContain("indigo");
  });

  it("all colors include dark mode variants", () => {
    categories.forEach((category) => {
      expect(categoryColors[category].bg).toContain("dark:");
      expect(categoryColors[category].text).toContain("dark:");
    });
  });
});

describe("categoryIcons", () => {
  it("has icons defined for all categories", () => {
    categories.forEach((category) => {
      expect(categoryIcons[category]).toBeDefined();
      expect(typeof categoryIcons[category]).toBe("string");
    });
  });

  it("Health & Fitness uses activity icon", () => {
    expect(categoryIcons["Health & Fitness"]).toBe("activity");
  });

  it("Career uses briefcase icon", () => {
    expect(categoryIcons["Career"]).toBe("briefcase");
  });

  it("Learning uses book-open icon", () => {
    expect(categoryIcons["Learning"]).toBe("book-open");
  });

  it("Finance uses wallet icon", () => {
    expect(categoryIcons["Finance"]).toBe("wallet");
  });

  it("Relationships uses heart icon", () => {
    expect(categoryIcons["Relationships"]).toBe("heart");
  });

  it("Personal Growth uses sparkles icon", () => {
    expect(categoryIcons["Personal Growth"]).toBe("sparkles");
  });
});
