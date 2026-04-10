export type ConsoleVariant = "market" | "admin";

const ADMIN_HOSTS = new Set(["admin.dev.example.com", "admin.example.com"]);
const ADMIN_API_BASE_BY_HOST: Record<string, string> = {
  "admin.dev.example.com": "https://web.dev.example.com/api/v1",
  "admin.example.com": "https://web.example.com/api/v1",
};

function readHostname() {
  if (typeof window === "undefined") return "";
  return window.location.hostname.toLowerCase();
}

function readPathname() {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}

export function detectConsoleVariant(hostname = readHostname(), pathname = readPathname()): ConsoleVariant {
  if (pathname.startsWith("/admin")) return "admin";
  if (ADMIN_HOSTS.has(hostname)) return "admin";
  return "market";
}

export function isAdminConsoleHost(hostname = readHostname(), pathname = readPathname()) {
  return detectConsoleVariant(hostname, pathname) === "admin";
}

export function resolveApiBaseUrl(configuredBaseUrl?: string, hostname = readHostname()) {
  if (configuredBaseUrl && configuredBaseUrl.trim()) {
    return configuredBaseUrl;
  }
  if (ADMIN_API_BASE_BY_HOST[hostname]) {
    return ADMIN_API_BASE_BY_HOST[hostname];
  }
  return "/api/v1";
}
