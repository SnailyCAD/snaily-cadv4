interface Options {
  extraChars?: string;
  numbersOnly?: boolean;
}

const NUMBERS = "0123456789";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateString(length: number, options?: Options) {
  const { numbersOnly, extraChars = "" } = options ?? {};

  let chars = "";

  if (numbersOnly) {
    chars = NUMBERS;
  } else {
    chars = LETTERS + NUMBERS;
  }

  let result = "";
  const allChars = chars + extraChars;

  for (let i = 0; i < length; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return result;
}
