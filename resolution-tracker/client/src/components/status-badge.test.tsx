import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { StatusBadge } from "./status-badge";
import { Status } from "@shared/schema";

describe("StatusBadge", () => {
  const statuses: Status[] = ["not_started", "in_progress", "completed", "abandoned"];

  it.each(statuses)("renders %s status with correct label", (status) => {
    render(<StatusBadge status={status} />);

    const expectedLabels: Record<Status, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      completed: "Completed",
      abandoned: "Abandoned",
    };

    expect(screen.getByText(expectedLabels[status])).toBeInTheDocument();
  });

  it.each(statuses)("has correct test id for %s status", (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByTestId(`badge-status-${status}`)).toBeInTheDocument();
  });

  it("renders with correct styling classes for completed status", () => {
    render(<StatusBadge status="completed" />);
    const badge = screen.getByTestId("badge-status-completed");
    expect(badge).toHaveClass("bg-emerald-100");
  });

  it("renders with correct styling classes for in_progress status", () => {
    render(<StatusBadge status="in_progress" />);
    const badge = screen.getByTestId("badge-status-in_progress");
    expect(badge).toHaveClass("bg-blue-100");
  });

  it("renders with muted styling for not_started status", () => {
    render(<StatusBadge status="not_started" />);
    const badge = screen.getByTestId("badge-status-not_started");
    expect(badge).toHaveClass("bg-muted");
  });

  it("renders with destructive styling for abandoned status", () => {
    render(<StatusBadge status="abandoned" />);
    const badge = screen.getByTestId("badge-status-abandoned");
    expect(badge).toHaveClass("text-destructive");
  });
});
