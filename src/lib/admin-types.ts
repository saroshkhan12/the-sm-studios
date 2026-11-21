export const ADMIN_PASSWORD_MIN_LENGTH = 12;

export type AdminRole = "Owner" | "Administrator";
export type AdminStatus = "Pending" | "Active" | "Rejected";
export type AdminPreferences = { compactDashboard: boolean; reduceMotion: boolean };
export type AdminProfile = {
  username: string;
  fullName: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  accountCreatedAt: string;
  lastLoginAt: string | null;
  avatarUrl: string | null;
  avatarUpdatedAt: string | null;
  preferences: AdminPreferences;
};
export type AdminActivity = {
  id: string;
  type: "login" | "profile" | "avatar" | "password" | "session" | "settings" | "registration" | "approval";
  description: string;
  createdAt: string;
};