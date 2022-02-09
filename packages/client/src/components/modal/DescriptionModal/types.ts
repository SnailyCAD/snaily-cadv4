export type SlateElementTypes = "";

export type Text<Extra extends object = {}> = {
  text: string;
  bold?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  italic?: boolean;
} & Extra;

export interface ParagraphElement {
  type: "paragraph";
  children: Text[];
}

export interface HeadingOneElement {
  type: "heading-one";
  children: Text[];
}

export interface HeadingTwoElement {
  type: "heading-two";
  children: Text[];
}

export interface BlockquoteElement {
  type: "block-quote";
  children: Text[];
}

export interface ListItemElement {
  type: "list-item";
  children: Text[];
}

export interface BulletItemElement {
  type: "bulleted-list";
  children: Text[];
}

export interface CheckListItemElement {
  type: "check-list-item";
  children: Text<{ checked?: boolean }>[];
}

export type SlateElements =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | BlockquoteElement
  | ListItemElement
  | BulletItemElement
  | CheckListItemElement;
