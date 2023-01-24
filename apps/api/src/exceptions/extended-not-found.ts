import type { ResponseErrorObject } from "@tsed/common";
import { NotFound } from "@tsed/exceptions";

export class ExtendedNotFound extends NotFound implements ResponseErrorObject {
  headers = {};
  errors = {};

  constructor(errors: Record<string, string>, message = "notFound") {
    super(message);
    this.errors = errors;
  }
}
