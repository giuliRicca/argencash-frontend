import { NextRequest, NextResponse } from "next/server";

import { buildAuthorizationHeader, normalizeAccessToken } from "@/lib/auth-token";
import { buildBackendUrl } from "@/lib/backend-url";
import { forwardJson, proxyFailureResponse } from "@/lib/proxy-response";

export async function POST(request: NextRequest) {
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

  const targetUrl = buildBackendUrl("/api/creditsettlements/process-due");

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
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
