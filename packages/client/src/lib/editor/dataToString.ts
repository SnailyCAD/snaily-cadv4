import { Editor, Element as SlateElement, Descendant } from "slate";

export function dataToString(data: Descendant[]) {
  const string: string[] = [];

  for (const item of data) {
    console.log({ data });

    if (!Editor.isEditor(item) && SlateElement.isElement(item)) {
      item.children.forEach((child) => {
        string.push(child.text);
      });
    }
  }

  return string.join(" ");
}
