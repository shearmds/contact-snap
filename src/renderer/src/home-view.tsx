import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Toolbar,
  ToolbarContent,
  ToolbarTitle,
  ToolbarActions,
} from "./components/ui/toolbar";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "./components/ui/dialog";
import {
  EmptyState,
  EmptyStateMedia,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
} from "./components/ui/empty-state";
import { Separator } from "./components/ui/separator";
import { toast } from "sonner";
import { cn } from "./lib/utils";
import { CameraIcon, ScissorsIcon, SettingsIcon, Loader2Icon, ContactIcon, TypeIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactInfo {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  note: string;
}

type AppState = "capture" | "processing" | "review";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyContact(): ContactInfo {
  return {
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    note: "",
  };
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function stripDataUriPrefix(dataUri: string): string {
  return dataUri.replace(/^data:image\/\w+;base64,/, "");
}

// ---------------------------------------------------------------------------
// Hotkey helpers
// ---------------------------------------------------------------------------

function keyEventToAccelerator(e: KeyboardEvent): string | null {
  const code = e.code;
  if (/^(Shift|Control|Alt|Meta)(Left|Right)$/.test(code)) return null;

  const parts: string[] = [];
  if (e.metaKey) parts.push("Command");
  if (e.ctrlKey) parts.push("Control");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (parts.length === 0) return null;

  let key: string | null = null;
  if (code.startsWith("Key")) {
    key = code.slice(3);
  } else if (code.startsWith("Digit")) {
    key = code.slice(5);
  } else {
    const codeMap: Record<string, string> = {
      Space: "Space", ArrowUp: "Up", ArrowDown: "Down",
      ArrowLeft: "Left", ArrowRight: "Right",
      Backspace: "Backspace", Delete: "Delete",
      Enter: "Return", Escape: "Escape", Tab: "Tab",
      Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]",
      Backslash: "\\", Semicolon: ";", Quote: "'",
      Comma: ",", Period: ".", Slash: "/", Backquote: "`",
      F1: "F1", F2: "F2", F3: "F3", F4: "F4",
      F5: "F5", F6: "F6", F7: "F7", F8: "F8",
      F9: "F9", F10: "F10", F11: "F11", F12: "F12",
    };
    key = codeMap[code] ?? null;
  }

  if (!key) return null;
  parts.push(key);
  return parts.join("+");
}

function formatAccelerator(acc: string): string {
  return acc
    .replace(/Command\+?/g, "⌘")
    .replace(/Control\+?/g, "⌃")
    .replace(/Alt\+?/g, "⌥")
    .replace(/Shift\+?/g, "⇧")
    .replace(/\+/g, "");
}

// ---------------------------------------------------------------------------
// Settings Dialog
// ---------------------------------------------------------------------------

function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [hotkey, setHotkey] = useState("");
  const [recording, setRecording] = useState(false);
  const [hotkeyError, setHotkeyError] = useState("");
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRecording(false);
    setHotkeyError("");

    (async () => {
      try {
        const [hotkeyResult, loginResult] = await Promise.all([
          window.glazeAPI.glaze.ipc.invoke<{ hotkey: string }>("settings:get-hotkey"),
          window.glazeAPI.glaze.ipc.invoke<{ openAtLogin: boolean }>("settings:get-launch-at-login"),
        ]);
        setHotkey(hotkeyResult.hotkey);
        setLaunchAtLogin(loginResult.openAtLogin);
      } catch (err) {
        console.error("[Settings:load] Failed to load settings", err);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!recording) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const acc = keyEventToAccelerator(e);
      if (acc) {
        setHotkey(acc);
        setRecording(false);
        setHotkeyError("");
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [recording]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    setHotkeyError("");
    try {
      if (hotkey) {
        const hotkeyResult = await window.glazeAPI.glaze.ipc.invoke<{
          success: boolean;
          error?: string;
        }>("settings:set-hotkey", { hotkey });

        if (!hotkeyResult.success) {
          setHotkeyError(hotkeyResult.error ?? "Failed to register shortcut");
          setLoading(false);
          return;
        }
      }

      await window.glazeAPI.glaze.ipc.invoke("settings:set-launch-at-login", { openAtLogin: launchAtLogin });
      toast.success("Settings saved");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save settings");
      console.error("[Settings:save] Error", err);
    } finally {
      setLoading(false);
    }
  }, [hotkey, launchAtLogin, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API key and global shortcut.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <div>
            <Label className="text-bodyEmphasized block mb-2">
              Global Shortcut
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "flex-1 h-9 rounded-md border px-3 text-left text-body",
                  "focus:outline-none transition-colors",
                  recording
                    ? "border-blue-9 bg-blue-a2 text-blue-11"
                    : "border-gray-a6 bg-gray-a2 text-gray-12",
                )}
                onClick={() => {
                  setRecording(true);
                  setHotkeyError("");
                }}
              >
                {recording ? (
                  <span className="text-blue-11 animate-pulse">Press a shortcut...</span>
                ) : hotkey ? (
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-bodyEmphasized">{formatAccelerator(hotkey)}</span>
                    <span className="text-footnote text-gray-9">{hotkey}</span>
                  </span>
                ) : (
                  <span className="text-gray-9">Click to set...</span>
                )}
              </button>
              {hotkey && !recording && (
                <Button
                  variant="filled"
                  onClick={() => {
                    setRecording(true);
                    setHotkeyError("");
                  }}
                >
                  Change
                </Button>
              )}
            </div>
            {hotkeyError && (
              <p className="text-caption1 text-red-10 mt-1.5">{hotkeyError}</p>
            )}
            <p className="text-caption2 text-gray-9 mt-1.5">
              Opens Snap2Contact from anywhere on your Mac.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-bodyEmphasized text-gray-12">Launch at Login</p>
              <p className="text-caption2 text-gray-9 mt-0.5">Open Contact Snap automatically when you log in.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={launchAtLogin}
              onClick={() => setLaunchAtLogin((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-150 focus:outline-none",
                launchAtLogin ? "bg-blue-9" : "bg-gray-a6",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 transform transition-transform duration-150",
                  launchAtLogin ? "translate-x-4.5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="filled">Cancel</Button>
          </DialogClose>
          <Button
            variant="accent"
            onClick={handleSave}
            disabled={loading}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Drop Zone (State 1: Capture)
// ---------------------------------------------------------------------------

function CaptureView({
  onImageCaptured,
}: {
  onImageCaptured: (dataUri: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenCapture = useCallback(async () => {
    setCapturing(true);
    try {
      const result = await window.glazeAPI.glaze.ipc.invoke<{
        imageBase64: string | null;
      }>("screen-capture:interactive");

      if (result.imageBase64) {
        onImageCaptured(`data:image/png;base64,${result.imageBase64}`);
      }
    } catch (err) {
      toast.error("Screen capture failed");
      console.error("[HomeView:screenCapture] Error", err);
    } finally {
      setCapturing(false);
    }
  }, [onImageCaptured]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      fileToBase64(file).then(onImageCaptured);
    },
    [onImageCaptured],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      fileToBase64(file).then(onImageCaptured);
      e.target.value = "";
    },
    [onImageCaptured],
  );

  return (
    <div
      className={cn(
        "flex-1 flex items-center justify-center px-6 py-4",
        "transition-colors duration-150",
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-xl border-2 border-dashed py-14 px-10 text-center",
          "transition-colors duration-150",
          isDragOver
            ? "border-blue-9 bg-blue-a3"
            : "border-gray-a6 bg-gray-a2",
        )}
      >
        <EmptyState placement="inline">
          <EmptyStateMedia>
            <CameraIcon className="w-12 h-12 text-gray-9" />
          </EmptyStateMedia>
          <EmptyStateTitle>
            Drop, paste, or select a contact photo
          </EmptyStateTitle>
          <EmptyStateDescription>
            <span className="flex items-center justify-center gap-3 my-3">
              <Separator className="flex-1" />
              <span className="text-gray-9 text-footnote">or</span>
              <Separator className="flex-1" />
            </span>
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button
              variant="accent"
              onClick={handleScreenCapture}
              disabled={capturing}
            >
              {capturing ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin text-gray-1" />
                  Waiting...
                </>
              ) : (
                <>
                  <ScissorsIcon className="w-4 h-4 text-gray-1" />
                  Take Screenshot
                </>
              )}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </EmptyStateActions>
        </EmptyState>
        <p className="text-gray-9 text-footnote mt-4">
          Cmd+V to paste an image or text from clipboard
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/heic"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Processing View (State 2)
// ---------------------------------------------------------------------------

function ProcessingView({
  imageDataUri,
  pastedText,
}: {
  imageDataUri: string;
  pastedText: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
      {imageDataUri ? (
        <img
          src={imageDataUri}
          alt="Captured contact"
          className="max-h-[300px] max-w-full rounded-lg object-contain shadow-md"
        />
      ) : pastedText ? (
        <div className="max-w-sm w-full rounded-lg bg-gray-a2 border border-gray-a4 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TypeIcon className="w-4 h-4 text-gray-9" />
            <span className="text-footnote text-gray-9">Pasted text</span>
          </div>
          <p className="text-body text-gray-12 whitespace-pre-wrap line-clamp-6">
            {pastedText}
          </p>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <Loader2Icon className="w-5 h-5 animate-spin text-blue-10" />
        <span className="text-body text-gray-11">
          Extracting contact info...
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review View (State 3)
// ---------------------------------------------------------------------------

function ReviewView({
  imageDataUri,
  contact,
  onContactChange,
}: {
  imageDataUri: string;
  contact: ContactInfo;
  onContactChange: (c: ContactInfo) => void;
}) {
  const updateField = (field: keyof ContactInfo, value: string) => {
    onContactChange({ ...contact, [field]: value });
  };

  return (
    <div className="px-6 py-4 space-y-3">
      {imageDataUri && (
        <img
          src={imageDataUri}
          alt="Contact photo"
          className="h-16 rounded-lg object-contain"
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName" className="text-footnote text-gray-11 block mb-1">First Name</Label>
          <Input id="firstName" value={contact.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="First name" />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-footnote text-gray-11 block mb-1">Last Name</Label>
          <Input id="lastName" value={contact.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Last name" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="company" className="text-footnote text-gray-11 block mb-1">Company</Label>
          <Input id="company" value={contact.company} onChange={(e) => updateField("company", e.target.value)} placeholder="Company" />
        </div>
        <div>
          <Label htmlFor="jobTitle" className="text-footnote text-gray-11 block mb-1">Job Title</Label>
          <Input id="jobTitle" value={contact.jobTitle} onChange={(e) => updateField("jobTitle", e.target.value)} placeholder="Job title" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="email" className="text-footnote text-gray-11 block mb-1">Email</Label>
          <Input id="email" type="email" value={contact.email} onChange={(e) => updateField("email", e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <Label htmlFor="phone" className="text-footnote text-gray-11 block mb-1">Phone</Label>
          <Input id="phone" type="tel" value={contact.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-footnote text-gray-11 block mb-1">Address</Label>
        <Input id="address" value={contact.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Street address, city, state, zip" />
      </div>

      <div>
        <Label htmlFor="website" className="text-footnote text-gray-11 block mb-1">Website</Label>
        <Input id="website" type="url" value={contact.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://example.com" />
      </div>

      <div>
        <Label htmlFor="note" className="text-footnote text-gray-11 block mb-1">Notes</Label>
        <Textarea id="note" value={contact.note} onChange={(e) => updateField("note", e.target.value)} placeholder="Where you met, mutual contacts, anything to remember…" rows={2} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home View
// ---------------------------------------------------------------------------

export function HomeView() {
  const [appState, setAppState] = useState<AppState>("capture");
  const [imageDataUri, setImageDataUri] = useState<string>("");
  const [pastedText, setPastedText] = useState<string>("");
  const [contact, setContact] = useState<ContactInfo>(emptyContact());
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Open settings when triggered via Cmd+, in the app menu
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener("open-settings", handler);
    return () => window.removeEventListener("open-settings", handler);
  }, []);

  const resetToCapture = useCallback(() => {
    setAppState("capture");
    setImageDataUri("");
    setPastedText("");
    setContact(emptyContact());
  }, []);

  const extractContact = useCallback(
    async (dataUri: string) => {
      setImageDataUri(dataUri);
      setAppState("processing");

      const base64 = stripDataUriPrefix(dataUri);
      try {
        const result = await window.glazeAPI.glaze.ipc.invoke<{
          contact: ContactInfo;
        }>("contacts:extract", { imageBase64: base64 });
        setContact(result.contact);
        setAppState("review");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to extract contact info";
        toast.error(message);
        resetToCapture();
      }
    },
    [resetToCapture],
  );

  const extractContactFromText = useCallback(
    async (text: string) => {
      setPastedText(text);
      setAppState("processing");

      try {
        const result = await window.glazeAPI.glaze.ipc.invoke<{
          contact: ContactInfo;
        }>("contacts:extract-text", { text });
        setContact(result.contact);
        setAppState("review");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to extract contact info";
        toast.error(message);
        resetToCapture();
      }
    },
    [resetToCapture],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await window.glazeAPI.glaze.ipc.invoke<{
        success: boolean;
        error?: string;
      }>("contacts:save", { contact });

      if (result.success) {
        toast.success(`Saved ${contact.firstName} ${contact.lastName} to Contacts`);
        setTimeout(resetToCapture, 1200);
      } else {
        toast.error(result.error ?? "Failed to save contact");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save contact";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [contact, resetToCapture]);

  const handleImageCaptured = useCallback(
    (dataUri: string) => extractContact(dataUri),
    [extractContact],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (appState !== "capture") return;
      // Let paste work normally inside input/textarea fields
      const tag = (e.target as Element)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;
          fileToBase64(blob).then(handleImageCaptured);
          return;
        }
      }

      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (text && text.length > 2) {
        e.preventDefault();
        extractContactFromText(text);
      }
    },
    [appState, handleImageCaptured, extractContactFromText],
  );

  const pasteRef = useRef(handlePaste);
  pasteRef.current = handlePaste;

  useEffect(() => {
    const listener = (e: ClipboardEvent) => pasteRef.current(e);
    document.addEventListener("paste", listener);
    return () => document.removeEventListener("paste", listener);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <ScrollArea
        toolbar={
          <Toolbar>
            <ToolbarContent>
              <ToolbarTitle>{/* drag region */}</ToolbarTitle>
            </ToolbarContent>
            <ToolbarActions>
              <Button
                variant="glass"
                size="large"
                iconOnly
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsIcon className="size-4.5 text-gray-11" />
              </Button>
            </ToolbarActions>
          </Toolbar>
        }
      >
        <div
          style={{ background: "linear-gradient(to bottom, var(--blue-a3), transparent)" }}
          className="px-6 pt-4 pb-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-9">
              <ContactIcon className="w-5 h-5 text-gray-1" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-gray-12">Snap2Contact</h1>
              <p className="text-[12px] text-gray-9">
                {appState === "capture" && "Capture contact info from an image or text"}
                {appState === "processing" && "Analyzing image..."}
                {appState === "review" && "Review and save to Contacts"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          {appState === "capture" && (
            <CaptureView onImageCaptured={handleImageCaptured} />
          )}
          {appState === "processing" && (
            <ProcessingView imageDataUri={imageDataUri} pastedText={pastedText} />
          )}
          {appState === "review" && (
            <ReviewView
              imageDataUri={imageDataUri}
              contact={contact}
              onContactChange={setContact}
            />
          )}
        </div>
      </ScrollArea>

      {appState === "review" && (
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-a4">
          <Button variant="filled" onClick={resetToCapture} disabled={saving}>
            Start Over
          </Button>
          <Button variant="accent" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin text-gray-1" />
                Saving...
              </>
            ) : (
              "Save to Contacts"
            )}
          </Button>
        </div>
      )}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
