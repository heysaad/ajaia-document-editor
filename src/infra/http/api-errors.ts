export type ApiErrorShape = {
  error: {
    code: import("@/lib/application-errors").ApiErrorCode;
    message: string;
    details?: unknown;
  };
};
