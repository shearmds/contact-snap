import { app, BrowserWindow, Menu, Tray, nativeImage, shell } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { registerHandlers } from "./handlers/index";
import { initGlobalHotkey, teardownGlobalHotkey } from "./handlers/settings";

registerHandlers();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let creating: Promise<void> | null = null;

async function showMainWindow(): Promise<void> {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  if (creating) {
    await creating;
    mainWindow?.show();
    return;
  }
  creating = createMainWindow().finally(() => {
    creating = null;
  });
  await creating;
}

async function createMainWindow(): Promise<void> {
  if (mainWindow && !mainWindow.isDestroyed()) return;

  mainWindow = new BrowserWindow({
    width: 520,
    height: 480,
    minWidth: 500,
    minHeight: 456,
    title: "Snap2Contact",
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function setupApplicationMenu(): void {
  const menu = Menu.buildFromTemplate([
    {
      label: "Snap2Contact",
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Settings…",
          accelerator: "Command+,",
          click: () => {
            mainWindow?.webContents.send("open-settings");
          },
        },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ]);
  Menu.setApplicationMenu(menu);
}

function setupTray(): void {
  const iconPath = is.dev
    ? join(__dirname, "../../resources/tray-icon.png")
    : join(process.resourcesPath, "tray-icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Quit Snap2Contact", click: () => app.quit() },
  ]);

  tray = new Tray(icon);
  tray.setToolTip("Snap2Contact");
  tray.on("click", () => showMainWindow());
  tray.on("right-click", () => tray?.popUpContextMenu(contextMenu));
}

app.on("window-all-closed", () => {
  // Keep alive in menu bar
});

app.on("activate", async () => {
  await app.dock.hide();
  if (!mainWindow || mainWindow.isDestroyed()) {
    await showMainWindow();
  }
});

app.on("before-quit", async () => {
  await teardownGlobalHotkey();
  tray?.destroy();
});

app.whenReady().then(async () => {
  await app.dock.hide();
  setupApplicationMenu();
  setupTray();
  initGlobalHotkey(() => showMainWindow());
});
