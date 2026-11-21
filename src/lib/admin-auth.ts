import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { type AdminActivity, type AdminPreferences, type AdminProfile, type AdminRole, type AdminStatus } from "@/lib/admin-types";

export { ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/admin-types";
export type { AdminActivity, AdminPreferences, AdminProfile } from "@/lib/admin-types";
export const ADMIN_SESSION_COOKIE = "sm_admin_session";
export const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;
export class AdminInputError extends Error {}
export class AdminAuthorizationError extends Error {}
export class AdminSetupError extends Error {}

export type AdminSession = {
  id: string; accountId: string; role: AdminRole; tokenHash: string;
  createdAt: string; expiresAt: string; userAgent: string;
};
type StoredAdminAccount = {
  id: string; username: string; fullName: string; email: string;
  passwordSalt: string; passwordHash: string;
  role: AdminRole; status: AdminStatus; createdAt: string;
  avatarMime: "image/png" | "image/jpeg" | "image/webp" | null;
  avatarKey: string | null; avatarUpdatedAt: string | null;
  lastLoginAt: string | null; preferences: AdminPreferences;
};
type SessionSummary = { id: string; createdAt: string; expiresAt: string; userAgent: string; current: boolean };
type PublicAdminAccount = Pick<AdminProfile, "username" | "fullName" | "email" | "role" | "status" | "accountCreatedAt" | "lastLoginAt">;
const defaultPreferences: AdminPreferences = { compactDashboard: false, reduceMotion: false };
let writeQueue: Promise<void> = Promise.resolve();

function storageDirectory() {
  const configured = process.env.ADMIN_DATA_DIR?.trim();
  const directory = configured ? path.resolve(process.cwd(), configured) : path.join(process.cwd(), ".data", "admin");
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relative = path.relative(publicDirectory, directory);
  if (relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))) {
    throw new AdminSetupError("Admin storage must be located outside the public directory.");
  }
  return directory;
}
const accountsFile = () => path.join(storageDirectory(), "accounts.json");
const legacyAccountFile = () => path.join(storageDirectory(), "account.json");
const sessionsDirectory = () => path.join(storageDirectory(), "sessions");
const activityFile = () => path.join(storageDirectory(), "activity.jsonl");
async function ensureStorageDirectory() {
  await fs.mkdir(storageDirectory(), { recursive: true, mode: 0o700 });
  await fs.mkdir(sessionsDirectory(), { recursive: true, mode: 0o700 });
}
function serializeWrites<T>(operation: () => Promise<T>): Promise<T> {
  const previous = writeQueue;
  let release = () => {};
  writeQueue = new Promise<void>((resolve) => { release = resolve; });
  return previous.then(operation).finally(release);
}
async function readJsonFile<T>(file: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
async function writeJsonFile(file: string, value: unknown) {
  await ensureStorageDirectory();
  const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600 });
    await fs.rename(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}
function isAccount(value: unknown): value is StoredAdminAccount {
  if (!value || typeof value !== "object") return false;
  const a = value as Partial<StoredAdminAccount>;
  return typeof a.id === "string" && typeof a.username === "string" &&
    typeof a.fullName === "string" && typeof a.email === "string" &&
    typeof a.passwordSalt === "string" && typeof a.passwordHash === "string" &&
    (a.role === "Owner" || a.role === "Administrator") &&
    (a.status === "Active" || a.status === "Pending" || a.status === "Rejected") &&
    typeof a.createdAt === "string" &&
    (a.avatarMime === null || a.avatarMime === "image/png" || a.avatarMime === "image/jpeg" || a.avatarMime === "image/webp") &&
    (a.avatarKey === null || (typeof a.avatarKey === "string" && /^[a-f0-9]{32}$/i.test(a.avatarKey))) &&
    (a.avatarMime === null) === (a.avatarKey === null) &&
    (a.avatarUpdatedAt === null || typeof a.avatarUpdatedAt === "string") &&
    (a.lastLoginAt === null || typeof a.lastLoginAt === "string") &&
    !!a.preferences && typeof a.preferences.compactDashboard === "boolean" && typeof a.preferences.reduceMotion === "boolean";
}
async function readAccounts(): Promise<StoredAdminAccount[]> {
  const stored = await readJsonFile<unknown>(accountsFile());
  if (Array.isArray(stored)) {
    if (!stored.every(isAccount)) throw new Error("Admin account storage is invalid.");
    return stored;
  }
  if (stored !== null) throw new Error("Admin account storage is invalid.");
  // One-time, backwards-compatible migration: the existing single account becomes the Owner.
  const legacy = await readJsonFile<Record<string, unknown>>(legacyAccountFile());
  if (!legacy) return [];
  const now = new Date().toISOString();
  const migrated: StoredAdminAccount = {
    id: randomBytes(16).toString("hex"),
    username: String(legacy.username || ""), fullName: String(legacy.fullName || ""),
    email: String(legacy.email || ""), passwordSalt: String(legacy.passwordSalt || ""),
    passwordHash: String(legacy.passwordHash || ""), role: "Owner", status: "Active",
    createdAt: typeof legacy.createdAt === "string" ? legacy.createdAt : now,
    avatarMime: legacy.avatarMime === "image/png" || legacy.avatarMime === "image/jpeg" || legacy.avatarMime === "image/webp" ? legacy.avatarMime : null,
    avatarKey: typeof legacy.avatarKey === "string" ? legacy.avatarKey : null,
    avatarUpdatedAt: typeof legacy.avatarUpdatedAt === "string" ? legacy.avatarUpdatedAt : null,
    lastLoginAt: typeof legacy.lastLoginAt === "string" ? legacy.lastLoginAt : null,
    preferences: legacy.preferences && typeof legacy.preferences === "object" ? {
      compactDashboard: Boolean((legacy.preferences as AdminPreferences).compactDashboard),
      reduceMotion: Boolean((legacy.preferences as AdminPreferences).reduceMotion),
    } : { ...defaultPreferences },
  };
  if (!isAccount(migrated)) throw new Error("Legacy admin account could not be migrated safely.");
  await writeJsonFile(accountsFile(), [migrated]);
  return [migrated];
}
async function writeAccounts(accounts: StoredAdminAccount[]) { await writeJsonFile(accountsFile(), accounts); }
function accountProfile(a: StoredAdminAccount): AdminProfile {
  return {
    username: a.username, fullName: a.fullName, email: a.email, role: a.role,
    status: a.status, accountCreatedAt: a.createdAt, lastLoginAt: a.lastLoginAt,
    avatarUrl: a.avatarMime && a.avatarKey ? `/api/admin/avatar?v=${encodeURIComponent(a.avatarUpdatedAt || "")}` : null,
    avatarUpdatedAt: a.avatarUpdatedAt, preferences: a.preferences,
  };
}
function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
function tokenFile(token: string) { return path.join(sessionsDirectory(), `${hashToken(token)}.json`); }
function hashEquals(left: string, right: string) {
  return timingSafeEqual(createHash("sha256").update(left).digest(), createHash("sha256").update(right).digest());
}
function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key)));
}
async function passwordMatches(password: string, salt: string, storedHash: string) {
  if (!/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(storedHash)) throw new Error("Admin password storage is invalid.");
  return timingSafeEqual(await derivePassword(password, salt), Buffer.from(storedHash, "hex"));
}
async function makeAccount(input: { username: string; password: string; fullName: string; email: string; role: AdminRole; status: AdminStatus }): Promise<StoredAdminAccount> {
  const salt = randomBytes(16).toString("hex");
  return {
    id: randomBytes(16).toString("hex"), username: input.username, fullName: input.fullName, email: input.email,
    passwordSalt: salt, passwordHash: (await derivePassword(input.password, salt)).toString("hex"),
    role: input.role, status: input.status, createdAt: new Date().toISOString(),
    avatarMime: null, avatarKey: null, avatarUpdatedAt: null, lastLoginAt: null,
    preferences: { ...defaultPreferences },
  };
}
async function recordActivity(accountId: string, type: AdminActivity["type"], description: string) {
  await ensureStorageDirectory();
  const item: AdminActivity & { accountId: string } = {
    id: randomBytes(12).toString("hex"), accountId, type, description, createdAt: new Date().toISOString(),
  };
  await fs.appendFile(activityFile(), `${JSON.stringify(item)}\n`, { encoding: "utf8", mode: 0o600 });
  const stat = await fs.stat(activityFile());
  if (stat.size > 1_000_000) {
    const lines = (await fs.readFile(activityFile(), "utf8")).trim().split(/\r?\n/);
    const temp = `${activityFile()}.${randomBytes(8).toString("hex")}.tmp`;
    try { await fs.writeFile(temp, `${lines.slice(-1000).join("\n")}\n`, { mode: 0o600 }); await fs.rename(temp, activityFile()); }
    finally { await fs.rm(temp, { force: true }); }
  }
}
async function createSession(account: StoredAdminAccount, userAgent: string) {
  const token = randomBytes(32).toString("base64url"), now = Date.now();
  const session: AdminSession = {
    id: randomBytes(12).toString("hex"), accountId: account.id, role: account.role,
    tokenHash: hashToken(token), createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ADMIN_SESSION_MAX_AGE * 1000).toISOString(), userAgent: userAgent.slice(0, 200),
  };
  await writeJsonFile(tokenFile(token), session);
  return { token, session };
}
async function readSessionFile(file: string): Promise<AdminSession | null> {
  const s = await readJsonFile<AdminSession>(file);
  if (!s) return null;
  if (typeof s.id !== "string" || typeof s.tokenHash !== "string" || typeof s.createdAt !== "string" ||
      typeof s.expiresAt !== "string" || typeof s.userAgent !== "string") throw new Error("Admin session storage is invalid.");
  return s;
}
async function findSessionAccount(token: string) {
  const session = await readSessionFile(tokenFile(token));
  if (!session || session.tokenHash !== hashToken(token) || Date.parse(session.expiresAt) <= Date.now()) return null;
  const accounts = await readAccounts();
  const account = accounts.find((a) => a.id === session.accountId);
  if (!account || account.status !== "Active" || account.role !== session.role) return null;
  return { session, account };
}
export async function authenticateAdmin(username: string, password: string, userAgent: string) {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password || normalized.length > 200 || password.length > 1024) return null;
  return serializeWrites(async () => {
    let accounts = await readAccounts();
    if (!accounts.length) {
      const configuredUser = process.env.ADMIN_USER, configuredPassword = process.env.ADMIN_PASSWORD;
      if (!configuredUser || !configuredPassword) throw new AdminSetupError("Admin login is not configured on the server.");
      if (!hashEquals(normalized, configuredUser.trim().toLowerCase()) || !hashEquals(password, configuredPassword)) return null;
      const owner = await makeAccount({ username: configuredUser.trim(), password: configuredPassword, fullName: "", email: "", role: "Owner", status: "Active" });
      accounts = [owner]; await writeAccounts(accounts);
    }
    const account = accounts.find((a) => a.username.toLowerCase() === normalized);
    if (!account || account.status !== "Active" || !(await passwordMatches(password, account.passwordSalt, account.passwordHash))) return null;
    account.lastLoginAt = new Date().toISOString();
    await writeAccounts(accounts);
    const created = await createSession(account, userAgent);
    await recordActivity(account.id, "login", "Signed in");
    return { ...created, profile: accountProfile(account) };
  });
}
export async function registerAdmin(input: { username: string; fullName: string; email: string; password: string }) {
  const username = input.username.trim(), normalized = username.toLowerCase();
  const fullName = input.fullName.trim(), email = input.email.trim().toLowerCase();
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) throw new AdminInputError("Username must be 3–40 characters and use letters, numbers, dots, underscores or hyphens.");
  if (!fullName || fullName.length > 100) throw new AdminInputError("Enter your full name (100 characters maximum).");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new AdminInputError("Enter a valid email address.");
  if (input.password.length < 12 || input.password.length > 1024) throw new AdminInputError("Password must be at least 12 characters.");
  return serializeWrites(async () => {
    const accounts = await readAccounts();
    if (accounts.some((a) => a.username.toLowerCase() === normalized)) throw new AdminInputError("That username is already registered.");
    if (accounts.some((a) => a.email.toLowerCase() === email)) throw new AdminInputError("That email address is already registered.");
    const account = await makeAccount({ username, fullName, email, password: input.password, role: "Administrator", status: "Pending" });
    accounts.push(account); await writeAccounts(accounts);
    await recordActivity(account.id, "registration", "Submitted an administrator registration for approval");
    return { username: account.username, status: account.status };
  });
}
export async function getAdminSession(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const result = await findSessionAccount(token);
  return result?.session || null;
}
export async function getAdminProfile(token: string) {
  const found = await findSessionAccount(token);
  if (!found) throw new Error("Admin session expired. Sign in again.");
  return accountProfile(found.account);
}
export async function updateAdminProfile(token: string, input: { fullName: string; email: string }) {
  return serializeWrites(async () => {
    const found = await findSessionAccount(token); if (!found) throw new Error("Admin session expired. Sign in again.");
    const accounts = await readAccounts(), a = accounts.find((x) => x.id === found.account.id)!;
    const email = input.email.trim().toLowerCase();
    if (email && accounts.some((x) => x.id !== a.id && x.email.toLowerCase() === email)) throw new AdminInputError("That email address is already in use.");
    a.fullName = input.fullName; a.email = email; await writeAccounts(accounts);
    await recordActivity(a.id, "profile", "Updated profile details"); return accountProfile(a);
  });
}
export async function updateAdminPreferences(token: string, preferences: Partial<AdminPreferences>) {
  return serializeWrites(async () => {
    const found = await findSessionAccount(token); if (!found) throw new Error("Admin session expired. Sign in again.");
    const accounts = await readAccounts(), a = accounts.find((x) => x.id === found.account.id)!;
    a.preferences = { ...a.preferences, ...preferences }; await writeAccounts(accounts);
    await recordActivity(a.id, "settings", "Updated dashboard preferences"); return accountProfile(a);
  });
}
export async function changeAdminPassword(token: string, currentPassword: string, newPassword: string, userAgent: string) {
  return serializeWrites(async () => {
    const found = await findSessionAccount(token); if (!found) throw new Error("Admin session expired. Sign in again.");
    const accounts = await readAccounts(), a = accounts.find((x) => x.id === found.account.id)!;
    if (!(await passwordMatches(currentPassword, a.passwordSalt, a.passwordHash))) return null;
    const replacementAccount = await makeAccount({ username: a.username, fullName: a.fullName, email: a.email, password: newPassword, role: a.role, status: a.status });
    Object.assign(replacementAccount, { id: a.id, createdAt: a.createdAt, avatarMime: a.avatarMime, avatarKey: a.avatarKey, avatarUpdatedAt: a.avatarUpdatedAt, lastLoginAt: a.lastLoginAt, preferences: a.preferences });
    accounts[accounts.findIndex((x) => x.id === a.id)] = replacementAccount; await writeAccounts(accounts);
    await revokeAccountSessions(a.id);
    const replacement = await createSession(replacementAccount, userAgent);
    await recordActivity(a.id, "password", "Changed account password"); return replacement;
  });
}
async function allSessionFiles() {
  try { return (await fs.readdir(sessionsDirectory())).filter((x) => x.endsWith(".json")); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return []; throw e; }
}
async function revokeAccountSessions(accountId: string, exceptHash?: string) {
  for (const name of await allSessionFiles()) {
    const file = path.join(sessionsDirectory(), name), s = await readSessionFile(file);
    if (s?.accountId === accountId && s.tokenHash !== exceptHash) await fs.rm(file, { force: true });
  }
}
export async function listAdminSessions(token: string) {
  const found = await findSessionAccount(token); if (!found) return [];
  const result: SessionSummary[] = [];
  for (const name of await allSessionFiles()) {
    const file = path.join(sessionsDirectory(), name), s = await readSessionFile(file);
    if (!s || s.accountId !== found.account.id) continue;
    if (Date.parse(s.expiresAt) <= Date.now()) { await fs.rm(file, { force: true }); continue; }
    result.push({ id: s.id, createdAt: s.createdAt, expiresAt: s.expiresAt, userAgent: s.userAgent, current: s.tokenHash === hashToken(token) });
  }
  return result.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
export async function revokeOtherAdminSessions(token: string) {
  return serializeWrites(async () => {
    const found = await findSessionAccount(token); if (!found) throw new Error("Admin session expired. Sign in again.");
    const before = (await listAdminSessions(token)).filter((s) => !s.current).length;
    await revokeAccountSessions(found.account.id, hashToken(token));
    await recordActivity(found.account.id, "session", "Signed out other sessions"); return before;
  });
}
export async function logoutAdminSession(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  const found = await findSessionAccount(token); if (!found) return;
  await fs.rm(tokenFile(token), { force: true }); await recordActivity(found.account.id, "session", "Signed out");
}
export async function readAdminActivity(token: string) {
  const found = await findSessionAccount(token); if (!found) throw new Error("Admin session expired. Sign in again.");
  try {
    return (await fs.readFile(activityFile(), "utf8")).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as AdminActivity & { accountId: string })
      .filter((item) => item.accountId === found.account.id).slice(-50).reverse().map(({ accountId: _accountId, ...item }) => item);
  } catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return []; throw e; }
}
export async function listAdminAccounts(token: string) {
  const found = await findSessionAccount(token);
  if (!found || found.account.role !== "Owner") throw new AdminAuthorizationError("Owner access is required.");
  return (await readAccounts()).map((a): PublicAdminAccount => ({
    username: a.username, fullName: a.fullName, email: a.email, role: a.role, status: a.status,
    accountCreatedAt: a.createdAt, lastLoginAt: a.lastLoginAt,
  })).sort((a,b) => (a.status === "Pending" ? -1 : 1) - (b.status === "Pending" ? -1 : 1));
}
export async function reviewAdminAccount(token: string, username: string, decision: "approve" | "reject") {
  return serializeWrites(async () => {
    const owner = await findSessionAccount(token);
    if (!owner || owner.account.role !== "Owner") throw new AdminInputError("Owner access is required.");
    const accounts = await readAccounts(), target = accounts.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
    if (!target) throw new AdminInputError("Administrator account not found.");
    if (target.role === "Owner") throw new AdminInputError("The Owner account cannot be changed here.");
    if (target.status !== "Pending") throw new AdminInputError("This account has already been reviewed.");
    target.status = decision === "approve" ? "Active" : "Rejected";
    await writeAccounts(accounts);
    if (decision === "reject") await revokeAccountSessions(target.id);
    await recordActivity(owner.account.id, "approval", `${decision === "approve" ? "Approved" : "Rejected"} administrator account ${target.username}`);
    await recordActivity(target.id, "approval", `Your administrator registration was ${decision === "approve" ? "approved" : "rejected"}`);
    return { username: target.username, status: target.status };
  });
}
async function detectImageMime(buffer: Buffer): Promise<StoredAdminAccount["avatarMime"]> {
  if (buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 12 && buffer.toString("ascii",0,4) === "RIFF" && buffer.toString("ascii",8,12) === "WEBP") return "image/webp";
  return null;
}
function avatarFile(mime: NonNullable<StoredAdminAccount["avatarMime"]>, key: string) {
  const ext = mime === "image/jpeg" ? "jpg" : mime.slice("image/".length);
  return path.join(storageDirectory(), `avatar-${key}.${ext}`);
}
export async function saveAdminAvatar(token: string, buffer: Buffer) {
  const mime = await detectImageMime(buffer); if (!mime) throw new AdminInputError("Choose a valid PNG, JPEG, or WebP image.");
  return serializeWrites(async () => {
    const found = await findSessionAccount(token); if (!found) throw new Error("Admin session expired. Sign in again.");
    const accounts = await readAccounts(), a = accounts.find((x) => x.id === found.account.id)!;
    await ensureStorageDirectory(); const key = randomBytes(16).toString("hex"), file = avatarFile(mime,key), temp = `${file}.${randomBytes(8).toString("hex")}.tmp`;
    try { await fs.writeFile(temp,buffer,{mode:0o600}); await fs.rename(temp,file); } finally { await fs.rm(temp,{force:true}); }
    const previousMime=a.avatarMime, previousKey=a.avatarKey;
    a.avatarMime=mime; a.avatarKey=key; a.avatarUpdatedAt=new Date().toISOString();
    try { await writeAccounts(accounts); } catch(e) { await fs.rm(file,{force:true}); throw e; }
    if(previousMime && previousKey) await fs.rm(avatarFile(previousMime,previousKey),{force:true});
    await recordActivity(a.id,"avatar","Updated profile picture"); return accountProfile(a);
  });
}
export async function readAdminAvatar(token: string) {
  const found = await findSessionAccount(token); if (!found) return null;
  const a=found.account; if(!a.avatarMime || !a.avatarKey) return null;
  return { mime:a.avatarMime, buffer:await fs.readFile(avatarFile(a.avatarMime,a.avatarKey)) };
}
export async function removeAdminAvatar(token: string) {
  return serializeWrites(async () => {
    const found=await findSessionAccount(token); if(!found) throw new Error("Admin session expired. Sign in again.");
    const accounts=await readAccounts(), a=accounts.find((x)=>x.id===found.account.id)!;
    const old=a.avatarMime && a.avatarKey ? avatarFile(a.avatarMime,a.avatarKey) : null;
    a.avatarMime=null; a.avatarKey=null; a.avatarUpdatedAt=null; await writeAccounts(accounts);
    if(old) await fs.rm(old,{force:true});
    await recordActivity(a.id,"avatar","Removed profile picture"); return accountProfile(a);
  });
}
