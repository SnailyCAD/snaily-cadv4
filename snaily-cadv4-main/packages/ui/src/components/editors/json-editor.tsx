import Editor from "@monaco-editor/react";

export interface JsonEditorProps {
  value: string;
  onChange(value: string | undefined): void;
}

export function JsonEditor(props: JsonEditorProps) {
  return (
    <div className="overflow-hidden rounded-md border-2 border-secondary">
      <Editor
        loading={<SkeletonEditorLoading />}
        theme="vs-dark"
        height="200px"
        language="json"
        value={props.value}
        onChange={props.onChange}
      />
    </div>
  );
}

function SkeletonEditorLoading() {
  return (
    <div
      aria-label="Loading Editor..."
      className="h-[200px] w-full bg-secondary animate-pulse p-6 flex flex-col gap-y-1.5"
    >
      <span className="block bg-primary h-3 w-full animate-pulse rounded" />
      <span className="block bg-primary h-3 w-full animate-pulse rounded" />
      <span className="block bg-primary h-3 w-full animate-pulse rounded" />
      <span className="block bg-primary h-3 w-full animate-pulse rounded" />
      <span className="block bg-primary h-3 w-full animate-pulse rounded" />
      <span className="block bg-primary h-3 w-full animate-pulse rounded" />
      <span className="block bg-primary h-3 w-full animate-pulse rounded" />
    </div>
  );
}
