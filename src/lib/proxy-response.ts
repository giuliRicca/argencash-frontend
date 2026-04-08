import { NextResponse } from "next/server";

export async function forwardJson(response: Response) {
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return new NextResponse(null, {
      status: response.status,
    });
  }

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export function proxyFailureResponse(targetUrl: string, error: unknown) {
  const detail = error instanceof Error ? error.message : "Unknown proxy error.";

  return NextResponse.json(
    {
      title: "Backend connection failed.",
      detail: `Could not reach ${targetUrl}. ${detail}`,
      status: 502,
    },
    { status: 502 },
  );
}
