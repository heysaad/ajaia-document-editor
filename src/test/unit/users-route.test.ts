import { afterEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/lib/application-errors";

const getOptionalSessionUserMock = vi.fn();

vi.mock("@/features/auth/server/auth-session", () => ({
  getOptionalSessionUser: getOptionalSessionUserMock,
}));

const { GET } = await import("@/app/api/users/route");

describe("GET /api/users", () => {
  afterEach(() => {
    getOptionalSessionUserMock.mockReset();
  });

  it("returns the seeded users with the current user", async () => {
    getOptionalSessionUserMock.mockResolvedValue({
      id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
      name: "Maya Patel",
      email: "maya@example.com",
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.currentUser).toMatchObject({
      name: "Maya Patel",
      email: "maya@example.com",
    });
    expect(payload.users).toHaveLength(3);
  });

  it("maps thrown auth errors through the shared route wrapper", async () => {
    getOptionalSessionUserMock.mockRejectedValue(
      new UnauthorizedError("Session missing."),
    );

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
        message: "Session missing.",
        details: undefined,
      },
    });
  });
});
