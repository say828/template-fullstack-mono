function readHostname() {
  if (typeof window === "undefined") return "";
  return window.location.hostname.toLowerCase();
}

export function resolveApiBaseUrl(configuredBaseUrl?: string, hostname = readHostname()) {
  if (configuredBaseUrl && configuredBaseUrl.trim()) {
    return configuredBaseUrl;
  }
  return "/api/v1";
}
