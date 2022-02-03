import type { PlatformMulterFile } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";

export function parseImportFile(file: PlatformMulterFile) {
  if (file.mimetype !== "application/json") {
    throw new BadRequest("invalidImageType");
  }

  const rawBody = file.buffer.toString("utf8").trim();
  let body = null;

  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }

  if (!body) {
    throw new BadRequest("couldNotParseBody");
  }

  return body;
}
