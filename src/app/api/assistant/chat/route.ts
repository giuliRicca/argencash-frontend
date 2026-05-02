import { NextRequest, NextResponse } from "next/server";

import { buildAuthorizationHeader, normalizeAccessToken } from "@/lib/auth-token";
import { buildBackendUrl } from "@/lib/backend-url";
import { assistantEnabled } from "@/lib/feature-flags";
import { forwardJson, proxyFailureResponse } from "@/lib/proxy-response";

export async function POST(request: NextRequest) {
  if (!assistantEnabled) {
    return NextResponse.json({ title: "Not found.", status: 404 }, { status: 404 });
  }

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
  const targetUrl = buildBackendUrl("/api/assistant/chat");

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
