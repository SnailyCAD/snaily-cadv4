const IMAGE_URL = "http://localhost:8080/";

export function makeImageUrl(type: "citizens" | "users", id: string) {
  return `${IMAGE_URL}${type}/${id}`;
}

export function calculateAge(dateOfBirth: string | Date) {
  return ((Date.now() - new Date(dateOfBirth).getTime()) / (60 * 60 * 24 * 365.25 * 1000))
    .toString()
    .split(".")[0];
}
