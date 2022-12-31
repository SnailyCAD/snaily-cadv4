export function prefixNumber(id: number, depth: number) {
  const stringifiedId = id.toString();
  const newId = [stringifiedId];

  for (let i = 0; i <= depth; i++) {
    if (stringifiedId.length < i) {
      newId.unshift("0");
    }
  }

  return newId.join("");
}
