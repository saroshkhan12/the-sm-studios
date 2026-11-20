import fs from "node:fs/promises";
import path from "node:path";
import {
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import {
  type AdminActivity,
  type AdminPreferences,
  type AdminProfile,
} from "@/lib/admin-types";

export { ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/admin-types";
export type {
  AdminActivity,
  AdminPreferences,
  AdminProfile,
} from "@/lib/admin-types";

export const ADMIN_SESSION_COOKIE = "sm_admin_session";
export const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;

export class AdminInputError extends Error {}
export class AdminSetupError extends Error {}

export type AdminSession = {
  id: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string;
};

type StoredAdminAccount = {
  username: string;
  fullName: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  avatarMime: "image/png" | "image/jpeg" | "image/webp" | null;
  avatarKey: string | null;
  avatarUpdatedAt: string | null;
  lastLoginAt: string | null;
  preferences: AdminPreferences;
};

type SessionSummary = Omit<AdminSession, "tokenHash"> & {
  current: boolean;
};

const defaultPreferences: AdminPreferences = {
  compactDashboard: false,
  reduceMotion: false,
};

let writeQueue: Promise<void> = Promise.resolve();

function storageDirectory() {
  const configured = process.env.ADMIN_DATA_DIR?.trim();
  const directory = configured
    ? path.resolve(process.cwd(), configured)
    : path.join(process.cwd(), ".data", "admin");
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relative = path.relative(publicDirectory, directory);
  if (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  ) {
    throw new AdminSetupError("Admin storage must be located outside the public directory.");
  }
  return directory;
}

function accountFile() {
  return path.join(storageDirectory(), "account.json");
}

function sessionsDirectory() {
  return path.join(storageDirectory(), "sessions");
}

function activityFile() {
  return path.join(storageDirectory(), "activity.jsonl");
}

async function ensureStorageDirectory() {
  await fs.mkdir(storageDirectory(), { recursive: true, mode: 0o700 });
  await fs.mkdir(sessionsDirectory(), { recursive: true, mode: 0o700 });
}

function serializeWrites<T>(operation: () => Promise<T>): Promise<T> {
  const previous = writeQueue;
  let release = () => {};
  writeQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  return previous
    .then(operation)
    .finally(release);
}

async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJsonFile(file: string, value: unknown) {
  await ensureStorageDirectory();
  const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

function parseAccount(value: unknown): StoredAdminAccount | null {
  if (!value || typeof value !== "object") return null;
  const account = value as Partial<StoredAdminAccount>;
  if (
    typeof account.username !== "string" ||
    typeof account.fullName !== "string" ||
    typeof account.email !== "string" ||
    typeof account.passwordSalt !== "string" ||
    typeof account.passwordHash !== "string" ||
    (account.avatarMime !== null &&
      account.avatarMime !== "image/png" &&
      account.avatarMime !== "image/jpeg" &&
      account.avatarMime !== "image/webp") ||
    (account.avatarKey !== null &&
      (typeof account.avatarKey !== "string" ||
        !/^[a-f0-9]{32}$/i.test(account.avatarKey))) ||
    (account.avatarMime === null) !== (account.avatarKey === null) ||
    (account.avatarUpdatedAt !== null &&
      typeof account.avatarUpdatedAt !== "string") ||
    (account.lastLoginAt !== null && typeof account.lastLoginAt !== "string")
  ) {
    throw new Error("Admin account storage is invalid.");
  }

  const preferences = account.preferences;
  if (
    !preferences ||
    typeof preferences.compactDashboard !== "boolean" ||
    typeof preferences.reduceMotion !== "boolean"
  ) {
    throw new Error("Admin account preferences are invalid.");
  }

  return account as StoredAdminAccount;
}

async function readAccount() {
  const value = await readJsonFile<unknown>(accountFile());
  return value === null ? null : parseAccount(value);
}

function accountProfile(account: StoredAdminAccount): AdminProfile {
  return {
    username: account.username,
    fullName: account.fullName,
    email: account.email,
    role: "Administrator",
    status: "Active",
    accountCreatedAt: null,
    lastLoginAt: account.lastLoginAt,
    avatarUrl: account.avatarMime && account.avatarKey
      ? `/api/admin/avatar?v=${encodeURIComponent(account.avatarUpdatedAt || "")}`
      : null,
    avatarUpdatedAt: account.avatarUpdatedAt,
    preferences: account.preferences,
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenFile(token: string) {
  return path.join(sessionsDirectory(), `${hashToken(token)}.json`);
}

function hashEquals(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function passwordMatches(
  password: string,
  salt: string,
  storedHash: string,
) {
  if (!/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(storedHash)) {
    throw new Error("Admin password storage is invalid.");
  }
  const actualHash = await derivePassword(password, salt);
  return timingSafeEqual(actualHash, Buffer.from(storedHash, "hex"));
}

async function makeAccount(
  username: string,
  password: string,
): Promise<StoredAdminAccount> {
  const passwordSalt = randomBytes(16).toString("hex");
  return {
    username,
    fullName: "",
    email: "",
    passwordSalt,
    passwordHash: (await derivePassword(password, passwordSalt)).toString("hex"),
    avatarMime: null,
    avatarKey: null,
    avatarUpdatedAt: null,
    lastLoginAt: null,
    preferences: { ...defaultPreferences },
  } satisfies StoredAdminAccount;
}

async function recordActivity(
  type: AdminActivity["type"],
  description: string,
) {
  await ensureStorageDirectory();
  const file = activityFile();
  const activity: AdminActivity = {
    id: randomBytes(12).toString("hex"),
    type,
    description,
    createdAt: new Date().toISOString(),
  };
  await fs.appendFile(file, `${JSON.stringify(activity)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });

  const stats = await fs.stat(file);
  if (stats.size > 1_000_000) {
    const lines = (await fs.readFile(file, "utf8")).trim().split(/\r?\n/);
    await writeJsonLines(file, lines.slice(-500));
  }
}

async function writeJsonLines(file: string, lines: string[]) {
  const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await fs.writeFile(temporary, `${lines.join("\n")}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function createSession(userAgent: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const session: AdminSession = {
    id: randomBytes(12).toString("hex"),
    tokenHash: hashToken(token),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ADMIN_SESSION_MAX_AGE * 1000).toISOString(),
    userAgent: userAgent.slice(0, 200),
  };
  await writeJsonFile(tokenFile(token), session);
  return { token, session };
}

async function readSessionFile(file: string): Promise<AdminSession | null> {
  const session = await readJsonFile<AdminSession>(file);
  if (
    !session ||
    typeof session.id !== "string" ||
    typeof session.tokenHash !== "string" ||
    typeof session.createdAt !== "string" ||
    typeof session.expiresAt !== "string" ||
    typeof session.userAgent !== "string"
  ) {
    if (session === null) return null;
    throw new Error("Admin session storage is invalid.");
  }
  return session;
}

export async function authenticateAdmin(
  username: string,
  password: string,
  userAgent: string,
) {
  if (!username || !password || username.length > 200 || password.length > 1024) {
    return null;
  }

  return serializeWrites(async () => {
    let account = await readAccount();
    if (!account) {
      const configuredUsername = process.env.ADMIN_USER;
      const configuredPassword = process.env.ADMIN_PASSWORD;
      if (!configuredUsername || !configuredPassword) {
        throw new AdminSetupError("Admin login is not configured on the server.");
      }
      if (
        !hashEquals(username, configuredUsername) ||
        !hashEquals(password, configuredPassword)
      ) {
        return null;
      }
      account = await makeAccount(configuredUsername, configuredPassword);
      await writeJsonFile(accountFile(), account);
    } else if (
      !hashEquals(username, account.username) ||
      !(await passwordMatches(password, account.passwordSalt, account.passwordHash))
    ) {
      return null;
    }

    account.lastLoginAt = new Date().toISOString();
    await writeJsonFile(accountFile(), account);
    const { token, session } = await createSession(userAgent);
    await recordActivity("login", "Signed in");
    return { token, session, profile: accountProfile(account) };
  });
}

export async function getAdminSession(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;

  const session = await readSessionFile(tokenFile(token));
  if (!session || session.tokenHash !== hashToken(token)) return null;
  if (Date.parse(session.expiresAt) <= Date.now()) {
    await fs.rm(tokenFile(token), { force: true });
    return null;
  }
  if (!(await readAccount())) return null;
  return session;
}

export async function getAdminProfile() {
  const account = await readAccount();
  if (!account) throw new Error("Admin profile has not been initialized.");
  return accountProfile(account);
}

export async function updateAdminProfile(input: {
  fullName: string;
  email: string;
}) {
  return serializeWrites(async () => {
    const account = await readAccount();
    if (!account) throw new Error("Admin profile has not been initialized.");
    account.fullName = input.fullName;
    account.email = input.email;
    await writeJsonFile(accountFile(), account);
    await recordActivity("profile", "Updated profile details");
    return accountProfile(account);
  });
}

export async function updateAdminPreferences(
  preferences: Partial<AdminPreferences>,
) {
  return serializeWrites(async () => {
    const account = await readAccount();
    if (!account) throw new Error("Admin profile has not been initialized.");
    account.preferences = { ...account.preferences, ...preferences };
    await writeJsonFile(accountFile(), account);
    await recordActivity("settings", "Updated dashboard preferences");
    return accountProfile(account);
  });
}

export async function changeAdminPassword(
  currentToken: string,
  currentPassword: string,
  newPassword: string,
  userAgent: string,
) {
  return serializeWrites(async () => {
    const session = await getAdminSession(currentToken);
    if (!session) throw new Error("Admin session expired. Sign in again.");
    const account = await readAccount();
    if (!account) throw new Error("Admin profile has not been initialized.");
    if (
      !(await passwordMatches(
        currentPassword,
        account.passwordSalt,
        account.passwordHash,
      ))
    ) {
      return null;
    }

    const updatedAccount = await makeAccount(account.username, newPassword);
    updatedAccount.fullName = account.fullName;
    updatedAccount.email = account.email;
    updatedAccount.avatarMime = account.avatarMime;
    updatedAccount.avatarKey = account.avatarKey;
    updatedAccount.avatarUpdatedAt = account.avatarUpdatedAt;
    updatedAccount.lastLoginAt = account.lastLoginAt;
    updatedAccount.preferences = account.preferences;
    await writeJsonFile(accountFile(), updatedAccount);
    await revokeAllAdminSessions();
    const replacement = await createSession(userAgent);
    await recordActivity("password", "Changed account password");
    return replacement;
  });
}

export async function listAdminSessions(currentToken: string) {
  const currentHash = hashToken(currentToken);
  let files: string[];
  try {
    files = await fs.readdir(sessionsDirectory());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const sessions: SessionSummary[] = [];
  for (const name of files.filter((entry) => entry.endsWith(".json"))) {
    const file = path.join(sessionsDirectory(), name);
    const session = await readSessionFile(file);
    if (!session) continue;
    if (Date.parse(session.expiresAt) <= Date.now()) {
      await fs.rm(file, { force: true });
      continue;
    }
    sessions.push({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      current: session.tokenHash === currentHash,
    });
  }
  return sessions.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function revokeOtherAdminSessions(currentToken: string) {
  return serializeWrites(async () => {
    const currentSession = await getAdminSession(currentToken);
    if (!currentSession) throw new Error("Admin session expired. Sign in again.");
    const currentHash = hashToken(currentToken);
    let files: string[];
    try {
      files = await fs.readdir(sessionsDirectory());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
      throw error;
    }

    let revoked = 0;
    for (const name of files.filter((entry) => entry.endsWith(".json"))) {
      const file = path.join(sessionsDirectory(), name);
      const session = await readSessionFile(file);
      if (session && session.tokenHash !== currentHash) {
        await fs.rm(file, { force: true });
        revoked += 1;
      }
    }
    await recordActivity("session", "Signed out other sessions");
    return revoked;
  });
}

export async function logoutAdminSession(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  const session = await getAdminSession(token);
  if (!session) return;
  await fs.rm(tokenFile(token), { force: true });
  await recordActivity("session", "Signed out");
}

async function revokeAllAdminSessions() {
  let files: string[];
  try {
    files = await fs.readdir(sessionsDirectory());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  await Promise.all(
    files
      .filter((entry) => entry.endsWith(".json"))
      .map((entry) => fs.rm(path.join(sessionsDirectory(), entry), { force: true })),
  );
}

export async function readAdminActivity() {
  try {
    const content = await fs.readFile(activityFile(), "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-50)
      .reverse()
      .map((line) => JSON.parse(line) as AdminActivity);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function detectImageMime(buffer: Buffer): StoredAdminAccount["avatarMime"] {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function avatarFile(
  mime: NonNullable<StoredAdminAccount["avatarMime"]>,
  key: string,
) {
  const extension = mime === "image/jpeg" ? "jpg" : mime.slice("image/".length);
  return path.join(storageDirectory(), `avatar-${key}.${extension}`);
}

export async function saveAdminAvatar(buffer: Buffer) {
  const mime = detectImageMime(buffer);
  if (!mime) throw new AdminInputError("Choose a valid PNG, JPEG, or WebP image.");
  return serializeWrites(async () => {
    const account = await readAccount();
    if (!account) throw new Error("Admin profile has not been initialized.");
    await ensureStorageDirectory();
    const key = randomBytes(16).toString("hex");
    const file = avatarFile(mime, key);
    const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await fs.writeFile(temporary, buffer, { mode: 0o600 });
      await fs.rename(temporary, file);
    } finally {
      await fs.rm(temporary, { force: true });
    }

    const previousMime = account.avatarMime;
    const previousKey = account.avatarKey;
    account.avatarMime = mime;
    account.avatarKey = key;
    account.avatarUpdatedAt = new Date().toISOString();
    try {
      await writeJsonFile(accountFile(), account);
    } catch (error) {
      await fs.rm(file, { force: true });
      throw error;
    }
    if (previousMime && previousKey) {
      await fs.rm(avatarFile(previousMime, previousKey), { force: true });
    }
    await recordActivity("avatar", "Updated profile picture");
    return accountProfile(account);
  });
}

export async function readAdminAvatar() {
  const account = await readAccount();
  if (!account?.avatarMime || !account.avatarKey) return null;
  return {
    mime: account.avatarMime,
    buffer: await fs.readFile(avatarFile(account.avatarMime, account.avatarKey)),
  };
}

export async function removeAdminAvatar() {
  return serializeWrites(async () => {
    const account = await readAccount();
    if (!account) throw new Error("Admin profile has not been initialized.");
    const previousAvatar =
      account.avatarMime && account.avatarKey
        ? avatarFile(account.avatarMime, account.avatarKey)
        : null;
    account.avatarMime = null;
    account.avatarKey = null;
    account.avatarUpdatedAt = null;
    await writeJsonFile(accountFile(), account);
    if (previousAvatar) await fs.rm(previousAvatar, { force: true });
    await recordActivity("avatar", "Removed profile picture");
    return accountProfile(account);
  });
}
