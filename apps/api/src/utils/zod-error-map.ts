import { getTranslator } from "utils/get-translator";
import { ErrorMapCtx, util, ZodIssueCode, ZodIssueOptionalMessage, ZodParsedType } from "zod";

export async function getErrorMap(locale?: string) {
  const t = await getTranslator({
    locale: locale ?? "en",
    namespace: "ErrorMessages",
    type: "error-messages",
  });

  return function errorMap(issue: ZodIssueOptionalMessage, _ctx: ErrorMapCtx) {
    let message: string;

    switch (issue.code) {
      case ZodIssueCode.invalid_type: {
        if (issue.received === ZodParsedType.undefined) {
          message = t("required");
        } else {
          message = t("expectedReceived", { expected: issue.expected, received: issue.received });
        }
        break;
      }
      case ZodIssueCode.invalid_literal: {
        message = `Invalid literal value, expected ${JSON.stringify(
          issue.expected,
          util.jsonStringifyReplacer,
        )}`;
        break;
      }
      case ZodIssueCode.unrecognized_keys: {
        message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
        break;
      }
      case ZodIssueCode.invalid_union: {
        message = t("invalidInput");
        break;
      }
      case ZodIssueCode.invalid_union_discriminator: {
        message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
        break;
      }
      case ZodIssueCode.invalid_enum_value: {
        message = t("invalidEnumValue", {
          expected: util.joinValues(issue.options),
          received: issue.received,
        });
        break;
      }
      case ZodIssueCode.invalid_arguments: {
        message = "Invalid function arguments";
        break;
      }
      case ZodIssueCode.invalid_return_type: {
        message = "Invalid function return type";
        break;
      }
      case ZodIssueCode.invalid_date: {
        message = t("invalidDate");
        break;
      }
      case ZodIssueCode.invalid_string: {
        if (typeof issue.validation === "object") {
          if ("startsWith" in issue.validation) {
            message = t("invalidStringStartWith", {
              expected: issue.validation.startsWith,
            });
          } else if ("endsWith" in issue.validation) {
            message = t("invalidStringEndWith", {
              expected: issue.validation.endsWith,
            });
          } else {
            util.assertNever({} as never);
          }
        } else if (issue.validation !== "regex") {
          message = t("invalidRegex", {
            expected: issue.validation,
          });
        } else {
          message = t("invalid");
        }
        break;
      }
      case ZodIssueCode.too_small: {
        if (issue.type === "array") {
          const errorMessage = issue.exact
            ? "arrayExactly"
            : issue.inclusive
            ? "arrayAtLeast"
            : "arrayMoreThan";

          message = t(errorMessage, {
            expected: issue.minimum as number,
          });
        } else if (issue.type === "string") {
          const errorMessage = issue.exact
            ? "stringExactlyCharacters"
            : issue.inclusive
            ? "stringAtLeastCharacters"
            : "stringOverCharacters";

          message = t(errorMessage, {
            expected: issue.minimum as number,
          });
        } else if (issue.type === "number") {
          const errorMessage = issue.exact
            ? "numberExactly"
            : issue.inclusive
            ? "numberGreaterThanOrEquals"
            : "numberGreaterThan";

          message = t(errorMessage, {
            expected: issue.minimum as number,
          });
        } else if (issue.type === "date") {
          const errorMessage = issue.exact
            ? "dateExactly"
            : issue.inclusive
            ? "dateGreaterThanOrEquals"
            : "dateGreaterThan";

          message = t(errorMessage, {
            expected: new Date(issue.minimum as number).toDateString(),
          });
        } else {
          message = t("invalidDate");
        }
        break;
      }
      case ZodIssueCode.too_big: {
        if (issue.type === "array") {
          const errorMessage = issue.exact
            ? "arrayExactly"
            : issue.inclusive
            ? "arrayAtMost"
            : "arrayUnder";

          message = t(errorMessage, {
            expected: issue.maximum as number,
          });
        } else if (issue.type === "string") {
          const errorMessage = issue.exact
            ? "stringExactlyCharacters"
            : issue.inclusive
            ? "stringAtMostCharacters"
            : "stringUnderCharacters";

          message = t(errorMessage, {
            expected: issue.maximum as number,
          });
        } else if (issue.type === "number") {
          const errorMessage = issue.exact
            ? "numberExactly"
            : issue.inclusive
            ? "numberSmallerThanOrEquals"
            : "numberSmallerThan";

          message = t(errorMessage, {
            expected: issue.maximum as number,
          });
        } else if (issue.type === "date") {
          const errorMessage = issue.exact
            ? "dateExactly"
            : issue.inclusive
            ? "dateSmallerThanOrEquals"
            : "dateSmallerThan";

          message = t(errorMessage, {
            expected: new Date(issue.maximum as number).toLocaleString(),
          });
        } else {
          message = t("invalidDate");
        }
        break;
      }
      case ZodIssueCode.custom: {
        message = t("invalidInput");
        break;
      }
      case ZodIssueCode.invalid_intersection_types: {
        message = "Intersection results could not be merged";
        break;
      }
      case ZodIssueCode.not_multiple_of: {
        message = `Number must be a multiple of ${issue.multipleOf}`;
        break;
      }
      case ZodIssueCode.not_finite: {
        message = t("finiteNumber");
        break;
      }
      default: {
        message = _ctx.defaultError;
        util.assertNever(issue);
      }
    }

    return { message };
  };
}
