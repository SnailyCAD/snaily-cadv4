export function classNames(...classes: (string | boolean | number | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
