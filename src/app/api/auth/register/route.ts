import { NextRequest } from "next/server";

import { buildBackendUrl } from "@/lib/backend-url";
import { forwardJson, proxyFailureResponse } from "@/lib/proxy-response";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const targetUrl = buildBackendUrl("/api/auth/register");

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
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
