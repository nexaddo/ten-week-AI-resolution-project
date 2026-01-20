import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CategoryBadge } from "./category-badge";
import { categories } from "@shared/schema";

describe("CategoryBadge", () => {
  it.each(categories)("renders %s category with correct text", (category) => {
    render(<CategoryBadge category={category} />);
    expect(screen.getByText(category)).toBeInTheDocument();
  });

  it.each(categories)("has correct test id for %s category", (category) => {
    render(<CategoryBadge category={category} />);
    const expectedTestId = `badge-category-${category.toLowerCase().replace(/\s+/g, "-")}`;
    expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
  });

  it("shows icon by default", () => {
    render(<CategoryBadge category="Health & Fitness" />);
    const badge = screen.getByTestId("badge-category-health-&-fitness");
    // Icon should be present (SVG element)
    expect(badge.querySelector("svg")).toBeInTheDocument();
  });

  it("hides icon when showIcon is false", () => {
    render(<CategoryBadge category="Health & Fitness" showIcon={false} />);
    const badge = screen.getByTestId("badge-category-health-&-fitness");
    expect(badge.querySelector("svg")).not.toBeInTheDocument();
  });

  it("applies correct color classes for Health & Fitness", () => {
    render(<CategoryBadge category="Health & Fitness" />);
    const badge = screen.getByTestId("badge-category-health-&-fitness");
    expect(badge).toHaveClass("bg-emerald-100", "text-emerald-700");
  });

  it("applies correct color classes for Career", () => {
    render(<CategoryBadge category="Career" />);
    const badge = screen.getByTestId("badge-category-career");
    expect(badge).toHaveClass("bg-blue-100", "text-blue-700");
  });

  it("applies correct color classes for Learning", () => {
    render(<CategoryBadge category="Learning" />);
    const badge = screen.getByTestId("badge-category-learning");
    expect(badge).toHaveClass("bg-purple-100", "text-purple-700");
  });

  it("applies correct color classes for Finance", () => {
    render(<CategoryBadge category="Finance" />);
    const badge = screen.getByTestId("badge-category-finance");
    expect(badge).toHaveClass("bg-amber-100", "text-amber-700");
  });

  it("applies correct color classes for Relationships", () => {
    render(<CategoryBadge category="Relationships" />);
    const badge = screen.getByTestId("badge-category-relationships");
    expect(badge).toHaveClass("bg-pink-100", "text-pink-700");
  });

  it("applies correct color classes for Personal Growth", () => {
    render(<CategoryBadge category="Personal Growth" />);
    const badge = screen.getByTestId("badge-category-personal-growth");
    expect(badge).toHaveClass("bg-indigo-100", "text-indigo-700");
  });
});
