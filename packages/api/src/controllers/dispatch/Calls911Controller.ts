// import { Controller } from "@tsed/di";
// import { JsonRequestBody, Post } from "@tsed/schema";
// import { CREATE_911_CALL, validate } from "@snailycad/schemas";
// import { BodyParams } from "@tsed/platform-params";
// import { BadRequest } from "@tsed/exceptions";

// @Controller("/911-calls")
// export class Calls911Controller {
//   @Post("/")
//   async create911Call(@BodyParams() body: JsonRequestBody) {
//     const error = validate(CREATE_911_CALL, body.toJSON(), true);
//     if (error) {
//       throw new BadRequest(error);
//     }
//   }
// }

// todo
export {};
