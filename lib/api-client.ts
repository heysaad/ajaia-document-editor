import type { ApiErrorShape } from "@/infra/http/api-errors";
import type { ApiErrorCode } from "@/lib/application-errors";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: ApiErrorCode,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    const apiError = payload as ApiErrorShape | undefined;
    throw new ApiClientError(
      apiError?.error.message ?? "The request could not be completed.",
      response.status,
      apiError?.error.code ?? "internal_error",
      apiError?.error.details,
    );
  }

  return payload as T;
}
