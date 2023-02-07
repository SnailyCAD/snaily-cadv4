import { describe, expect, test } from "vitest";
import { parseCORSOrigin } from "../src/utils/validate-environment-variables";

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

    expect(parseCORSOrigin("*")).toBe("*");
    expect(parseCORSOrigin("invalid url")).toBe("invalid url");
  });
});
