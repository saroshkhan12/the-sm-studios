export const ADMIN_PASSWORD_MIN_LENGTH = 12;

export type AdminPreferences = {
  compactDashboard: boolean;
  reduceMotion: boolean;
};

export type AdminProfile = {
  username: string;
  fullName: string;
  email: string;
  role: "Administrator";
  status: "Active";
  accountCreatedAt: null;
  lastLoginAt: string | null;
  avatarUrl: string | null;
  avatarUpdatedAt: string | null;
  preferences: AdminPreferences;
};

export type AdminActivity = {
  id: string;
  type: "login" | "profile" | "avatar" | "password" | "session" | "settings";
  description: string;
  createdAt: string;
};
