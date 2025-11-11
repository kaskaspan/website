import type { UserPreferences } from "./settings";

export type UserRole = "student" | "teacher" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  locale: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}

export interface UserStatus {
  lastActiveAt?: string;
  streakDays: number;
  level: number;
  xp: number;
}

