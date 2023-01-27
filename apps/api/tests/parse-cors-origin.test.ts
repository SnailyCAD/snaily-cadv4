import { describe, expect, test } from "vitest";
import { parseCORSOrigin } from "../src/utils/parse-cors-origin";

describe("parseCORSOrigin", () => {
  test("Should remove last / from the CORS origin", () => {
    expect(parseCORSOrigin("https://cad.test-cad.example.com/")).toBe(
      "https://cad.test-cad.example.com",
    );
    expect(parseCORSOrigin("https://cad.test-cad.example.com:3000/")).toBe(
      "https://cad.test-cad.example.com:3000",
    );
    expect(parseCORSOrigin("https://cad.test-cad.example.com:3000")).toBe(
      "https://cad.test-cad.example.com:3000",
    );
  });
});
