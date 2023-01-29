import { customAlphabet } from "nanoid";

interface Options {
  extraChars?: string;
  type: "letters-only" | "numbers-only" | "all";
}

const NUMBERS = "0123456789";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateString(length: number, options?: Options) {
  const { type = "all", extraChars = "" } = options ?? {};
  const alphabet = [];

  if (type === "numbers-only") {
    alphabet.push(...NUMBERS);
  } else if (type === "letters-only") {
    alphabet.push(...LETTERS);
  } else {
    alphabet.push(...NUMBERS, ...LETTERS);
  }

  const generate = customAlphabet([...alphabet, extraChars].join(""));
  return generate(length);
}
