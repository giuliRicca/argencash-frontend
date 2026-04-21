import { describe, expect, it } from "vitest";

import { ApiError, isUnauthorizedApiError } from "@/lib/api";

describe("isUnauthorizedApiError", () => {
  it("returns true for ApiError with 401 status", () => {
    expect(isUnauthorizedApiError(new ApiError("Unauthorized", 401))).toBe(true);
  });

  it("returns false for ApiError with non-401 status", () => {
    expect(isUnauthorizedApiError(new ApiError("Forbidden", 403))).toBe(false);
  });

  it("returns false for non-ApiError values", () => {
    expect(isUnauthorizedApiError(new Error("Unauthorized"))).toBe(false);
    expect(isUnauthorizedApiError(null)).toBe(false);
  });
});
