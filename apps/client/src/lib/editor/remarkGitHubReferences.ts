import { findAndReplace } from "mdast-util-find-and-replace";

const linkRegex =
  /https?:\/\/github\.com\/SnailyCAD\/snaily-cadv4\/(commit|compare|issues|pull)\/([a-f\d.]+(?:\.{3}[a-f\d.]+)?\/?(?=[#?]|$))/;

function replaceMatch(url: string, type: string, number: string) {
  if (type === "compare") {
    return {
      type: "link",
      title: null,
      url,
      children: [{ type: "text", value: number }],
    } as any;
  }

  return {
    type: "link",
    title: null,
    url,
    children: [{ type: "text", value: `#${number}` }],
  } as any;
}

function replaceMatchLinks(_url: string, _type: string, number: string) {
  return `${number}`;
}

export function remarkGitHubReferences() {
  return function (tree: any) {
    findAndReplace(tree, linkRegex, replaceMatch, { ignore: "link" });
    findAndReplace(tree, linkRegex, replaceMatchLinks, { ignore: "text" });
    findAndReplace(tree, /What's Changed/);
  };
}
