import * as React from "react";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import type { ListState } from "@react-stately/list";
import { useListBox } from "@react-aria/listbox";
import { Option } from "./option";
import { useTranslations } from "next-intl";

interface ListBoxProps extends AriaListBoxOptions<unknown> {
  listBoxRef?: React.RefObject<HTMLUListElement>;
  state: ListState<unknown>;
}

export function ListBox(props: ListBoxProps) {
  const ref = React.useRef<HTMLUListElement>(null);
  const { listBoxRef = ref, state } = props;
  const { listBoxProps } = useListBox(props, state, listBoxRef);
  const t = useTranslations("Common");

  return (
    <ul {...listBoxProps} ref={listBoxRef} className="max-h-72 overflow-auto outline-none">
      {state.collection.size <= 0 ? (
        <li className="text-center text-sm dark:text-gray-400 text-neutral-700">
          {t("noOptions")}
        </li>
      ) : (
        [...state.collection].map((item) => <Option key={item.key} item={item} state={state} />)
      )}
    </ul>
  );
}
