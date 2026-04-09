import { NextRequest, NextResponse } from "next/server";

import { buildAuthorizationHeader, normalizeAccessToken } from "@/lib/auth-token";
import { buildBackendUrl } from "@/lib/backend-url";
import { forwardJson, proxyFailureResponse } from "@/lib/proxy-response";

export async function GET(request: NextRequest) {
  const incomingAuthorization = request.headers.get("Authorization") ?? "";
  const normalizedToken = normalizeAccessToken(incomingAuthorization);

  if (!normalizedToken) {
    return NextResponse.json(
      {
        title: "Authentication failed.",
        detail: "Missing access token.",
        status: 401,
      },
      { status: 401 },
    );
  }

  const search = request.nextUrl.searchParams;
  const baseCurrency = search.get("baseCurrency") ?? "USD";
  const targetCurrency = search.get("targetCurrency") ?? "ARS";
  const rateTypes = search.getAll("rateTypes");
  const rateTypesQuery = rateTypes.map((rateType) => `rateTypes=${encodeURIComponent(rateType)}`).join("&");
  const query = rateTypesQuery.length > 0
    ? `baseCurrency=${encodeURIComponent(baseCurrency)}&targetCurrency=${encodeURIComponent(targetCurrency)}&${rateTypesQuery}`
    : `baseCurrency=${encodeURIComponent(baseCurrency)}&targetCurrency=${encodeURIComponent(targetCurrency)}`;
  const targetUrl = buildBackendUrl(`/api/exchangerates/live/batch?${query}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Authorization: buildAuthorizationHeader(normalizedToken),
      },
      cache: "no-store",
    });

    return forwardJson(response);
  } catch (error) {
    return proxyFailureResponse(targetUrl, error);
  }
}
