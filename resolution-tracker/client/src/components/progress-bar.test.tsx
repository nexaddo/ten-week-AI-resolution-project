import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ProgressBar } from "./progress-bar";

describe("ProgressBar", () => {
  it("renders with default props", () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("text-progress-value")).toBeInTheDocument();
  });

  it("displays the correct percentage value", () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByTestId("text-progress-value")).toHaveTextContent("75%");
  });

  it("displays 0% for zero value", () => {
    render(<ProgressBar value={0} />);
    expect(screen.getByTestId("text-progress-value")).toHaveTextContent("0%");
  });

  it("displays 100% for complete value", () => {
    render(<ProgressBar value={100} />);
    expect(screen.getByTestId("text-progress-value")).toHaveTextContent("100%");
  });

  it("hides label when showLabel is false", () => {
    render(<ProgressBar value={50} showLabel={false} />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.queryByTestId("text-progress-value")).not.toBeInTheDocument();
  });

  it("shows label by default", () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByTestId("text-progress-value")).toBeInTheDocument();
  });

  it("applies small size class", () => {
    render(<ProgressBar value={50} size="sm" />);
    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar).toHaveClass("h-1.5");
  });

  it("applies medium size class by default", () => {
    render(<ProgressBar value={50} />);
    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar).toHaveClass("h-2");
  });

  it("applies large size class", () => {
    render(<ProgressBar value={50} size="lg" />);
    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar).toHaveClass("h-3");
  });

  it("handles decimal values", () => {
    render(<ProgressBar value={33.5} />);
    expect(screen.getByTestId("text-progress-value")).toHaveTextContent("33.5%");
  });
});
