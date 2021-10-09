const IMAGE_URL = "http://localhost:8080/";

export function makeImageUrl(type: "citizens" | "users", id: string) {
  return `${IMAGE_URL}${type}/${id}`;
}
