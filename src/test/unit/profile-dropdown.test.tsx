import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileDropdown } from "@/features/auth/components/profile-dropdown";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/features/auth/client/auth-client", () => ({
  authClient: {
    signOut: mocks.signOut,
  },
}));

describe("ProfileDropdown", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("shows initials and signs out from the profile menu", async () => {
    const user = userEvent.setup();
    mocks.signOut.mockResolvedValue({ data: {}, error: null });

    render(<ProfileDropdown name="Maya Patel" email="maya@example.com" />);

    expect(screen.getByText("MP")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Maya Patel/ }));
    await user.click(screen.getByRole("menuitem", { name: /Sign out/ }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalled();
      expect(mocks.replace).toHaveBeenCalledWith("/login");
      expect(mocks.refresh).toHaveBeenCalled();
    });
  });
});