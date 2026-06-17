import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface ContactInfo {
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

function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildAppleScript(contact: ContactInfo): string {
  const first = escapeAppleScript(contact.firstName);
  const last = escapeAppleScript(contact.lastName);
  const company = escapeAppleScript(contact.company);
  const jobTitle = escapeAppleScript(contact.jobTitle);
  const email = escapeAppleScript(contact.email);
  const phone = escapeAppleScript(contact.phone);
  const address = escapeAppleScript(contact.address);
  const website = escapeAppleScript(contact.website);
  const note = escapeAppleScript(contact.note);

  const lines: string[] = [];
  lines.push('tell application "Contacts" to activate');
  lines.push('tell application "Contacts"');
  lines.push(`  set newPerson to make new person with properties {first name:"${first}", last name:"${last}"}`);
  if (contact.company) lines.push(`  set organization of newPerson to "${company}"`);
  if (contact.jobTitle) lines.push(`  set job title of newPerson to "${jobTitle}"`);
  if (contact.email) lines.push(`  make new email at end of emails of newPerson with properties {label:"work", value:"${email}"}`);
  if (contact.phone) lines.push(`  make new phone at end of phones of newPerson with properties {label:"work", value:"${phone}"}`);
  if (contact.address) lines.push(`  make new address at end of addresses of newPerson with properties {label:"work", street:"${address}"}`);
  if (contact.website) lines.push(`  make new url at end of urls of newPerson with properties {label:"work", value:"${website}"}`);
  if (contact.note) lines.push(`  set note of newPerson to "${note}"`);
  lines.push("  save");
  lines.push("end tell");

  return lines.join("\n");
}

class ContactsService {
  async save(contact: ContactInfo): Promise<{ success: boolean; error?: string }> {
    if (!contact.firstName && !contact.lastName && !contact.company) {
      return { success: false, error: "Cannot save a contact without at least a name or company." };
    }

    const script = buildAppleScript(contact);
    try {
      await execFileAsync("osascript", ["-e", script], { timeout: 15_000 });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("not allowed") || message.includes("permission")) {
        return {
          success: false,
          error: "Snap2Contact does not have permission to access Contacts. Please grant access in System Settings > Privacy & Security > Contacts.",
        };
      }
      return { success: false, error: `Failed to save contact: ${message}` };
    }
  }
}

export const contactsService = new ContactsService();
