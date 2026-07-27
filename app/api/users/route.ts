import { NextResponse } from "next/server";

import { getOptionalDemoUser } from "@/features/auth/server/auth-session";
import { DEMO_USERS } from "@/features/auth/server/demo-users";
import { handleRoute } from "@/infra/http/route";

export const runtime = "nodejs";

export const GET = handleRoute(async () => {
  const currentUser = await getOptionalDemoUser();
  return NextResponse.json({ users: DEMO_USERS, currentUser });
});
