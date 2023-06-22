/**
 * get the api url from the environment variables
 */
export function getAPIUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080";

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080";
  }

  if (envUrl.endsWith("/v1")) {
    return envUrl.replace("/v1", "");
  }

  return envUrl;
}
