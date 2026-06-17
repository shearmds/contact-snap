import { contextBridge, ipcRenderer } from "electron";

/**
 * Expose the same window.glazeAPI.glaze.ipc.invoke shape as the Glaze version
 * so the renderer code needs no IPC-related changes.
 */
const api = {
  glaze: {
    ipc: {
      invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> =>
        ipcRenderer.invoke(channel, ...args) as Promise<T>,
      disconnect: (): void => { /* no-op in Electron */ },
    },
  },
};

contextBridge.exposeInMainWorld("glazeAPI", api);

// Listen for main-process notifications (e.g. Cmd+, to open settings)
ipcRenderer.on("open-settings", () => {
  window.dispatchEvent(new CustomEvent("open-settings"));
});
