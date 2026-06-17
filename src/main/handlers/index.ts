import { registerContactsHandlers } from "./contacts";
import { registerScreenCaptureHandlers } from "./screen-capture";
import { registerSettingsHandlers } from "./settings";

export function registerHandlers(): void {
  registerContactsHandlers();
  registerScreenCaptureHandlers();
  registerSettingsHandlers();
}
