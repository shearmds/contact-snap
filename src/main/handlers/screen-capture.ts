import { ipcMain } from "electron";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function registerScreenCaptureHandlers(): void {
  ipcMain.handle("screen-capture:interactive", async () => {
    const dir = await mkdtemp(join(tmpdir(), "contact-snap-"));
    const filePath = join(dir, "capture.png");

    return new Promise<{ imageBase64: string | null }>((resolve, reject) => {
      execFile("screencapture", ["-i", "-x", filePath], async (err) => {
        if (err) {
          try { await rmdir(dir); } catch { /* ignore */ }
          resolve({ imageBase64: null });
          return;
        }
        try {
          const data = await readFile(filePath);
          await unlink(filePath);
          await rmdir(dir);
          resolve({ imageBase64: data.toString("base64") });
        } catch (readErr) {
          reject(new Error("Failed to read screen capture file"));
        }
      });
    });
  });
}
