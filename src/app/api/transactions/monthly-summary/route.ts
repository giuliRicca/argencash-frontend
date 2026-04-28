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

  const month = request.nextUrl.searchParams.get("month");
  const year = request.nextUrl.searchParams.get("year");
  const searchParams = new URLSearchParams();

  if (month) {
    searchParams.set("month", month);
  }

  if (year) {
    searchParams.set("year", year);
  }

  const query = searchParams.toString();
  const targetUrl = buildBackendUrl(`/api/transactions/monthly-summary${query ? `?${query}` : ""}`);

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
