import { BadRequestException } from "@nestjs/common";

interface ErrorMessage {
  message: string;
  data: Record<string, unknown>;
}

export class ExtendedBadRequest extends BadRequestException {
  headers = {};
  errors = {};

  constructor(errors: Record<string, string | ErrorMessage>, message = "badRequest") {
    super(errors, { description: message });
    this.errors = errors;
  }
}
