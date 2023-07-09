/* eslint-disable quotes */
import { describe, expect, test } from "vitest";
import { slateDataToString } from "../src/editor/slate-data-to-string";
import type { Descendant } from "slate";

const TEST_VALUE = [
  {
    type: "paragraph",
    children: [
      {
        text: "Hello ",
      },
      {
        bold: true,
        text: "world - this is a test",
      },
    ],
  },
  {
    type: "bulleted-list",
    children: [
      {
        type: "list-item",
        children: [
          {
            text: "hello world",
          },
        ],
      },
      {
        type: "list-item",
        children: [
          {
            text: "testing",
          },
        ],
      },
      {
        type: "list-item",
        children: [
          {
            text: "",
          },
        ],
      },
      {
        type: "list-item",
        children: [
          {
            text: "line breaks",
          },
        ],
      },
    ],
  },
] satisfies Descendant[];

describe("slateDataToString", () => {
  test("should return a single line string", () => {
    expect(slateDataToString(TEST_VALUE)).toMatchInlineSnapshot(
      '"Hello world - this is a test hello world testing  line breaks"',
    );
  });

  test("Return null if data is null", () => {
    expect(slateDataToString(null)).toBeNull();
  });
});
