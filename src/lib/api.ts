import { ApiProblem } from "@/lib/contracts";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isUnauthorizedApiError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    const body = (await tryParseProblem(response)) ?? {};
    throw new ApiError(body.detail ?? body.title ?? "Request failed.", response.status);
  }

  return (await response.json()) as T;
}

export async function postJson<T, D = unknown>(input: RequestInfo | URL, data: D, init?: RequestInit): Promise<T> {
  return requestJson<T>(input, {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    body: JSON.stringify(data),
  });
}

export async function putJson<T, D = unknown>(input: RequestInfo | URL, data: D, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = (await tryParseProblem(response)) ?? {};
    throw new ApiError(body.detail ?? body.title ?? "Request failed.", response.status);
  }

  const responseText = await response.text();

  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}

export async function deleteRequest(input: RequestInfo | URL, init?: RequestInit): Promise<void> {
  const response = await fetch(input, {
    ...init,
    method: "DELETE",
  });

  if (!response.ok) {
    const body = (await tryParseProblem(response)) ?? {};
    throw new ApiError(body.detail ?? body.title ?? "Request failed.", response.status);
  }
}

async function tryParseProblem(response: Response): Promise<ApiProblem | null> {
  try {
    return (await response.json()) as ApiProblem;
  } catch {
    return null;
  }
}
