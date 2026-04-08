const bearerPrefixPattern = /^Bearer\s+/i;

export function normalizeAccessToken(token: string): string {
  return token.replace(bearerPrefixPattern, "").trim();
}

export function buildAuthorizationHeader(token: string): string {
  return `Bearer ${normalizeAccessToken(token)}`;
}
