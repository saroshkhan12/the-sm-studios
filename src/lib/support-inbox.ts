import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type SupportStatus = "open" | "in_progress" | "resolved";
export type SupportMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: SupportStatus;
};

let writeQueue: Promise<void> = Promise.resolve();

function inboxFile() {
  const configured = process.env.ADMIN_DATA_DIR?.trim();
  const directory = configured
    ? path.resolve(process.cwd(), configured)
    : path.join(process.cwd(), ".data", "admin");
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relative = path.relative(publicDirectory, directory);
  if (relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))) {
    throw new Error("Support inbox storage must be outside the public directory.");
  }
  return path.join(directory, "support-inbox.json");
}

async function readMessages(): Promise<SupportMessage[]> {
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(inboxFile(), "utf8"));
    if (!Array.isArray(parsed)) throw new Error("Support inbox data is invalid.");
    return parsed.filter((item): item is SupportMessage =>
      !!item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.name === "string" &&
      typeof item.email === "string" && typeof item.subject === "string" &&
      typeof item.message === "string" && typeof item.createdAt === "string" &&
      ["open", "in_progress", "resolved"].includes(item.status),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeMessages(messages: SupportMessage[]) {
  const file = inboxFile();
  const directory = path.dirname(file);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(messages, null, 2), { encoding: "utf8", mode: 0o600 });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const previous = writeQueue;
  let release = () => {};
  writeQueue = new Promise<void>((resolve) => { release = resolve; });
  return previous.then(operation).finally(release);
}

export async function createSupportMessage(input: Omit<SupportMessage, "id" | "createdAt" | "status">) {
  return serialize(async () => {
    const messages = await readMessages();
    const item: SupportMessage = {
      ...input,
      id: randomBytes(12).toString("hex"),
      createdAt: new Date().toISOString(),
      status: "open",
    };
    await writeMessages([item, ...messages].slice(0, 2000));
    return item.id;
  });
}

export async function listSupportMessages() {
  return readMessages();
}

export async function updateSupportMessage(id: string, status: SupportStatus) {
  return serialize(async () => {
    const messages = await readMessages();
    const index = messages.findIndex((item) => item.id === id);
    if (index < 0) return false;
    messages[index] = { ...messages[index], status };
    await writeMessages(messages);
    return true;
  });
}
