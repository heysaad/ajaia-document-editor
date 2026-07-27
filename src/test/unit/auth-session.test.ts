import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOptionalSessionUser,
  resolveSessionUser,
} from "@/features/auth/server/auth-session";
import { UnauthorizedError } from "@/lib/application-errors";

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ cookie: "session=test" })),
}));

vi.mock("@/features/auth/server/auth.server", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

const user = {
  id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
  name: "Maya Patel",
  email: "maya@example.com",
};

describe("auth session", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("maps a Better Auth session to the application user shape", async () => {
    getSession.mockResolvedValue({
      session: { id: "session-id" },
      user: { ...user, emailVerified: false, image: null },
    });

    await expect(getOptionalSessionUser()).resolves.toEqual(user);
    expect(getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  it("returns null when the session is missing or expired", async () => {
    getSession.mockResolvedValue(null);

    await expect(getOptionalSessionUser()).resolves.toBeNull();
  });

  it("rejects required identity resolution without a session", async () => {
    getSession.mockResolvedValue(null);

    await expect(resolveSessionUser()).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
