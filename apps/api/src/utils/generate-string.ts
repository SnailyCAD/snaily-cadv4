import { customAlphabet } from "nanoid";

interface Options {
  extraChars?: string;
  numbersOnly?: boolean;
}

const NUMBERS = "0123456789";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateString(length: number, options?: Options) {
  const { numbersOnly, extraChars = "" } = options ?? {};
  const alphabet = [...NUMBERS];

  if (!numbersOnly) {
    alphabet.push(...LETTERS);
  }

  const generate = customAlphabet([...alphabet, extraChars].join(""));
  return generate(length);
}
