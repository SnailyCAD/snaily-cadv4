import type { SelectFieldProps, SelectValue } from "../../components/fields/select-field";

type Options<T extends SelectValue> = Pick<SelectFieldProps<T>, "selectedKey" | "selectedKeys">;

export function getSelectedKeyOrKeys<T extends SelectValue>(props: Options<T>) {
  if (typeof props.selectedKey === "undefined" && typeof props.selectedKeys === "undefined") {
    return [];
  }

  // eslint-disable-next-line eqeqeq
  if (props.selectedKey != null) {
    if (props.selectedKey.toString().trim().length <= 0) {
      return [];
    }

    return [props.selectedKey];
  }

  if (props.selectedKey === null) {
    return [];
  }

  if (props.selectedKeys === "all") {
    return "all";
  }

  if (props.selectedKeys instanceof Set) {
    return props.selectedKeys;
  }

  if (Array.isArray(props.selectedKeys)) {
    return props.selectedKeys;
  }

  return [props.selectedKeys];
}
