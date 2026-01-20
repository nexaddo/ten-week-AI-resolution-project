import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { StatsCards } from "./stats-cards";
import type { Resolution } from "@shared/schema";

const createResolution = (overrides: Partial<Resolution> = {}): Resolution => ({
  id: Math.random().toString(),
  userId: "user-1",
  title: "Test Resolution",
  description: "Test description",
  category: "Health & Fitness",
  status: "not_started",
  targetDate: "2025-12-31",
  progress: 0,
  ...overrides,
});

describe("StatsCards", () => {
  it("renders all four stat cards", () => {
    render(<StatsCards resolutions={[]} />);

    expect(screen.getByText("Total Resolutions")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completion Rate")).toBeInTheDocument();
  });

  it("shows correct total count", () => {
    const resolutions = [
      createResolution({ id: "1" }),
      createResolution({ id: "2" }),
      createResolution({ id: "3" }),
    ];
    render(<StatsCards resolutions={resolutions} />);

    expect(screen.getByTestId("text-stat-total-resolutions")).toHaveTextContent("3");
  });

  it("shows correct completed count", () => {
    const resolutions = [
      createResolution({ id: "1", status: "completed" }),
      createResolution({ id: "2", status: "completed" }),
      createResolution({ id: "3", status: "in_progress" }),
    ];
    render(<StatsCards resolutions={resolutions} />);

    expect(screen.getByTestId("text-stat-completed")).toHaveTextContent("2");
  });

  it("shows correct in progress count", () => {
    const resolutions = [
      createResolution({ id: "1", status: "in_progress" }),
      createResolution({ id: "2", status: "in_progress" }),
      createResolution({ id: "3", status: "completed" }),
      createResolution({ id: "4", status: "not_started" }),
    ];
    render(<StatsCards resolutions={resolutions} />);

    expect(screen.getByTestId("text-stat-in-progress")).toHaveTextContent("2");
  });

  it("calculates completion rate correctly", () => {
    const resolutions = [
      createResolution({ id: "1", status: "completed" }),
      createResolution({ id: "2", status: "completed" }),
      createResolution({ id: "3", status: "in_progress" }),
      createResolution({ id: "4", status: "not_started" }),
    ];
    render(<StatsCards resolutions={resolutions} />);

    // 2 completed out of 4 = 50%
    expect(screen.getByTestId("text-stat-completion-rate")).toHaveTextContent("50%");
  });

  it("shows 0% completion rate when there are no resolutions", () => {
    render(<StatsCards resolutions={[]} />);

    expect(screen.getByTestId("text-stat-completion-rate")).toHaveTextContent("0%");
  });

  it("shows all zeros when there are no resolutions", () => {
    render(<StatsCards resolutions={[]} />);

    expect(screen.getByTestId("text-stat-total-resolutions")).toHaveTextContent("0");
    expect(screen.getByTestId("text-stat-completed")).toHaveTextContent("0");
    expect(screen.getByTestId("text-stat-in-progress")).toHaveTextContent("0");
  });

  it("rounds completion rate to nearest integer", () => {
    const resolutions = [
      createResolution({ id: "1", status: "completed" }),
      createResolution({ id: "2", status: "in_progress" }),
      createResolution({ id: "3", status: "not_started" }),
    ];
    render(<StatsCards resolutions={resolutions} />);

    // 1 completed out of 3 = 33.33...% rounds to 33%
    expect(screen.getByTestId("text-stat-completion-rate")).toHaveTextContent("33%");
  });

  it("shows 100% when all resolutions are completed", () => {
    const resolutions = [
      createResolution({ id: "1", status: "completed" }),
      createResolution({ id: "2", status: "completed" }),
    ];
    render(<StatsCards resolutions={resolutions} />);

    expect(screen.getByTestId("text-stat-completion-rate")).toHaveTextContent("100%");
  });
});
