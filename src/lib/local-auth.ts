import type { MemberRole, MemberSpecialty, NmsPlatform } from "@/lib/member-types";

export type LocalAccount = Readonly<{
  email: string;
  name: string;
  nmsName: string;
  nmsCode: string;
  platforms: NmsPlatform[];
  specialty: MemberSpecialty;
  role: MemberRole;
}>;

export type LocalAccountOption = Readonly<{
  email: string;
  label: string;
  role: MemberRole;
  specialty: MemberSpecialty;
}>;

// Development accounts for LOCAL_AUTH: two admins, a moderator, and a regular user for each specialty.
// Only the accounts in editableLocalAccounts can edit their profile from the panel, and their changes persist across logins.
// The other local accounts are fixed for testing: their profile is reset to the values below on every login.

export const adminEmail = process.env.ADMIN_EMAIL || "adminovr@local";

export const editableLocalAccounts = [adminEmail];

export const localAccounts: readonly LocalAccount[] = [
  {
    email: adminEmail,
    name: "Local Admin OVR",
    nmsName: "LocalAdminOvr",
    nmsCode: "LOCALADMIN000",
    platforms: ["PC"],
    specialty: "explorer",
    role: "admin",
  },
  {
    email: "admin@local",
    name: "Local Admin",
    nmsName: "LocalAdmin",
    nmsCode: "LOCALADMIN001",
    platforms: ["PC"],
    specialty: "ranger",
    role: "admin",
  },
  {
    email: "moderator@local",
    name: "Local Moderator",
    nmsName: "LocalModerator",
    nmsCode: "LOCALMODER001",
    platforms: ["PC"],
    specialty: "explorer",
    role: "moderator",
  },
  {
    email: "ranger@local",
    name: "Local Ranger",
    nmsName: "LocalRanger",
    nmsCode: "LOCALRANGE001",
    platforms: ["PlayStation"],
    specialty: "ranger",
    role: "user",
  },
  {
    email: "explorer@local",
    name: "Local Explorer",
    nmsName: "LocalExplorer",
    nmsCode: "LOCALEXPLO001",
    platforms: ["Xbox"],
    specialty: "explorer",
    role: "user",
  },
  {
    email: "builder@local",
    name: "Local Builder",
    nmsName: "LocalBuilder",
    nmsCode: "LOCALBUILD001",
    platforms: ["PC"],
    specialty: "builder",
    role: "user",
  },
];

// Mai attivo in produzione o su Vercel, anche se LOCAL_AUTH è impostato per errore.
export function isLocalAuthEnabled() {
  return process.env.LOCAL_AUTH === "true" && process.env.NODE_ENV !== "production" && !process.env.VERCEL;
}

export function findLocalAccount(email: unknown) {
  if (typeof email !== "string") return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  return localAccounts.find((account) => account.email.toLowerCase() === normalizedEmail);
}

// Local accounts not listed in editableLocalAccounts are fixed test accounts: their profile cannot be edited. Google users are unaffected.
export function isFixedLocalAccount(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const editable = editableLocalAccounts.some((item) => item.toLowerCase() === normalizedEmail);
  return isLocalAuthEnabled() && !editable && Boolean(findLocalAccount(email));
}

export function getLocalAccountOptions(): LocalAccountOption[] | undefined {
  if (!isLocalAuthEnabled()) return undefined;
  return localAccounts.map(({ email, name, role, specialty }) => ({
    email,
    label: name,
    role,
    specialty,
  }));
}

export function getMissingAuthConfiguration() {
  if (isLocalAuthEnabled()) return [];
  return ["AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "ALLIANCE_ADMIN_EMAIL"].filter(
    (key) => !process.env[key],
  );
}
