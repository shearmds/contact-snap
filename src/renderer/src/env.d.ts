/// <reference types="vite/client" />

interface GlazeIPC {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  disconnect(): void;
}

interface Window {
  glazeAPI: {
    glaze: {
      ipc: GlazeIPC;
    };
  };
}
