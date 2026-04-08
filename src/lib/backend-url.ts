const fallbackBaseUrl = "http://localhost:5018";

export function buildBackendUrl(path: string): string {
  const baseUrl = process.env.ARGENCASH_API_BASE_URL ?? fallbackBaseUrl;
  return new URL(path, baseUrl).toString();
}
