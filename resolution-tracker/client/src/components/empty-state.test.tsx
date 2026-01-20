import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the empty state title", () => {
    render(<EmptyState onAddNew={() => {}} />);
    expect(screen.getByTestId("text-empty-title")).toHaveTextContent("No resolutions yet");
  });

  it("renders the description text", () => {
    render(<EmptyState onAddNew={() => {}} />);
    expect(screen.getByText(/Start your journey toward achieving your goals/)).toBeInTheDocument();
  });

  it("renders the add first resolution button", () => {
    render(<EmptyState onAddNew={() => {}} />);
    const button = screen.getByTestId("button-add-first-resolution");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Add Your First Resolution");
  });

  it("calls onAddNew when button is clicked", async () => {
    const user = userEvent.setup();
    const onAddNew = vi.fn();
    render(<EmptyState onAddNew={onAddNew} />);

    const button = screen.getByTestId("button-add-first-resolution");
    await user.click(button);

    expect(onAddNew).toHaveBeenCalledTimes(1);
  });

  it("renders the target icon", () => {
    render(<EmptyState onAddNew={() => {}} />);
    // The icon is wrapped in a div with specific styling
    const iconContainer = document.querySelector(".rounded-full.bg-primary\\/10");
    expect(iconContainer).toBeInTheDocument();
  });
});
