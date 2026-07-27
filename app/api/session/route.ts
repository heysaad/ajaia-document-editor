import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/config/env";
import { validateSessionUserId } from "@/features/auth/server/auth-session";
import { handleRoute, parseJsonBody } from "@/infra/http/route";

export const runtime = "nodejs";

const sessionSchema = z.object({
  userId: z.string().uuid(),
});

export const POST = handleRoute(async (request: Request) => {
  const body = await parseJsonBody(request, sessionSchema);
  const user = validateSessionUserId(body.userId);
  const cookieStore = await cookies();

  cookieStore.set(env.SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ user });
});
