import { AxiosError } from "axios";

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export const DEMO_READ_ONLY_MESSAGE =
  "Demo mode: read-only. This action is disabled.";

export function isDemoReadOnlyError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  const data = error.response?.data as ApiErrorPayload | undefined;

  return data?.error === "DemoModeReadOnly";
}
