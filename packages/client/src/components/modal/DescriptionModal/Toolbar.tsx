import { Button } from "components/Button";
import { classNames } from "lib/classNames";
import {
  Quote,
  TypeBold,
  TypeH1,
  TypeH2,
  TypeItalic,
  TypeStrikethrough,
  TypeUnderline,
} from "react-bootstrap-icons";
import { Editor, BaseEditor, Transforms, Element as SlateElement } from "slate";
import { useSlate, ReactEditor } from "slate-react";

/**
 * mostly example code from: https://github.com/ianstormtaylor/slate/blob/main/site/examples/richtext.tsx
 */

export function Toolbar() {
  return (
    <div className="flex gap-1 mb-5">
      <MarkButton format="bold" icon={<TypeBold aria-label="bold" />} />
      <MarkButton format="italic" icon={<TypeItalic aria-label="italic" />} />
      <MarkButton format="underline" icon={<TypeUnderline aria-label="underline" />} />
      <MarkButton format="strikethrough" icon={<TypeStrikethrough aria-label="strikethrough" />} />
      <BlockButton format="heading-one" icon={<TypeH1 aria-label="heading-one" />} />
      <BlockButton format="heading-two" icon={<TypeH2 aria-label="heading-two" />} />
      <BlockButton format="block-quote" icon={<Quote aria-label="block-quote" />} />
    </div>
  );
}

interface ButtonProps {
  format: string;
  icon: React.ReactNode;
}

function BlockButton({ format, icon }: ButtonProps) {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format);

  return (
    <Button
      variant={isActive ? null : "default"}
      className={classNames(isActive && "dark:bg-neutral-700")}
      onClick={() => {
        toggleBlock(editor, format);
      }}
    >
      {icon}
    </Button>
  );
}

const MarkButton = ({ format, icon }: ButtonProps) => {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format);

  return (
    <Button
      variant={isActive ? null : "default"}
      className={classNames(isActive && "dark:bg-neutral-700")}
      onClick={() => {
        toggleMark(editor, format);
      }}
    >
      {icon}
    </Button>
  );
};

function isMarkActive(editor: BaseEditor & ReactEditor, format: string) {
  const marks = Editor.marks(editor);

  return marks ? (marks as any)[format] === true : false;
}

function toggleBlock(editor: BaseEditor & ReactEditor, format: string) {
  const isActive = isBlockActive(editor, format);

  const newProperties: Partial<SlateElement> = {
    // @ts-expect-error ignore
    type: isActive ? "paragraph" : format,
  };
  Transforms.setNodes<SlateElement>(editor, newProperties);
}

const toggleMark = (editor: BaseEditor & ReactEditor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: BaseEditor & ReactEditor, format: string) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => {
        if (Editor.isEditor(n)) return false;

        if ("text" in n) {
          return (n as any)[format];
        }

        return n.type === format;
      },
    }),
  );

  return !!match;
};
