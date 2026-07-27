import { toNextJsHandler } from "better-auth/next-js";

import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";

export const runtime = "nodejs";

const auth = appContainer.resolve(DI_TOKENS.Auth);
export const { GET, POST } = toNextJsHandler(auth);
