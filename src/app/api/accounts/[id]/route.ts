import { NextRequest, NextResponse } from "next/server";

import { buildAuthorizationHeader, normalizeAccessToken } from "@/lib/auth-token";
import { buildBackendUrl } from "@/lib/backend-url";
import { forwardJson, proxyFailureResponse } from "@/lib/proxy-response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;
  const targetUrl = buildBackendUrl(`/api/accounts/${id}`);

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

export async function PUT(request: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;
  const payload = await request.text();
  const targetUrl = buildBackendUrl(`/api/accounts/${id}`);

  try {
    const response = await fetch(targetUrl, {
      method: "PUT",
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
