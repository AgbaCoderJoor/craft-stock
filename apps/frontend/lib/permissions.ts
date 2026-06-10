export type AppRole = "admin" | "store_manager" | "production_staff" | "viewer";

export interface NavItem {
  href: string;
  label: string;
  roles: AppRole[] | "all";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/",                label: "Dashboard",       roles: "all" },
  { href: "/materials",       label: "Materials",        roles: "all" },
  { href: "/stock-movements", label: "Stock Movements",  roles: "all" },
  { href: "/finished-goods",  label: "Finished Goods",   roles: "all" },
  { href: "/reports",         label: "Reports",          roles: ["admin", "store_manager"] },
  { href: "/audit-logs",      label: "Audit Logs",       roles: ["admin"] },
  { href: "/users",           label: "Users",            roles: ["admin"] },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  store_manager: "Store Manager",
  production_staff: "Production Staff",
  viewer: "Viewer",
};

export const getVisibleNavItems = (role: string): NavItem[] =>
  NAV_ITEMS.filter((i) => i.roles === "all" || i.roles.includes(role as AppRole));

// Pricing / cost visibility — admin only
export const canViewInventoryValue = (r: string) => r === "admin";
export const canInputCostPrice     = (r: string) => r === "admin";
export const canViewPricingCharts  = (r: string) => r === "admin";

// Action permissions — mirror backend authorize() calls exactly
export const canCreateMaterial     = (r: string) => ["admin", "store_manager"].includes(r);
export const canEditMaterial       = (r: string) => ["admin", "store_manager"].includes(r);
export const canDeleteMaterial     = (r: string) => ["admin", "store_manager"].includes(r);
export const canCreateMovement     = (r: string) => ["admin", "store_manager", "production_staff"].includes(r);
export const canApproveMovement    = (r: string) => ["admin", "store_manager"].includes(r);
// IN and OUT approvals require admin; ADJUSTMENT and PRODUCTION allow store_manager too
export const canApproveMovementType = (r: string, type: string) =>
  ["IN", "OUT"].includes(type) ? r === "admin" : ["admin", "store_manager"].includes(r);
export const canConfirmMovement    = (r: string) => ["admin", "store_manager"].includes(r);
export const canCreateFinishedGood = (r: string) => ["admin", "store_manager", "production_staff"].includes(r);
export const canEditFinishedGood   = (r: string) => ["admin", "store_manager"].includes(r);
