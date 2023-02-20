import { AxiosError } from "axios";
import type { TranslationValues } from "use-intl";

export type ErrorMessages = typeof import("../../../locales/en/common.json")["Errors"];
export type ErrorMessage = keyof ErrorMessages;

export interface ErrorObj {
  message: ErrorMessage;
  data: TranslationValues;
}

export interface ErrorResponseData {
  name: string;
  message: string;
  status: number;
  errors: Record<string, ErrorMessage | ErrorObj>[];
  stack: string;
}

export function parseError(
  error: AxiosError<ErrorResponseData | null>,
): ErrorMessage | "unknown" | (string & {}) {
  const message = error.response?.data?.message ?? error.message;
  const name = error.name;

  if (name && !message && ["NOT_FOUND", "Error"].includes(name)) {
    return name;
  }

  return message || "unknown";
}

export function parseErrors(error: AxiosError<ErrorResponseData | null>) {
  return error.response?.data?.errors ?? [];
}

export function parseErrorTitle(error: AxiosError<ErrorResponseData | null>) {
  const name = (error.response?.data?.name ?? error.message) as string | undefined;
  if (!name) return;

  return name.toLowerCase().replace(/_/g, " ");
}

export function getFeatureNotEnabledError(
  error: AxiosError<ErrorResponseData | null>,
): ErrorObj | null {
  const errors = parseErrors(error);
  const message = error.response?.data?.message ?? error.message;

  const [_error] = errors;
  if (_error && message === "featureNotEnabled") {
    return _error as unknown as ErrorObj;
  }

  return null;
}

export function isAxiosError<T>(error: unknown): error is AxiosError<T, T> {
  if (!error) return false;
  return (
    error instanceof Error ||
    error instanceof AxiosError ||
    (typeof error === "object" && "response" in error)
  );
}

export function isErrorKey(
  key: string | ErrorObj,
  errorMessages: ErrorMessages,
): key is ErrorMessage {
  if (typeof key !== "string") return false;
  return Object.keys(errorMessages).includes(key);
}

export function getErrorObj(error: unknown) {
  let errorObj = {};

  if (error instanceof Error) {
    errorObj = {
      message: error.message,
      status: error.name,
      name: error.name,
      cause: error.cause,
      stack: error.stack,
    };
  }

  if (isAxiosError(error)) {
    errorObj = {
      message: error.message,
      status: error.response?.status,
      response: error.response,
      method: error.config?.method,
      data: error.config?.data,
      url: error.config?.url,
    };
  }

  return errorObj;
}
