import { generateString } from "../utils/generate-string";

interface GenerateLicenseNumberOptions {
  template?: string | null;
  length: number;
}

export function generateLicenseNumber(options: GenerateLicenseNumberOptions) {
  if (!options.template) {
    return generateString(options.length, { type: "numbers-only" });
  }

  let licenseNumber = options.template;

  const regex = /{(\w+)(?:\/(\d+))?}/g;
  const matches = options.template.matchAll(regex);

  for (const match of matches) {
    const [regex, type, _length] = match as [string, string, string];
    const length = parseInt(_length, 10);

    if (type === "letter") {
      const randomLetter = generateString(length, { type: "letters-only" });

      licenseNumber = licenseNumber.replace(regex, randomLetter);
    }

    if (type === "number") {
      const randomNumber = generateString(length, { type: "numbers-only" });

      licenseNumber = licenseNumber.replace(regex, randomNumber);
    }
  }

  return licenseNumber;
}
