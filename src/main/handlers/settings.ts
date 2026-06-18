import { ipcMain, globalShortcut, app } from "electron";
import { settingsService } from "../services/settings";

const DEFAULT_HOTKEY = "Shift+Alt+N";
const HOTKEY_SETTINGS_KEY = "globalHotkey";

let currentHotkey: string | null = null;
let hotkeyCallback: (() => void) | null = null;

function applyHotkey(accelerator: string): boolean {
  if (currentHotkey) {
    globalShortcut.unregister(currentHotkey);
    currentHotkey = null;
  }
  if (!accelerator || !hotkeyCallback) return false;

  const success = globalShortcut.register(accelerator, hotkeyCallback);
  if (success) {
    currentHotkey = accelerator;
  }
  return success;
}

export function initGlobalHotkey(callback: () => void): void {
  hotkeyCallback = callback;
  const saved = settingsService.get<string>(HOTKEY_SETTINGS_KEY, DEFAULT_HOTKEY);
  if (saved) {
    applyHotkey(saved);
  }
}

export async function teardownGlobalHotkey(): Promise<void> {
  if (currentHotkey) {
    globalShortcut.unregister(currentHotkey);
    currentHotkey = null;
  }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle("settings:get-launch-at-login", (): { openAtLogin: boolean } => {
    return { openAtLogin: app.getLoginItemSettings().openAtLogin };
  });

  ipcMain.handle(
    "settings:set-launch-at-login",
    (_event, params: { openAtLogin: boolean }): { success: boolean } => {
      app.setLoginItemSettings({ openAtLogin: params.openAtLogin });
      return { success: true };
    },
  );

  ipcMain.handle("settings:get-hotkey", (): { hotkey: string } => {
    const hotkey = settingsService.get<string>(HOTKEY_SETTINGS_KEY, DEFAULT_HOTKEY);
    return { hotkey: hotkey ?? DEFAULT_HOTKEY };
  });

  ipcMain.handle(
    "settings:set-hotkey",
    async (
      _event,
      params: { hotkey: string },
    ): Promise<{ success: boolean; error?: string }> => {
      if (!params.hotkey || typeof params.hotkey !== "string") {
        return { success: false, error: "Hotkey is required." };
      }
      const success = applyHotkey(params.hotkey);
      if (!success) {
        return {
          success: false,
          error: "Could not register that shortcut — it may be in use by another app.",
        };
      }
      await settingsService.set(HOTKEY_SETTINGS_KEY, params.hotkey);
      return { success: true };
    },
  );
}
