import { Editor, Element as SlateElement, Descendant } from "slate";

export function dataToString(data: Descendant[]) {
  const string: string[] = [];

  for (const item of data) {
    if (Editor.isEditor(item)) continue;

    if (SlateElement.isElement(item) && item.type === "bulleted-list") {
      const children = item.children.flatMap((c) => c.children).map((v) => v.text);

      string.push(children.join(" "));
      continue;
    }

    if (SlateElement.isElement(item)) {
      item.children.forEach((child) => {
        string.push(child.text);
      });
    }
  }

  return string.join(" ");
}
