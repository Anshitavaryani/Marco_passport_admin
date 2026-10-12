/** @format */

// The backend grants permissions by role abbreviation (not display name or id).
// Keep these tiers in sync with marco_passport_backend role.middleware.js.

export const ROLE = {
  SUPER_ADMIN: "SUP_ADM",
  ADMIN: "ADM",
  SUB_ADMIN: "SUB_ADM",
  ENGINEER: "ENG",
  EDITOR: "EDTR",
} as const;

export type AccessTier = "any" | "editor" | "admin" | "superAdmin";

const TIER_ROLES: Record<Exclude<AccessTier, "any">, string[]> = {
  superAdmin: [ROLE.SUPER_ADMIN],
  admin: [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN],
  editor: [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.SUB_ADMIN, ROLE.ENGINEER, ROLE.EDITOR],
};

// Roles that can log in to the admin panel at all. Anything else (e.g. USR,
// used by public sign-up) must never be assigned to an admin.
export const PANEL_ROLES: string[] = TIER_ROLES.editor;

export const canAccess = (abbreviation: string | undefined, tier: AccessTier) =>
  tier === "any" || (!!abbreviation && TIER_ROLES[tier].includes(abbreviation));
