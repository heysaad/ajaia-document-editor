import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { type ApiErrorShape } from "@/infra/http/api-errors";
import { AppError, ValidationError } from "@/lib/application-errors";

type RouteHandlerArgs = [Request] | [Request, unknown] | [];
type RouteHandlerResult = Response | NextResponse | Promise<Response | NextResponse>;

export function toErrorResponse(error: unknown): NextResponse<ApiErrorShape> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "The request payload is invalid.",
          details: z.treeifyError(error),
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Something went wrong. Please try again.",
      },
    },
    { status: 500 },
  );
}

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    throw new ValidationError("Request JSON is malformed.");
  }

  return schema.parse(json);
}

export function handleRoute<TArgs extends RouteHandlerArgs>(
  handler: (...args: TArgs) => RouteHandlerResult,
) {
  return async (...args: TArgs): Promise<Response | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
