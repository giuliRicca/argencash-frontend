import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import { useUnauthorizedRedirect } from "@/lib/hooks/use-unauthorized-redirect";

const { replaceMock, clearTokenMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  clearTokenMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/lib/storage", () => ({
  clearToken: clearTokenMock,
}));

describe("useUnauthorizedRedirect", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    clearTokenMock.mockReset();
  });

  it("redirects only once after unauthorized error", () => {
    const unauthorizedError = new ApiError("Unauthorized", 401);

    const { rerender } = renderHook(
      ({ errors }: { errors: readonly unknown[] }) => useUnauthorizedRedirect(errors),
      { initialProps: { errors: [unauthorizedError] as readonly unknown[] } },
    );

    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/unauthorized");

    rerender({ errors: [unauthorizedError] as readonly unknown[] });

    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledTimes(1);
  });

  it("does not redirect when errors are not unauthorized", () => {
    renderHook(({ errors }: { errors: readonly unknown[] }) => useUnauthorizedRedirect(errors), {
      initialProps: { errors: [new ApiError("Forbidden", 403)] as readonly unknown[] },
    });

    expect(clearTokenMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
