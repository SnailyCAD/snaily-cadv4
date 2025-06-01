import type { SlateElements, Text } from "./types";
import type { BaseEditor, Descendant } from "slate";
import type { ReactEditor } from "slate-react";
import type { HistoryEditor } from "slate-history";

export type SlateEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
  interface CustomTypes {
    Element: SlateElements;
    Text: Text;
  }
}

export * from "./types";
export { slateDataToString } from "./slate-data-to-string";
export type { Descendant };
