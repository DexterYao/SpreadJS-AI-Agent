export { ErrorLogger } from "./error-logger";
export type { ErrorLogEntry, ErrorLevel, ErrorSource } from "./types";

import { ErrorLogger } from "./error-logger";

/** 全局单例 — 所有服务端模块共用 */
export const errorLogger = new ErrorLogger();
