/**
 * get the api url from the environment variables
 */
export function getAPIUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080/v1";
  }

  if (envUrl.endsWith("/v1")) {
    return envUrl;
  }

  return `${envUrl}/v1`;
}
