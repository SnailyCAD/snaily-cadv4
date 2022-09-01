import { test, expect } from "vitest";
import { removeExtraPartsFromURL } from "../src/utils/removeExtraPartsFromURL";

test("Remove extra parts from a URL", () => {
  expect(removeExtraPartsFromURL("http://localhost:3000")).toBe("http://localhost:3000");
  expect(removeExtraPartsFromURL("http://localhost:3000/")).toBe("http://localhost:3000");
  expect(removeExtraPartsFromURL("http://example.com/api")).toBe("http://example.com");
  expect(removeExtraPartsFromURL("https://cad.example.com/api")).toBe("https://cad.example.com");
});
