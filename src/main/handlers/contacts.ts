import { ipcMain } from "electron";
import { geminiService } from "../services/gemini";
import { contactsService } from "../services/contacts";

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

export function registerContactsHandlers(): void {
  ipcMain.handle(
    "contacts:extract",
    async (_event, params: { imageBase64: string }): Promise<{ contact: ContactInfo }> => {
      if (!params.imageBase64 || typeof params.imageBase64 !== "string") {
        throw new Error("imageBase64 is required and must be a non-empty string.");
      }
      const contact = await geminiService.extractContact(params.imageBase64);
      return { contact };
    },
  );

  ipcMain.handle(
    "contacts:extract-text",
    async (_event, params: { text: string }): Promise<{ contact: ContactInfo }> => {
      if (!params.text || typeof params.text !== "string") {
        throw new Error("text is required and must be a non-empty string.");
      }
      const contact = await geminiService.extractContactFromText(params.text);
      return { contact };
    },
  );

  ipcMain.handle(
    "contacts:save",
    async (
      _event,
      params: { contact: ContactInfo },
    ): Promise<{ success: boolean; error?: string }> => {
      if (!params.contact || typeof params.contact !== "object") {
        return { success: false, error: "contact object is required." };
      }
      return contactsService.save(params.contact);
    },
  );
}
