import { NextResponse } from "next/server";

import { getOptionalDemoUser } from "@/features/auth/server/auth-session";
import { DEMO_USERS } from "@/features/auth/server/demo-users";
import { toErrorResponse } from "@/infra/http/route";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await getOptionalDemoUser();
    return NextResponse.json({ users: DEMO_USERS, currentUser });
  } catch (error) {
    return toErrorResponse(error);
  }
}
