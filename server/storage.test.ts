import { describe, expect, it } from "vitest";
import { normalizeStorageKey, storageServiceError } from "./storage";

describe("storage key validation", () => {
  it("normalizes leading slashes while retaining valid tenant-style object paths", () => {
    expect(normalizeStorageKey("/organizations/12/actions/5/evidence.pdf")).toBe(
      "organizations/12/actions/5/evidence.pdf",
    );
  });

  it("rejects empty, traversal, malformed, and oversized storage paths", () => {
    expect(() => normalizeStorageKey(" ")).toThrow("Invalid storage key.");
    expect(() => normalizeStorageKey("organizations/../secret.txt")).toThrow("Invalid storage key.");
    expect(() => normalizeStorageKey("organizations//secret.txt")).toThrow("Invalid storage key.");
    expect(() => normalizeStorageKey("organizations\\secret.txt")).toThrow("Invalid storage key.");
    expect(() => normalizeStorageKey(`a/${"b".repeat(512)}`)).toThrow("Invalid storage key.");
  });

  it("keeps upstream storage errors status-only and free of response-body details", () => {
    expect(storageServiceError("presign", 502)).toBe("Storage presign failed (502).");
    expect(storageServiceError("download", 503)).toBe("Storage download failed (503).");
  });
});
