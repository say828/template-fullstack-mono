import type { UserRole } from "../lib/types";

export function roleHomePath(role: UserRole, options?: { adminHost?: boolean }) {
  if (role === "SELLER") return "/seller/vehicles";
  if (role === "DEALER") return "/dealer/market";
  return options?.adminHost ? "/admin/trades" : "/admin/dashboard";
}
