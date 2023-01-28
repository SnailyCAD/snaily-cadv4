export * from "./auth";
export * from "./citizen";
export * from "./admin/values";
export * from "./admin/values/import";
export * from "./admin";
export * from "./bleeter";
export * from "./tow";
export * from "./businesses";
export * from "./dispatch";
export * from "./leo";
export * from "./records";
export * from "./ems-fd";
export * from "./truck-log";
export * from "./court";

// set custom error map for zod translations
import { setErrorMap } from "zod";
import errorMap from "./error-map";
setErrorMap(errorMap);
