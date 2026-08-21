import { DW_EMBEDDED_FORECAST } from "./dw-embedded-forecast.js?v=20260821-embedded-july-v1";
import { DW_EMBEDDED_FINANCE } from "./dw-embedded-finance.js?v=20260821-embedded-july-v1";
import { DW_EMBEDDED_ACTUAL } from "./dw-embedded-actual.js?v=20260821-embedded-july-v1";

export const DW_EMBEDDED_FILES = [DW_EMBEDDED_FORECAST, DW_EMBEDDED_FINANCE, DW_EMBEDDED_ACTUAL];

export function embeddedWorkbookFile(record) {
  const binary = atob(record.base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], record.name, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
