import { ResponseErrorObject } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";

export class ExtendedBadRequest extends BadRequest implements ResponseErrorObject {
  headers = {};
  errors = {};

  constructor(errors: Record<string, string>, message = "badRequest") {
    super(message);
    this.errors = errors;
  }
}
