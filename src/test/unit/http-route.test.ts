import { z } from "zod";
import { describe, expect, it } from "vitest";

import { handleRoute } from "@/infra/http/route";
import { ValidationError } from "@/lib/application-errors";

describe("handleRoute", () => {
  it("returns the original response for successful handlers", async () => {
    const handler = handleRoute(async () =>
      Response.json({ ok: true }, { status: 201 }),
    );

    const response = await handler();

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("maps application errors to the stable API envelope", async () => {
    const handler = handleRoute(async () => {
      throw new ValidationError("Bad input.", { field: "title" });
    });

    const response = await handler();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "validation_error",
        message: "Bad input.",
        details: { field: "title" },
      },
    });
  });

  it("preserves Zod validation details", async () => {
    const handler = handleRoute(async () => {
      z.object({ title: z.string().min(1) }).parse({ title: "" });
      return Response.json({ ok: true });
    });

    const response = await handler();
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("validation_error");
    expect(payload.error.message).toBe("The request payload is invalid.");
    expect(payload.error.details).toBeDefined();
  });

  it("hides unknown failures behind the safe 500 envelope", async () => {
    const handler = handleRoute(async () => {
      throw new Error("database exploded");
    });

    const response = await handler();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "internal_error",
        message: "Something went wrong. Please try again.",
      },
    });
  });
});
