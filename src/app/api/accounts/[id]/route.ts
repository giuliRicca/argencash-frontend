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
  const transactionLimit = request.nextUrl.searchParams.get("transactionLimit") ?? "50";
  const targetUrl = buildBackendUrl(`/api/accounts/${id}?transactionLimit=${encodeURIComponent(transactionLimit)}`);
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
          title: "Tiempo de espera agotado.",
          detail: "La solicitud de detalle de cuenta agotó el tiempo de espera del backend.",
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
