import type {
  MemberRole,
  MemberSpecialty,
  NmsPlatform,
} from "@/lib/member-types";

export type LocalAccount = Readonly<{
  email: string;
  name: string;
  label?: string;
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

// Account di sviluppo per LOCAL_AUTH: un admin, un moderatore e un utente normale per specializzazione.
// L'admin è un solo membro (stessa email, nome e codice amico) con un accesso per specializzazione.

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@local";

const adminSpecialties: readonly { specialty: MemberSpecialty; title: string }[] = [
  { specialty: "ranger", title: "Ranger" },
  { specialty: "explorer", title: "Explorer" },
  { specialty: "builder", title: "Builder" },
];

export const localAccounts: readonly LocalAccount[] = [
  ...adminSpecialties.map(
    ({ specialty, title }): LocalAccount => ({
      email: adminEmail,
      name: "Local Admin",
      label: `Local Admin ${title}`,
      nmsName: "LocalAdmin",
      nmsCode: "LOCALADMIN001",
      platforms: ["PC"],
      specialty,
      role: "admin",
    }),
  ),
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
  return (
    process.env.LOCAL_AUTH === "true" &&
    process.env.NODE_ENV !== "production" &&
    !process.env.VERCEL
  );
}

export function findLocalAccount(email: unknown, specialty?: unknown) {
  if (typeof email !== "string") return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = localAccounts.filter(
    (account) => account.email.toLowerCase() === normalizedEmail,
  );
  return accounts.find((account) => account.specialty === specialty) ?? accounts[0];
}

export function getLocalAccountOptions(): LocalAccountOption[] | undefined {
  if (!isLocalAuthEnabled()) return undefined;
  return localAccounts.map(({ email, name, label, role, specialty }) => ({
    email,
    label: label ?? name,
    role,
    specialty,
  }));
}

export function getMissingAuthConfiguration() {
  if (isLocalAuthEnabled()) return [];
  return [
    "AUTH_SECRET",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "ALLIANCE_ADMIN_EMAIL",
  ].filter((key) => !process.env[key]);
}
