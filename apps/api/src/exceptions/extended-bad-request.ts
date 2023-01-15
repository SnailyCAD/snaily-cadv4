import type { ResponseErrorObject } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";

interface ErrorMessage {
  message: string;
  data: Record<string, any>;
}

export class ExtendedBadRequest extends BadRequest implements ResponseErrorObject {
  headers = {};
  errors = {};

  constructor(errors: Record<string, string | ErrorMessage>, message = "badRequest") {
    super(message);
    this.errors = errors;
  }
}
