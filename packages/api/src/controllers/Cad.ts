import { Controller } from "@tsed/di";
import { Get } from "@tsed/schema";

@Controller("/cad")
export class CadController {
  @Get()
  getCadInfo() {
    return "TODO";
  }
}
