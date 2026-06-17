/**
 * Settings persisted as JSON in the Electron userData directory.
 * app.getPath('userData') is synchronous in Electron (unlike Glaze).
 */

import { app } from "electron";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

interface SettingsData {
  [key: string]: unknown;
}

class SettingsService {
  private cache: SettingsData | null = null;
  private readonly settingsPath: string;

  constructor() {
    const userDataPath = app.getPath("userData");
    fs.mkdirSync(userDataPath, { recursive: true });
    this.settingsPath = path.join(userDataPath, "settings.json");
  }

  private load(): void {
    if (this.cache !== null) return;
    try {
      const data = fs.readFileSync(this.settingsPath, "utf-8");
      this.cache = JSON.parse(data) as SettingsData;
    } catch {
      this.cache = {};
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    this.load();
    const value = this.cache![key];
    return (value as T) ?? defaultValue;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.load();
    this.cache![key] = value;
    await fsPromises.writeFile(this.settingsPath, JSON.stringify(this.cache, null, 2), "utf-8");
  }
}

export const settingsService = new SettingsService();
