import type { UserRole } from "../lib/types";

export function roleHomePath(role: UserRole) {
  if (role === "SELLER") return "/seller/vehicles";
  if (role === "DEALER") return "/dealer/market";
  return "/dashboard";
}
