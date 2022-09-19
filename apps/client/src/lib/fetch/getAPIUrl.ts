export function getAPIUrl() {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080/v1";
  }

  return envUrl;
}
