import { NextResponse } from "next/server";

import { getOptionalSessionUser } from "@/features/auth/server/auth-session";
import { SEEDED_USERS } from "@/features/auth/server/seeded-users";
import { handleRoute } from "@/infra/http/route";

export const runtime = "nodejs";

export const GET = handleRoute(async () => {
  const currentUser = await getOptionalSessionUser();
  return NextResponse.json({ users: SEEDED_USERS, currentUser });
});
