import type { RenderElementProps } from "slate-react";
import { CheckListItemElement } from "./checklist-item";

export function EditorElement({ attributes, children, element, ...rest }: RenderElementProps) {
  switch (element.type) {
    case "block-quote": {
      return (
        <blockquote {...attributes} className="border-l-[3px] dark:border-[#3f3f3f] pl-2">
          {children}
        </blockquote>
      );
    }
    case "bulleted-list": {
      return <ul {...attributes}>{children}</ul>;
    }
    case "heading-one": {
      return (
        <h1 {...attributes} className="text-2xl font-semibold">
          {children}
        </h1>
      );
    }
    case "heading-two": {
      return (
        <h2 {...attributes} className="text-xl font-semibold">
          {children}
        </h2>
      );
    }
    case "list-item": {
      return (
        <li {...attributes} data-list-item="true">
          {children}
        </li>
      );
    }
    case "check-list-item": {
      return <CheckListItemElement {...{ children, attributes, element, ...rest }} />;
    }
    default: {
      return <p {...attributes}>{children}</p>;
    }
  }
}
