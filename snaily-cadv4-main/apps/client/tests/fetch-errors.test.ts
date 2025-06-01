/* eslint-disable quotes */
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, test } from "vitest";
import { getErrorObj, isAxiosError, parseError, isErrorKey } from "../src/lib/fetch/errors";
import { Errors } from "../locales/en/common.json";

const MOCK_ERROR = new AxiosError("Unable to fetch data", "500", {
  headers: new AxiosHeaders({ foo: "bar" }),
  data: { foo: "bar" },
  method: "POST",
  url: "https://example.com",
});

const MOCK_NOT_FOUND_ERROR = new AxiosError("NOT_FOUND", "404", {
  headers: new AxiosHeaders({ foo: "bar" }),
  data: { foo: "bar" },
  method: "POST",
  url: "https://example.com",
});

describe("getErrorObj", () => {
  test("should return empty object -> invalid error object", () => {
    expect(getErrorObj("test")).toMatchInlineSnapshot("{}");
  });

  test("should return correct information for error object", () => {
    expect(getErrorObj(MOCK_ERROR)).toMatchInlineSnapshot(`
      {
        "data": {
          "foo": "bar",
        },
        "message": "Unable to fetch data",
        "method": "POST",
        "response": undefined,
        "status": undefined,
        "url": "https://example.com",
      }
    `);
  });
});

describe("parseError", () => {
  test("should parse correct error message", () => {
    // @ts-expect-error this is a valid error object
    expect(parseError(MOCK_ERROR)).toMatchInlineSnapshot('"Unable to fetch data"');
  });

  test("should return NOT_FOUND error message", () => {
    // @ts-expect-error this is a valid error object
    expect(parseError(MOCK_NOT_FOUND_ERROR)).toMatchInlineSnapshot('"NOT_FOUND"');
  });
});

describe("isAxiosError", () => {
  test("Should return true", () => {
    expect(isAxiosError(new AxiosError("Unable to fetch data"))).toBe(true);
    expect(isAxiosError(new Error("Unable to fetch data"))).toBe(true);
  });

  test("Should return false", () => {
    expect(isAxiosError("Unable to fetch data")).toBe(false);
  });
});

describe("isErrorKey", () => {
  test("Should return true", () => {
    expect(isErrorKey("Network Error", Errors)).toBe(true);
  });

  test("Should return false", () => {
    expect(isErrorKey("This Does not exist", Errors)).toBe(false);
  });
});
