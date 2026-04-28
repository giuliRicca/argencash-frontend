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

  const targetUrl = buildBackendUrl("/api/accounts");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Authorization: buildAuthorizationHeader(normalizedToken),
      },
      signal: controller.signal,
      cache: "no-store",
    });

    return forwardJson(response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          title: "Backend timeout.",
          detail: "Accounts request timed out while waiting for backend response.",
          status: 504,
        },
        { status: 504 },
      );
    }

    return proxyFailureResponse(targetUrl, error);
  } finally {
    clearTimeout(timeoutId);
  }
}

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

  const payload = await request.text();
  const targetUrl = buildBackendUrl("/api/accounts");

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: buildAuthorizationHeader(normalizedToken),
        "Content-Type": "application/json",
      },
      body: payload,
      cache: "no-store",
    });

    return forwardJson(response);
  } catch (error) {
    return proxyFailureResponse(targetUrl, error);
  }
}
