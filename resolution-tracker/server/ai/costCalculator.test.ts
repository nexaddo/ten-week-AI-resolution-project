import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateCost, getModelPricing } from "./costCalculator";

describe("costCalculator", () => {
  describe("calculateCost", () => {
    it("calculates cost for claude-sonnet-4 correctly", () => {
      // 1000 input tokens at $3/MTok = $0.003
      // 500 output tokens at $15/MTok = $0.0075
      // Total = $0.0105
      const cost = calculateCost("claude-sonnet-4", 1000, 500);
      expect(cost).toBe("0.010500");
    });

    it("calculates cost for gpt-4o correctly", () => {
      // 1000 input tokens at $2.5/MTok = $0.0025
      // 500 output tokens at $10/MTok = $0.005
      // Total = $0.0075
      const cost = calculateCost("gpt-4o", 1000, 500);
      expect(cost).toBe("0.007500");
    });

    it("calculates cost for gpt-4o-mini correctly", () => {
      // 1000 input tokens at $0.15/MTok = $0.00015
      // 500 output tokens at $0.6/MTok = $0.0003
      // Total = $0.00045
      const cost = calculateCost("gpt-4o-mini", 1000, 500);
      expect(cost).toBe("0.000450");
    });

    it("calculates cost for gemini-1.5-pro correctly", () => {
      // 1000 input tokens at $1.25/MTok = $0.00125
      // 500 output tokens at $5/MTok = $0.0025
      // Total = $0.00375
      const cost = calculateCost("gemini-1.5-pro", 1000, 500);
      expect(cost).toBe("0.003750");
    });

    it("calculates cost for gemini-1.5-flash correctly", () => {
      // 1000 input tokens at $0.075/MTok = $0.000075
      // 500 output tokens at $0.3/MTok = $0.00015
      // Total = $0.000225
      const cost = calculateCost("gemini-1.5-flash", 1000, 500);
      expect(cost).toBe("0.000225");
    });

    it("handles large token counts", () => {
      // 1 million input tokens at $3/MTok = $3
      // 1 million output tokens at $15/MTok = $15
      // Total = $18
      const cost = calculateCost("claude-sonnet-4", 1_000_000, 1_000_000);
      expect(cost).toBe("18.000000");
    });

    it("handles zero tokens", () => {
      const cost = calculateCost("claude-sonnet-4", 0, 0);
      expect(cost).toBe("0.000000");
    });

    it("handles zero input tokens", () => {
      // 0 input tokens = $0
      // 1000 output tokens at $15/MTok = $0.015
      const cost = calculateCost("claude-sonnet-4", 0, 1000);
      expect(cost).toBe("0.015000");
    });

    it("handles zero output tokens", () => {
      // 1000 input tokens at $3/MTok = $0.003
      // 0 output tokens = $0
      const cost = calculateCost("claude-sonnet-4", 1000, 0);
      expect(cost).toBe("0.003000");
    });

    describe("unknown model handling", () => {
      let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
      });

      it("returns 0.00 for unknown model", () => {
        const cost = calculateCost("unknown-model", 1000, 500);
        expect(cost).toBe("0.00");
      });

      it("logs a warning for unknown model", () => {
        calculateCost("unknown-model", 1000, 500);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Unknown model pricing for unknown-model, using default"
        );
      });
    });
  });

  describe("getModelPricing", () => {
    it("returns pricing for claude-sonnet-4", () => {
      const pricing = getModelPricing("claude-sonnet-4");
      expect(pricing).toEqual({
        inputCostPerMTok: 3,
        outputCostPerMTok: 15,
      });
    });

    it("returns pricing for claude-opus-4", () => {
      const pricing = getModelPricing("claude-opus-4");
      expect(pricing).toEqual({
        inputCostPerMTok: 15,
        outputCostPerMTok: 75,
      });
    });

    it("returns pricing for gpt-4", () => {
      const pricing = getModelPricing("gpt-4");
      expect(pricing).toEqual({
        inputCostPerMTok: 30,
        outputCostPerMTok: 60,
      });
    });

    it("returns pricing for gpt-4o", () => {
      const pricing = getModelPricing("gpt-4o");
      expect(pricing).toEqual({
        inputCostPerMTok: 2.5,
        outputCostPerMTok: 10,
      });
    });

    it("returns pricing for gpt-3.5-turbo", () => {
      const pricing = getModelPricing("gpt-3.5-turbo");
      expect(pricing).toEqual({
        inputCostPerMTok: 0.5,
        outputCostPerMTok: 1.5,
      });
    });

    it("returns pricing for gemini-1.5-pro", () => {
      const pricing = getModelPricing("gemini-1.5-pro");
      expect(pricing).toEqual({
        inputCostPerMTok: 1.25,
        outputCostPerMTok: 5,
      });
    });

    it("returns pricing for gemini-1.5-flash", () => {
      const pricing = getModelPricing("gemini-1.5-flash");
      expect(pricing).toEqual({
        inputCostPerMTok: 0.075,
        outputCostPerMTok: 0.3,
      });
    });

    it("returns null for unknown model", () => {
      const pricing = getModelPricing("unknown-model");
      expect(pricing).toBeNull();
    });
  });
});
