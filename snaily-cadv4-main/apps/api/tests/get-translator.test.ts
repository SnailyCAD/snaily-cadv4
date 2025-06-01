/* eslint-disable quotes */
import { describe, expect, test } from "vitest";
import { getTranslator } from "../src/utils/get-translator";

describe("getTranslator", () => {
  test("It should create a fully operational translator for API use", async () => {
    const translator = await getTranslator({
      type: "error-messages",
      locale: "en",
    });

    expect(
      translator("ErrorMessages.expectedReceived", {
        expected: "test",
        received: "test",
      }),
    ).toMatchInlineSnapshot('"Expected test, received test"');
  });

  test("It should use the default locale for a non-existent locale", async () => {
    const translator = await getTranslator({
      type: "error-messages",
      locale: "nl",
      namespace: "ErrorMessages",
    });

    expect(
      translator("expectedReceived", {
        expected: "test",
        received: "test",
      }),
    ).toMatchInlineSnapshot('"Expected test, received test"');
  });
});
