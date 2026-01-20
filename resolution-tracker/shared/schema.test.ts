import { describe, it, expect } from "vitest";
import {
  categories,
  statuses,
  insertResolutionSchema,
  insertMilestoneSchema,
  insertCheckInSchema,
} from "./schema";

describe("schema constants", () => {
  describe("categories", () => {
    it("has all expected categories", () => {
      expect(categories).toContain("Health & Fitness");
      expect(categories).toContain("Career");
      expect(categories).toContain("Learning");
      expect(categories).toContain("Finance");
      expect(categories).toContain("Relationships");
      expect(categories).toContain("Personal Growth");
    });

    it("has exactly 6 categories", () => {
      expect(categories).toHaveLength(6);
    });
  });

  describe("statuses", () => {
    it("has all expected statuses", () => {
      expect(statuses).toContain("not_started");
      expect(statuses).toContain("in_progress");
      expect(statuses).toContain("completed");
      expect(statuses).toContain("abandoned");
    });

    it("has exactly 4 statuses", () => {
      expect(statuses).toHaveLength(4);
    });
  });
});

describe("insertResolutionSchema", () => {
  it("validates a valid resolution", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
      category: "Health & Fitness",
    });
    expect(result.success).toBe(true);
  });

  it("validates resolution with all fields", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
      description: "Exercise 3 times a week",
      category: "Health & Fitness",
      status: "in_progress",
      targetDate: "2025-12-31",
      progress: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = insertResolutionSchema.safeParse({
      category: "Health & Fitness",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
      category: "Invalid Category",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
      category: "Health & Fitness",
      status: "invalid_status",
    });
    expect(result.success).toBe(false);
  });

  it("rejects progress below 0", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
      category: "Health & Fitness",
      progress: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects progress above 100", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
      category: "Health & Fitness",
      progress: 101,
    });
    expect(result.success).toBe(false);
  });

  it("accepts progress of 0", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
      category: "Health & Fitness",
      progress: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts progress of 100", () => {
    const result = insertResolutionSchema.safeParse({
      title: "Get fit",
      category: "Health & Fitness",
      progress: 100,
    });
    expect(result.success).toBe(true);
  });

  it.each(categories)("accepts %s as valid category", (category) => {
    const result = insertResolutionSchema.safeParse({
      title: "Test",
      category,
    });
    expect(result.success).toBe(true);
  });

  it.each(statuses)("accepts %s as valid status", (status) => {
    const result = insertResolutionSchema.safeParse({
      title: "Test",
      category: "Career",
      status,
    });
    expect(result.success).toBe(true);
  });
});

describe("insertMilestoneSchema", () => {
  it("validates a valid milestone", () => {
    const result = insertMilestoneSchema.safeParse({
      resolutionId: "res-123",
      title: "Complete first week",
    });
    expect(result.success).toBe(true);
  });

  it("validates milestone with all fields", () => {
    const result = insertMilestoneSchema.safeParse({
      resolutionId: "res-123",
      title: "Complete first week",
      completed: true,
      targetDate: "2025-06-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing resolutionId", () => {
    const result = insertMilestoneSchema.safeParse({
      title: "Complete first week",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const result = insertMilestoneSchema.safeParse({
      resolutionId: "res-123",
    });
    expect(result.success).toBe(false);
  });
});

describe("insertCheckInSchema", () => {
  it("validates a valid check-in", () => {
    const result = insertCheckInSchema.safeParse({
      resolutionId: "res-123",
      note: "Made good progress today!",
      date: "2025-01-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing resolutionId", () => {
    const result = insertCheckInSchema.safeParse({
      note: "Made good progress today!",
      date: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing note", () => {
    const result = insertCheckInSchema.safeParse({
      resolutionId: "res-123",
      date: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing date", () => {
    const result = insertCheckInSchema.safeParse({
      resolutionId: "res-123",
      note: "Made good progress today!",
    });
    expect(result.success).toBe(false);
  });
});
