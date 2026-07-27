import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountCard } from "@/features/auth/components/account-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { SignupForm } from "@/features/auth/components/signup-form";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
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
    signIn: { email: mocks.signIn },
    signUp: { email: mocks.signUp },
    signOut: mocks.signOut,
  },
}));

describe("authentication forms", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("signs in and returns to the dashboard", async () => {
    const user = userEvent.setup();
    mocks.signIn.mockResolvedValue({ data: {}, error: null });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "maya@example.com");
    await user.type(screen.getByLabelText("Password"), "demo-password-1234");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith({
        email: "maya@example.com",
        password: "demo-password-1234",
        rememberMe: true,
      });
      expect(mocks.replace).toHaveBeenCalledWith("/");
      expect(mocks.refresh).toHaveBeenCalled();
    });
  });

  it("shows a generic error for invalid credentials", async () => {
    const user = userEvent.setup();
    mocks.signIn.mockResolvedValue({
      data: null,
      error: { message: "User not found" },
    });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "unknown@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("The email or password is incorrect."),
    ).toBeVisible();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("registers a user and opens the dashboard", async () => {
    const user = userEvent.setup();
    mocks.signUp.mockResolvedValue({ data: {}, error: null });
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Name"), "Sam Writer");
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "secure-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith({
        name: "Sam Writer",
        email: "sam@example.com",
        password: "secure-password",
      });
      expect(mocks.replace).toHaveBeenCalledWith("/");
    });
  });

  it("invalidates the session when signing out", async () => {
    const user = userEvent.setup();
    mocks.signOut.mockResolvedValue({ data: {}, error: null });
    render(<AccountCard name="Maya Patel" email="maya@example.com" />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalled();
      expect(mocks.replace).toHaveBeenCalledWith("/login");
      expect(mocks.refresh).toHaveBeenCalled();
    });
  });
});
