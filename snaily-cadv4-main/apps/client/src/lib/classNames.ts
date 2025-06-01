export function classNames(...classes: (string | number | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
